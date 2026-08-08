import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { IntegrationProvider, InvoiceStatus } from "@prisma/client";

const AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize";
const TOKEN_URL = "https://identity.xero.com/connect/token";
const CONNECTIONS_URL = "https://api.xero.com/connections";
const INVOICES_URL = "https://api.xero.com/api.xro/2.0/Invoices";

// offline_access is required for a refresh_token so the connection survives
// past the ~30 minute access-token lifetime without re-consent.
const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "accounting.transactions.read",
  "accounting.contacts.read",
  "offline_access",
].join(" ");

function base64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** PKCE code_verifier/code_challenge pair per RFC 7636 (S256). */
export function generatePkcePair() {
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function getXeroConnectUrl(state: string, codeChallenge: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.XERO_CLIENT_ID!,
    redirect_uri: process.env.XERO_REDIRECT_URI!,
    scope: XERO_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function basicAuthHeader() {
  const raw = `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

async function requestToken(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`Xero token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };
}

export async function saveXeroConnection(userId: string, code: string, codeVerifier: string) {
  const tokens = await requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.XERO_REDIRECT_URI!,
    code_verifier: codeVerifier,
  });

  const connectionsRes = await fetch(CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const connections = (await connectionsRes.json()) as { tenantId: string; tenantName: string }[];
  const tenantId = connections[0]?.tenantId;

  await prisma.integrationConnection.upsert({
    where: { userId_provider: { userId, provider: IntegrationProvider.XERO } },
    create: {
      userId,
      provider: IntegrationProvider.XERO,
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: encrypt(tokens.refresh_token),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      externalId: tenantId,
      metadata: { tenantName: connections[0]?.tenantName },
    },
    update: {
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: encrypt(tokens.refresh_token),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      externalId: tenantId,
      metadata: { tenantName: connections[0]?.tenantName },
    },
  });
}

/**
 * Returns a valid {accessToken, tenantId} for the user's Xero connection,
 * refreshing (and persisting the rotated refresh_token) if the access token
 * has expired. Returns null if not connected.
 */
export async function getXeroCredentialsForUser(userId: string) {
  const connection = await prisma.integrationConnection.findUnique({
    where: { userId_provider: { userId, provider: IntegrationProvider.XERO } },
  });
  if (!connection || !connection.refreshTokenEnc || !connection.externalId) return null;

  const isExpired = !connection.expiresAt || connection.expiresAt.getTime() < Date.now() + 60_000;
  if (!isExpired) {
    return { accessToken: decrypt(connection.accessTokenEnc), tenantId: connection.externalId };
  }

  const tokens = await requestToken({
    grant_type: "refresh_token",
    refresh_token: decrypt(connection.refreshTokenEnc),
  });

  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: encrypt(tokens.refresh_token), // Xero rotates refresh tokens on every use
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return { accessToken: tokens.access_token, tenantId: connection.externalId };
}

type XeroInvoice = {
  InvoiceID: string;
  Type: "ACCREC" | "ACCPAY";
  Status: "DRAFT" | "SUBMITTED" | "AUTHORISED" | "PAID" | "VOIDED" | "DELETED";
  Total: number;
  AmountDue: number;
  DateString?: string;
  DueDateString?: string;
  Contact?: { Name?: string; EmailAddress?: string };
};

function mapXeroStatus(invoice: XeroInvoice): InvoiceStatus {
  if (invoice.Status === "PAID") return InvoiceStatus.PAID;
  if (invoice.Status === "VOIDED" || invoice.Status === "DELETED") return InvoiceStatus.VOIDED;
  if (invoice.Status === "DRAFT") return InvoiceStatus.DRAFT;
  if (invoice.Status === "SUBMITTED") return InvoiceStatus.SUBMITTED;
  // AUTHORISED: overdue if past due date with an amount still owing
  if (invoice.DueDateString && invoice.AmountDue > 0 && new Date(invoice.DueDateString) < new Date()) {
    return InvoiceStatus.OVERDUE;
  }
  return InvoiceStatus.AUTHORISED;
}

/** Pulls sales invoices (ACCREC) from Xero and upserts them into the Invoice table. */
export async function syncXeroInvoicesForUser(userId: string) {
  const credentials = await getXeroCredentialsForUser(userId);
  if (!credentials) return { synced: 0 };

  const res = await fetch(`${INVOICES_URL}?where=Type%3D%3D%22ACCREC%22&order=UpdatedDateUTC%20DESC`, {
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Xero-tenant-id": credentials.tenantId,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Xero invoices request failed: ${res.status} ${await res.text()}`);

  const { Invoices } = (await res.json()) as { Invoices: XeroInvoice[] };

  let synced = 0;
  for (const invoice of Invoices) {
    const client = invoice.Contact?.EmailAddress
      ? await prisma.client.findFirst({ where: { email: invoice.Contact.EmailAddress } })
      : invoice.Contact?.Name
        ? await prisma.client.findFirst({ where: { name: invoice.Contact.Name } })
        : null;

    await prisma.invoice.upsert({
      where: { xeroInvoiceId: invoice.InvoiceID },
      create: {
        xeroInvoiceId: invoice.InvoiceID,
        amount: invoice.Total,
        status: mapXeroStatus(invoice),
        issuedDate: invoice.DateString ? new Date(invoice.DateString) : null,
        dueDate: invoice.DueDateString ? new Date(invoice.DueDateString) : null,
        clientId: client?.id ?? null,
      },
      update: {
        amount: invoice.Total,
        status: mapXeroStatus(invoice),
        issuedDate: invoice.DateString ? new Date(invoice.DateString) : null,
        dueDate: invoice.DueDateString ? new Date(invoice.DueDateString) : null,
        clientId: client?.id ?? null,
      },
    });
    synced += 1;
  }

  return { synced };
}
