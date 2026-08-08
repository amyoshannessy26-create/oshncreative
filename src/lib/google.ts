import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { IntegrationProvider } from "@prisma/client";

// Read-only scopes: we only ever list/read Drive docs and Calendar events,
// never write to the user's Google account.
export const GOOGLE_INTEGRATION_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_INTEGRATION_REDIRECT_URI
  );
}

export function getGoogleConnectUrl(state: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensures a refresh_token is issued even on repeat connects
    scope: GOOGLE_INTEGRATION_SCOPES,
    state,
  });
}

export async function saveGoogleConnection(userId: string, code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) throw new Error("Google did not return an access token");

  await prisma.integrationConnection.upsert({
    where: { userId_provider: { userId, provider: IntegrationProvider.GOOGLE } },
    create: {
      userId,
      provider: IntegrationProvider.GOOGLE,
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope,
    },
    update: {
      accessTokenEnc: encrypt(tokens.access_token),
      // Google only returns refresh_token on the first consent — keep the
      // existing one on reconnect if a fresh one wasn't issued.
      ...(tokens.refresh_token ? { refreshTokenEnc: encrypt(tokens.refresh_token) } : {}),
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope,
    },
  });
}

/**
 * Returns an authenticated OAuth2 client for the given user's Google
 * connection, or null if not connected. Automatically refreshes and
 * persists a new access token when it's expired.
 */
export async function getGoogleClientForUser(userId: string) {
  const connection = await prisma.integrationConnection.findUnique({
    where: { userId_provider: { userId, provider: IntegrationProvider.GOOGLE } },
  });
  if (!connection || !connection.refreshTokenEnc) return null;

  const client = getOAuthClient();
  client.setCredentials({
    access_token: decrypt(connection.accessTokenEnc),
    refresh_token: decrypt(connection.refreshTokenEnc),
    expiry_date: connection.expiresAt?.getTime(),
  });

  client.on("tokens", (tokens) => {
    if (!tokens.access_token) return;
    prisma.integrationConnection
      .update({
        where: { id: connection.id },
        data: {
          accessTokenEnc: encrypt(tokens.access_token),
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      })
      .catch(() => {});
  });

  return client;
}

export async function listGoogleDocs(userId: string, folderId?: string | null) {
  const client = await getGoogleClientForUser(userId);
  if (!client) return [];

  const drive = google.drive({ version: "v3", auth: client });
  const query = [
    "mimeType = 'application/vnd.google-apps.document'",
    "trashed = false",
    ...(folderId ? [`'${folderId}' in parents`] : []),
  ].join(" and ");

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name, webViewLink)",
    pageSize: 100,
  });

  return res.data.files ?? [];
}

export async function listTodaysCalendarEvents(userId: string) {
  const client = await getGoogleClientForUser(userId);
  if (!client) return [];

  const calendar = google.calendar({ version: "v3", auth: client });
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items ?? [];
}

export async function listWeekCalendarEvents(userId: string, weekStart: Date, weekEnd: Date) {
  const client = await getGoogleClientForUser(userId);
  if (!client) return [];

  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items ?? [];
}
