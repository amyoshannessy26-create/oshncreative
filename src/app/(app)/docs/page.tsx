import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { createDoc, deleteDoc } from "@/lib/actions/docs";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";

export default async function DocsPage() {
  const [docs, clients, googleConnection] = await Promise.all([
    prisma.doc.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.integrationConnection.findFirst({ where: { provider: "GOOGLE" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Docs Hub"
        description={
          googleConnection
            ? "Synced automatically from your selected Google Drive folder, plus anything you add manually"
            : "Connect Google Drive in Settings to sync docs automatically"
        }
      />

      <details className="mb-6 group">
        <summary className="w-fit cursor-pointer list-none rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Add doc link
        </summary>
        <Card className="mt-3 max-w-lg">
          <form action={createDoc} className="grid grid-cols-2 gap-3">
            <input name="title" placeholder="Title" required className="input col-span-2" />
            <input name="url" type="url" placeholder="https://docs.google.com/…" required className="input col-span-2" />
            <select name="clientId" className="input col-span-2">
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="col-span-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save doc
            </button>
          </form>
        </Card>
      </details>

      {docs.length === 0 ? (
        <EmptyState title="No docs yet" description="Add a link above, or connect Google Drive." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <div className="flex items-start justify-between gap-2">
                <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
                  <Icon name="doc" className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {doc.title}
                </a>
                <DeleteButton action={deleteDoc.bind(null, doc.id)} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={doc.source === "GOOGLE_DRIVE" ? "primary" : "neutral"}>
                  {doc.source === "GOOGLE_DRIVE" ? "Google Drive" : "Manual"}
                </Badge>
                {doc.client && <span className="text-xs text-muted-foreground">{doc.client.name}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
