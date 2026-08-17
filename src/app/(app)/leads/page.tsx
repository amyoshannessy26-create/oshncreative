import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { createLead, deleteLead } from "@/lib/actions/leads";
import { LeadStageSelect } from "@/components/lead-stage-select";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/lib/lead-stages";
import { DeleteButton } from "@/components/delete-button";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  const byStage = Object.fromEntries(LEAD_STAGES.map((stage) => [stage, leads.filter((l) => l.stage === stage)]));

  return (
    <div>
      <PageHeader title="Leads & Onboarding" description="Pipeline from first contact to active client" />

      <details className="mb-6 group">
        <summary className="w-fit cursor-pointer list-none rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Add lead
        </summary>
        <Card className="mt-3 max-w-lg">
          <form action={createLead} className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Name" required className="input col-span-2" />
            <input name="company" placeholder="Company" className="input" />
            <input name="email" type="email" placeholder="Email" className="input" />
            <input name="value" type="number" step="1" min="0" placeholder="Est. value ($)" className="input col-span-2" />
            <textarea name="notes" placeholder="Notes" rows={2} className="input col-span-2" />
            <button type="submit" className="col-span-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save lead
            </button>
          </form>
        </Card>
      </details>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-6">
        {LEAD_STAGES.map((stage) => (
          <div key={stage} className="min-w-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{LEAD_STAGE_LABELS[stage]}</h2>
              <span className="text-xs text-muted-foreground">{byStage[stage].length}</span>
            </div>
            <div className="space-y-2">
              {byStage[stage].map((lead) => (
                <Card key={lead.id} className="p-3">
                  <div className="text-sm font-medium text-card-foreground">{lead.name}</div>
                  {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
                  {lead.value != null && (
                    <div className="mt-1 text-xs font-medium text-primary">
                      ${lead.value.toLocaleString()}
                    </div>
                  )}
                  <div className="mt-2">
                    <LeadStageSelect leadId={lead.id} stage={lead.stage} />
                  </div>
                  <div className="mt-2 text-right">
                    <DeleteButton action={deleteLead.bind(null, lead.id)} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
