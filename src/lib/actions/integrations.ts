"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IntegrationProvider } from "@prisma/client";

export async function disconnectIntegration(provider: IntegrationProvider) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.integrationConnection.deleteMany({
    where: { userId: session.user.id, provider },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function setGoogleDriveFolder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const folderId = String(formData.get("folderId") || "").trim();

  const connection = await prisma.integrationConnection.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: "GOOGLE" } },
  });
  if (!connection) return;

  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: { externalId: folderId || null },
  });

  revalidatePath("/settings");
}
