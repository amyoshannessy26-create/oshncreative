"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { TaskPriority, TaskStatus } from "@prisma/client";

const taskSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
});

export async function createTask(formData: FormData) {
  const data = taskSchema.parse({
    title: formData.get("title"),
    clientId: formData.get("clientId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    priority: formData.get("priority") || TaskPriority.MEDIUM,
  });

  await prisma.task.create({
    data: {
      title: data.title,
      clientId: data.clientId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
