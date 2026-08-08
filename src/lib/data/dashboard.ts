import { prisma } from "@/lib/prisma";
import { InvoiceStatus, TaskStatus } from "@prisma/client";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfISOWeek } from "date-fns";

export async function getDashboardData() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfISOWeek(now);

  const [
    paidInvoicesThisMonth,
    tasksDueToday,
    openTasksCount,
    leadsInPipeline,
    capacitySetting,
    capacityEntriesThisWeek,
    googleConnection,
    xeroConnection,
    todaysEvents,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: InvoiceStatus.PAID, issuedDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.task.findMany({
      where: { dueDate: { gte: todayStart, lte: todayEnd }, status: { not: TaskStatus.DONE } },
      include: { client: true },
      orderBy: { priority: "desc" },
    }),
    prisma.task.count({ where: { status: { not: TaskStatus.DONE } } }),
    prisma.lead.count({ where: { stage: { notIn: ["ACTIVE", "LOST"] } } }),
    prisma.capacitySetting.findFirst(),
    prisma.capacityEntry.aggregate({
      _sum: { bookedHours: true },
      where: { weekStart },
    }),
    prisma.integrationConnection.findFirst({ where: { provider: "GOOGLE" } }),
    prisma.integrationConnection.findFirst({ where: { provider: "XERO" } }),
    prisma.calendarEvent.findMany({
      where: { start: { gte: todayStart, lte: todayEnd } },
      orderBy: { start: "asc" },
    }),
  ]);

  return {
    revenueThisMonth: paidInvoicesThisMonth._sum.amount ?? 0,
    tasksDueToday,
    openTasksCount,
    leadsInPipeline,
    weeklyCapacityHours: capacitySetting?.hoursPerWeek ?? 40,
    hoursBookedThisWeek: capacityEntriesThisWeek._sum.bookedHours ?? 0,
    connections: {
      google: googleConnection ? { connectedAt: googleConnection.connectedAt } : null,
      xero: xeroConnection ? { connectedAt: xeroConnection.connectedAt } : null,
    },
    todaysSchedule: todaysEvents,
  };
}
