import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui";
import { DisconnectButton } from "@/components/disconnect-button";
import { setGoogleDriveFolder } from "@/lib/actions/integrations";
import { format } from "date-fns";

export default async function SettingsPage() {
  const session = await auth();
  const [google, xero] = await Promise.all([
    prisma.integrationConnection.findFirst({ where: { userId: session!.user.id, provider: "GOOGLE" } }),
    prisma.integrationConnection.findFirst({ where: { userId: session!.user.id, provider: "XERO" } }),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Manage connected accounts and sync preferences" />

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
                Syncs invoices and payment status every 15–30 minutes, and rolls paid invoices into revenue this month.
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
