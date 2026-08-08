import { NextRequest, NextResponse } from "next/server";
import { startOfISOWeek, endOfISOWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { listGoogleDocs, listWeekCalendarEvents } from "@/lib/google";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { CapacitySource } from "@prisma/client";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.integrationConnection.findMany({ where: { provider: "GOOGLE" } });

  let docsSynced = 0;
  let eventsSynced = 0;

  for (const connection of connections) {
    const [docs, clients] = await Promise.all([
      listGoogleDocs(connection.userId, connection.externalId),
      prisma.client.findMany({ where: { status: "ACTIVE" } }),
    ]);

    for (const doc of docs) {
      if (!doc.id || !doc.name || !doc.webViewLink) continue;
      await prisma.doc.upsert({
        where: { googleDocId: doc.id },
        create: { googleDocId: doc.id, title: doc.name, url: doc.webViewLink, source: "GOOGLE_DRIVE", folderId: connection.externalId },
        update: { title: doc.name, url: doc.webViewLink },
      });
      docsSynced += 1;
    }

    const weekStart = startOfISOWeek(new Date());
    const weekEnd = endOfISOWeek(new Date());
    const events = await listWeekCalendarEvents(connection.userId, weekStart, weekEnd);

    const hoursByClient = new Map<string, number>();

    for (const event of events) {
      if (!event.id || !event.summary || !event.start?.dateTime || !event.end?.dateTime) continue;
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);

      // Best-effort client attribution: match the client's name against the
      // event title. Works well when events are titled "Client Name - topic",
      // a common convention. Ambiguous/no matches are still logged to
      // CalendarEvent for Today's Schedule, just not rolled into capacity.
      const matchedClient = clients.find((c) => event.summary!.toLowerCase().includes(c.name.toLowerCase()));

      await prisma.calendarEvent.upsert({
        where: { googleEventId: event.id },
        create: { googleEventId: event.id, title: event.summary, start, end, clientId: matchedClient?.id },
        update: { title: event.summary, start, end, clientId: matchedClient?.id },
      });
      eventsSynced += 1;

      if (matchedClient) {
        const durationHours = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
        hoursByClient.set(matchedClient.id, (hoursByClient.get(matchedClient.id) ?? 0) + durationHours);
      }
    }

    for (const [clientId, bookedHours] of hoursByClient) {
      await prisma.capacityEntry.upsert({
        where: { clientId_weekStart: { clientId, weekStart } },
        create: { clientId, weekStart, bookedHours, source: CapacitySource.CALENDAR },
        update: { bookedHours, source: CapacitySource.CALENDAR },
      });
    }
  }

  return NextResponse.json({ users: connections.length, docsSynced, eventsSynced });
}
