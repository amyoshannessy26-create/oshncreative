"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CapacitySource } from "@prisma/client";
import { startOfISOWeek } from "date-fns";

export async function setWeeklyCapacity(formData: FormData) {
  const hoursPerWeek = z.coerce.number().min(0).parse(formData.get("hoursPerWeek"));

  const existing = await prisma.capacitySetting.findFirst();
  if (existing) {
    await prisma.capacitySetting.update({ where: { id: existing.id }, data: { hoursPerWeek } });
  } else {
    await prisma.capacitySetting.create({ data: { hoursPerWeek } });
  }

  revalidatePath("/capacity");
  revalidatePath("/dashboard");
}

// Manual override for a client's booked hours this week. Calendar-synced
// hours (source: CALENDAR) are written by the calendar sync job instead and
// are additive per event — this always represents a manual entry.
export async function setClientBookedHours(formData: FormData) {
  const clientId = z.string().min(1).parse(formData.get("clientId"));
  const bookedHours = z.coerce.number().min(0).parse(formData.get("bookedHours"));
  const weekStart = startOfISOWeek(new Date());

  await prisma.capacityEntry.upsert({
    where: { clientId_weekStart: { clientId, weekStart } },
    update: { bookedHours, source: CapacitySource.MANUAL },
    create: { clientId, weekStart, bookedHours, source: CapacitySource.MANUAL },
  });

  revalidatePath("/capacity");
  revalidatePath("/dashboard");
}
