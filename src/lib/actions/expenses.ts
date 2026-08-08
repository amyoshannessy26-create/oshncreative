"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const expenseSchema = z.object({
  description: z.string().min(1),
  category: z.string().min(1),
  amount: z.coerce.number().min(0),
  date: z.string().min(1),
});

export async function createExpense(formData: FormData) {
  const data = expenseSchema.parse({
    description: formData.get("description"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
  });

  await prisma.expense.create({
    data: { ...data, date: new Date(data.date) },
  });

  revalidatePath("/expenses");
}

export async function deleteExpense(expenseId: string) {
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath("/expenses");
}
