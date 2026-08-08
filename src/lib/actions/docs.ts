"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const docSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  clientId: z.string().optional(),
});

export async function createDoc(formData: FormData) {
  const data = docSchema.parse({
    title: formData.get("title"),
    url: formData.get("url"),
    clientId: formData.get("clientId") || undefined,
  });

  await prisma.doc.create({
    data: { ...data, clientId: data.clientId || null },
  });

  revalidatePath("/docs");
}

export async function deleteDoc(docId: string) {
  await prisma.doc.delete({ where: { id: docId } });
  revalidatePath("/docs");
}
