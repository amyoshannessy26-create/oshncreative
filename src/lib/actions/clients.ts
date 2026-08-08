"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ClientStatus } from "@prisma/client";

const clientSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  retainerHours: z.coerce.number().min(0).default(0),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.ACTIVE),
});

export async function createClient(formData: FormData) {
  const data = clientSchema.parse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email") || undefined,
    retainerHours: formData.get("retainerHours") || 0,
    status: formData.get("status") || ClientStatus.ACTIVE,
  });

  await prisma.client.create({
    data: { ...data, email: data.email || null, company: data.company || null },
  });

  revalidatePath("/clients");
}

export async function updateClientStatus(clientId: string, status: ClientStatus) {
  await prisma.client.update({ where: { id: clientId }, data: { status } });
  revalidatePath("/clients");
}

export async function deleteClient(clientId: string) {
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/clients");
}
