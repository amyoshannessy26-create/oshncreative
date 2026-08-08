"use client";

import { useTransition } from "react";
import { LeadStage } from "@prisma/client";
import { moveLeadStage } from "@/lib/actions/leads";

const STAGES: LeadStage[] = ["NEW_LEAD", "DISCOVERY_CALL", "PROPOSAL_SENT", "ONBOARDING", "ACTIVE", "LOST"];

const LABELS: Record<LeadStage, string> = {
  NEW_LEAD: "New Lead",
  DISCOVERY_CALL: "Discovery Call",
  PROPOSAL_SENT: "Proposal Sent",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  LOST: "Lost",
};

export function LeadStageSelect({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={stage}
      disabled={isPending}
      onChange={(e) => startTransition(() => moveLeadStage(leadId, e.target.value as LeadStage))}
      className="input w-full py-1 text-xs"
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {LABELS[s]}
        </option>
      ))}
    </select>
  );
}

export { LABELS as LEAD_STAGE_LABELS, STAGES as LEAD_STAGES };
