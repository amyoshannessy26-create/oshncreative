import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { createNote, deleteNote } from "@/lib/actions/notes";
import { DeleteButton } from "@/components/delete-button";
import { format } from "date-fns";

export default async function NotesPage() {
  const [notes, clients] = await Promise.all([
    prisma.note.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Notes" description="Freeform notes, optionally linked to a client" />

      <Card className="mb-6 max-w-2xl">
        <form action={createNote} className="space-y-3">
          <textarea name="body" placeholder="Write a note…" rows={3} required className="input w-full" />
          <div className="flex items-center gap-3">
            <select name="clientId" className="input">
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save note
            </button>
          </div>
        </form>
      </Card>

      {notes.length === 0 ? (
        <EmptyState title="No notes yet" description="Jot something down above." />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <div className="flex items-start justify-between gap-4">
                <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
                <DeleteButton action={deleteNote.bind(null, note.id)} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {note.client ? `${note.client.name} · ` : ""}
                {format(note.createdAt, "d MMM yyyy, h:mm a")}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
