import { createFileRoute } from "@tanstack/react-router";
import { IPLookup, ipQuery } from "@/components/IPLookup";

export const Route = createFileRoute("/")({
  component: () => <IPLookup />,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(ipQuery());
  },
});