import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { DeleteButton } from "@/components/delete-button";
import { format } from "date-fns";

const currency = (n: number) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader title="Expenses" description={`${currency(total)} tracked`} />

      <details className="mb-6 group">
        <summary className="w-fit cursor-pointer list-none rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Add expense
        </summary>
        <Card className="mt-3 max-w-lg">
          <form action={createExpense} className="grid grid-cols-2 gap-3">
            <input name="description" placeholder="Description" required className="input col-span-2" />
            <input name="category" placeholder="Category" required className="input" />
            <input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required className="input" />
            <input name="date" type="date" required className="input col-span-2" />
            <button type="submit" className="col-span-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save expense
            </button>
          </form>
        </Card>
      </details>

      {expenses.length === 0 ? (
        <EmptyState title="No expenses yet" description="Add your first expense above." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{expense.description}</td>
                  <td className="px-4 py-3 text-muted-foreground">{expense.category}</td>
                  <td className="px-4 py-3">{currency(expense.amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(expense.date, "d MMM yyyy")}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton action={deleteExpense.bind(null, expense.id)} />
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
