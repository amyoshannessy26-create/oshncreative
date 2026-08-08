"use client";

import { useTransition } from "react";
import { TaskStatus } from "@prisma/client";
import { updateTaskStatus } from "@/lib/actions/tasks";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const LABELS: Record<TaskStatus, string> = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };

export function TaskStatusToggle({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => updateTaskStatus(taskId, e.target.value as TaskStatus))}
      className="input py-1 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {LABELS[s]}
        </option>
      ))}
    </select>
  );
}
