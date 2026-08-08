"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { LeadStage, ClientStatus } from "@prisma/client";

const leadSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  value: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function createLead(formData: FormData) {
  const data = leadSchema.parse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email") || undefined,
    value: formData.get("value") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await prisma.lead.create({
    data: { ...data, email: data.email || null, company: data.company || null },
  });

  revalidatePath("/leads");
}

/**
 * Moving a lead to ACTIVE auto-creates (or links) a Client record so the
 * onboarding-to-active handoff doesn't require re-entering the same info.
 */
export async function moveLeadStage(leadId: string, stage: LeadStage) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  if (stage === LeadStage.ACTIVE && !lead.clientId) {
    const client = await prisma.client.create({
      data: {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        status: ClientStatus.ACTIVE,
      },
    });
    await prisma.lead.update({ where: { id: leadId }, data: { stage, clientId: client.id } });
    revalidatePath("/clients");
  } else {
    await prisma.lead.update({ where: { id: leadId }, data: { stage } });
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function deleteLead(leadId: string) {
  await prisma.lead.delete({ where: { id: leadId } });
  revalidatePath("/leads");
}
