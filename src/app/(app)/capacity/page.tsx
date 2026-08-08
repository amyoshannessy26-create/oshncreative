import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { setWeeklyCapacity, setClientBookedHours } from "@/lib/actions/capacity";
import { startOfISOWeek } from "date-fns";

export default async function CapacityPage() {
  const weekStart = startOfISOWeek(new Date());

  const [clients, capacitySetting, entries] = await Promise.all([
    prisma.client.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.capacitySetting.findFirst(),
    prisma.capacityEntry.findMany({ where: { weekStart } }),
  ]);

  const hoursPerWeek = capacitySetting?.hoursPerWeek ?? 40;
  const entryByClient = new Map(entries.map((e) => [e.clientId, e]));
  const totalBooked = entries.reduce((sum, e) => sum + e.bookedHours, 0);
  const utilisationPct = hoursPerWeek > 0 ? Math.min(100, Math.round((totalBooked / hoursPerWeek) * 100)) : 0;

  return (
    <div>
      <PageHeader title="Capacity Planner" description="Weekly capacity vs hours booked per client" />

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground">This week</div>
            <div className="text-2xl font-semibold text-card-foreground">
              {totalBooked.toFixed(1)}h <span className="text-base font-normal text-muted-foreground">/ {hoursPerWeek}h capacity</span>
            </div>
          </div>
          <form action={setWeeklyCapacity} className="flex items-center gap-2">
            <input
              name="hoursPerWeek"
              type="number"
              step="0.5"
              min="0"
              defaultValue={hoursPerWeek}
              className="input w-24"
            />
            <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
              Set weekly capacity
            </button>
          </form>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${utilisationPct}%` }} />
        </div>
      </Card>

      {clients.length === 0 ? (
        <EmptyState title="No active clients" description="Add an active client to plan capacity against." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Retainer hrs/wk</th>
                <th className="px-4 py-3">Booked this week</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => {
                const entry = entryByClient.get(client.id);
                return (
                  <tr key={client.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.retainerHours}h</td>
                    <td className="px-4 py-3">{(entry?.bookedHours ?? 0).toFixed(1)}h</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{entry?.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      <form action={setClientBookedHours} className="flex items-center gap-2">
                        <input type="hidden" name="clientId" value={client.id} />
                        <input
                          name="bookedHours"
                          type="number"
                          step="0.5"
                          min="0"
                          defaultValue={entry?.bookedHours ?? 0}
                          className="input w-20 py-1 text-xs"
                        />
                        <button type="submit" className="text-xs font-medium text-primary hover:underline">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Booked hours update automatically once Calendar sync is connected (Settings). Manual edits are overwritten by the next sync for calendar-sourced entries.
      </p>
    </div>
  );
}
