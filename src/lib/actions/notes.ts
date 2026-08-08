"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const noteSchema = z.object({
  body: z.string().min(1),
  clientId: z.string().optional(),
});

export async function createNote(formData: FormData) {
  const data = noteSchema.parse({
    body: formData.get("body"),
    clientId: formData.get("clientId") || undefined,
  });

  await prisma.note.create({
    data: { body: data.body, clientId: data.clientId || null },
  });

  revalidatePath("/notes");
}

export async function deleteNote(noteId: string) {
  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath("/notes");
}
