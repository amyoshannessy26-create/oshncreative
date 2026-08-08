import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { createTask, deleteTask } from "@/lib/actions/tasks";
import { TaskStatusToggle } from "@/components/task-status-toggle";
import { DeleteButton } from "@/components/delete-button";
import { format } from "date-fns";

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "warning", HIGH: "danger" } as const;

export default async function TasksPage() {
  const [tasks, clients] = await Promise.all([
    prisma.task.findMany({ include: { client: true }, orderBy: [{ status: "asc" }, { dueDate: "asc" }] }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Tasks" description="Everything on your plate, across every client" />

      <details className="mb-6 group">
        <summary className="w-fit cursor-pointer list-none rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Add task
        </summary>
        <Card className="mt-3 max-w-lg">
          <form action={createTask} className="grid grid-cols-2 gap-3">
            <input name="title" placeholder="Task title" required className="input col-span-2" />
            <select name="clientId" className="input">
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select name="priority" defaultValue="MEDIUM" className="input">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <input name="dueDate" type="date" className="input col-span-2" />
            <button type="submit" className="col-span-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save task
            </button>
          </form>
        </Card>
      </details>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Add your first task above." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{task.client?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{task.dueDate ? format(task.dueDate, "d MMM yyyy") : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusToggle taskId={task.id} status={task.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton action={deleteTask.bind(null, task.id)} />
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
