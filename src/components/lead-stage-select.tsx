"use client";

import { useTransition } from "react";
import { LeadStage } from "@prisma/client";
import { moveLeadStage } from "@/lib/actions/leads";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/lib/lead-stages";

export function LeadStageSelect({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={stage}
      disabled={isPending}
      onChange={(e) => startTransition(() => moveLeadStage(leadId, e.target.value as LeadStage))}
      className="input w-full py-1 text-xs"
    >
      {LEAD_STAGES.map((s) => (
        <option key={s} value={s}>
          {LEAD_STAGE_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
