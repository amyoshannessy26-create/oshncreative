import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/actions/clients";
import { ClientStatus } from "@prisma/client";
import { DeleteButton } from "@/components/delete-button";
import { deleteClient } from "@/lib/actions/clients";

const STATUS_TONE: Record<ClientStatus, "success" | "warning" | "neutral"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  OFFBOARDED: "neutral",
};

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: { docs: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Clients" description="Everyone you're retained by, in one place" />

      <details className="mb-6 group">
        <summary className="w-fit cursor-pointer list-none rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Add client
        </summary>
        <Card className="mt-3 max-w-lg">
          <form action={createClient} className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Name" required className="input col-span-2" />
            <input name="company" placeholder="Company" className="input col-span-2" />
            <input name="email" type="email" placeholder="Email" className="input" />
            <input name="retainerHours" type="number" step="0.5" min="0" placeholder="Retainer hrs/week" className="input" />
            <select name="status" defaultValue={ClientStatus.ACTIVE} className="input col-span-2">
              <option value={ClientStatus.ACTIVE}>Active</option>
              <option value={ClientStatus.PAUSED}>Paused</option>
              <option value={ClientStatus.OFFBOARDED}>Offboarded</option>
            </select>
            <button type="submit" className="col-span-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save client
            </button>
          </form>
        </Card>
      </details>

      {clients.length === 0 ? (
        <EmptyState title="No clients yet" description="Add your first client above." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Retainer hrs/wk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Docs</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.company ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.email ?? "—"}</td>
                  <td className="px-4 py-3">{client.retainerHours}h</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[client.status]}>{client.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client.docs.length}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton action={deleteClient.bind(null, client.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
