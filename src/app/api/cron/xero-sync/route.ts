import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncXeroInvoicesForUser } from "@/lib/xero";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.integrationConnection.findMany({
    where: { provider: "XERO" },
    select: { userId: true },
  });

  const results = await Promise.allSettled(
    connections.map((c) => syncXeroInvoicesForUser(c.userId))
  );

  const synced = results.reduce((sum, r) => (r.status === "fulfilled" ? sum + r.value.synced : sum), 0);
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ users: connections.length, invoicesSynced: synced, failed });
}
