import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { createInvoice, deleteInvoice } from "@/lib/actions/invoices";
import { DeleteButton } from "@/components/delete-button";
import { InvoiceStatus } from "@prisma/client";
import { format } from "date-fns";

const STATUS_TONE: Record<InvoiceStatus, "success" | "warning" | "danger" | "neutral" | "primary"> = {
  DRAFT: "neutral",
  SUBMITTED: "primary",
  AUTHORISED: "warning",
  PAID: "success",
  VOIDED: "neutral",
  OVERDUE: "danger",
};

const currency = (n: number) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });

export default async function InvoicesPage() {
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({ include: { client: true }, orderBy: { issuedDate: "desc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Synced from Xero once a day, plus anything you add manually"
      />

      <details className="mb-6 group">
        <summary className="w-fit cursor-pointer list-none rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Add manual invoice
        </summary>
        <Card className="mt-3 max-w-lg">
          <form action={createInvoice} className="grid grid-cols-2 gap-3">
            <select name="clientId" className="input col-span-2">
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required className="input" />
            <select name="status" defaultValue="DRAFT" className="input">
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="AUTHORISED">Authorised</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="VOIDED">Voided</option>
            </select>
            <label className="col-span-2 text-xs text-muted-foreground">
              Issued
              <input name="issuedDate" type="date" className="input mt-1 w-full" />
            </label>
            <label className="col-span-2 text-xs text-muted-foreground">
              Due
              <input name="dueDate" type="date" className="input mt-1 w-full" />
            </label>
            <button type="submit" className="col-span-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save invoice
            </button>
          </form>
        </Card>
      </details>

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="Connect Xero in Settings, or add one manually." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{invoice.client?.name ?? "—"}</td>
                  <td className="px-4 py-3">{currency(invoice.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[invoice.status]}>{invoice.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{invoice.issuedDate ? format(invoice.issuedDate, "d MMM yyyy") : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{invoice.dueDate ? format(invoice.dueDate, "d MMM yyyy") : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{invoice.xeroInvoiceId ? "Xero" : "Manual"}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton action={deleteInvoice.bind(null, invoice.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
