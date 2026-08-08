"use client";

import { disconnectIntegration } from "@/lib/actions/integrations";
import type { IntegrationProvider } from "@prisma/client";

export function DisconnectButton({ provider }: { provider: IntegrationProvider }) {
  return (
    <form
      action={disconnectIntegration.bind(null, provider)}
      onSubmit={(e) => {
        if (!confirm(`Disconnect ${provider}? Synced data already in the dashboard will stay.`)) e.preventDefault();
      }}
    >
      <button type="submit" className="text-xs font-medium text-danger hover:underline">
        Disconnect
      </button>
    </form>
  );
}
