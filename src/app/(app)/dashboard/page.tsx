import Link from "next/link";
import { PageHeader, StatCard, Card, Badge, EmptyState } from "@/components/ui";
import { getDashboardData } from "@/lib/data/dashboard";
import { format } from "date-fns";

const currency = (n: number) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <PageHeader title="Dashboard" description="Your business at a glance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue this month" value={currency(data.revenueThisMonth)} hint="Paid invoices, synced from Xero" />
        <StatCard label="Tasks due today" value={String(data.tasksDueToday.length)} hint={`${data.openTasksCount} open total`} />
        <StatCard
          label="Hours booked vs capacity"
          value={`${data.hoursBookedThisWeek.toFixed(1)} / ${data.weeklyCapacityHours}h`}
          hint="This week"
        />
        <StatCard label="Leads in pipeline" value={String(data.leadsInPipeline)} hint="Not yet Active or Lost" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-card-foreground">Tasks due today</h2>
            <Link href="/tasks" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {data.tasksDueToday.length === 0 ? (
            <EmptyState title="Nothing due today" description="You're all caught up." />
          ) : (
            <ul className="divide-y divide-border">
              {data.tasksDueToday.map((task) => (
                <li key={task.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <div className="font-medium text-foreground">{task.title}</div>
                    <div className="text-xs text-muted-foreground">{task.client?.name ?? "No client"}</div>
                  </div>
                  <Badge tone={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "neutral"}>
                    {task.priority}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-card-foreground">Connection status</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span>Google Workspace</span>
              {data.connections.google ? <Badge tone="success">Connected</Badge> : <Badge tone="neutral">Not connected</Badge>}
            </li>
            <li className="flex items-center justify-between">
              <span>Xero</span>
              {data.connections.xero ? <Badge tone="success">Connected</Badge> : <Badge tone="neutral">Not connected</Badge>}
            </li>
          </ul>
          <Link href="/settings" className="mt-4 inline-block text-xs font-medium text-primary hover:underline">
            Manage connections
          </Link>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-card-foreground">Today&apos;s schedule</h2>
        {data.todaysSchedule.length === 0 ? (
          <EmptyState
            title="No synced events yet"
            description={
              data.connections.google
                ? "Calendar sync runs on a schedule — check back shortly."
                : "Connect Google Calendar in Settings to see today's events here."
            }
          />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {data.todaysSchedule.map((event) => (
              <li key={event.id} className="flex items-center justify-between py-2">
                <span className="font-medium text-foreground">{event.title}</span>
                <span className="text-xs text-muted-foreground">
                  {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
