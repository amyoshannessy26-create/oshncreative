import { LeadStage } from "@prisma/client";

// Deliberately not in a "use client" file: Next.js turns every export of a
// client-component module into an opaque client reference in production
// builds, which breaks plain-value exports (like this array) when a server
// component tries to use them directly — hence LEAD_STAGES.map not being a
// function in production despite working in dev.
export const LEAD_STAGES: LeadStage[] = ["NEW_LEAD", "DISCOVERY_CALL", "PROPOSAL_SENT", "ONBOARDING", "ACTIVE", "LOST"];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  NEW_LEAD: "New Lead",
  DISCOVERY_CALL: "Discovery Call",
  PROPOSAL_SENT: "Proposal Sent",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  LOST: "Lost",
};
