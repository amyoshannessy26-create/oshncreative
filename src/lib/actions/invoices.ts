"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";

const invoiceSchema = z.object({
  clientId: z.string().optional(),
  amount: z.coerce.number().min(0),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.DRAFT),
  issuedDate: z.string().optional(),
  dueDate: z.string().optional(),
});

// Manual invoices supplement the Xero-synced ones (xeroInvoiceId is null for these).
export async function createInvoice(formData: FormData) {
  const data = invoiceSchema.parse({
    clientId: formData.get("clientId") || undefined,
    amount: formData.get("amount"),
    status: formData.get("status") || InvoiceStatus.DRAFT,
    issuedDate: formData.get("issuedDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  await prisma.invoice.create({
    data: {
      clientId: data.clientId || null,
      amount: data.amount,
      status: data.status,
      issuedDate: data.issuedDate ? new Date(data.issuedDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function deleteInvoice(invoiceId: string) {
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}
