import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui";
import { DisconnectButton } from "@/components/disconnect-button";
import { setGoogleDriveFolder } from "@/lib/actions/integrations";
import { format } from "date-fns";

const ERROR_MESSAGES: Record<string, string> = {
  google_invalid_state: "That Google connection attempt looked invalid or had expired — please try Connect Google again.",
  google_token_exchange_failed: "Google rejected the connection attempt. Double-check the redirect URIs in Google Cloud Console match this app exactly, then try again.",
  xero_invalid_state: "That Xero connection attempt looked invalid or had expired — please try Connect Xero again.",
  xero_token_exchange_failed: "Xero rejected the connection attempt. Double-check the redirect URI in the Xero app settings matches this app exactly, then try again.",
};

function errorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? `Something went wrong connecting (code: ${code}). Try again, and if it keeps happening, check the Vercel logs for details.`;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const session = await auth();
  const { error, connected } = await searchParams;
  const [google, xero] = await Promise.all([
    prisma.integrationConnection.findFirst({ where: { userId: session!.user.id, provider: "GOOGLE" } }),
    prisma.integrationConnection.findFirst({ where: { userId: session!.user.id, provider: "XERO" } }),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Manage connected accounts and sync preferences" />

      {error && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMessage(error)}
        </div>
      )}
      {connected && !error && (
        <div className="mb-6 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {connected === "google" ? "Google" : "Xero"} connected successfully.
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-card-foreground">Google Workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Drive docs into the Docs Hub and Calendar events into Today&apos;s Schedule + Capacity Planner.
              </p>
              {google && (
                <p className="mt-2 text-xs text-muted-foreground">Connected {format(google.connectedAt, "d MMM yyyy")}</p>
              )}
            </div>
            {google ? (
              <div className="flex items-center gap-3">
                <Badge tone="success">Connected</Badge>
                <DisconnectButton provider="GOOGLE" />
              </div>
            ) : (
              <a
                href="/api/integrations/google/connect"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Connect Google
              </a>
            )}
          </div>

          {google && (
            <form action={setGoogleDriveFolder} className="mt-4 flex items-center gap-2 border-t border-border pt-4">
              <label className="text-xs text-muted-foreground">
                Drive folder ID to sync (optional — leave blank to sync all Docs)
              </label>
              <input
                name="folderId"
                defaultValue={google.externalId ?? ""}
                placeholder="e.g. 1AbCDeFGhijkLmnOpQ"
                className="input flex-1"
              />
              <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
                Save
              </button>
            </form>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-card-foreground">Xero</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Syncs invoices and payment status once a day, and rolls paid invoices into revenue this month.
              </p>
              {xero && <p className="mt-2 text-xs text-muted-foreground">Connected {format(xero.connectedAt, "d MMM yyyy")}</p>}
            </div>
            {xero ? (
              <div className="flex items-center gap-3">
                <Badge tone="success">Connected</Badge>
                <DisconnectButton provider="XERO" />
              </div>
            ) : (
              <a
                href="/api/integrations/xero/connect"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Connect Xero
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
