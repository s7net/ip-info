import { createFileRoute } from "@tanstack/react-router";
import { IPLookup, ipQuery } from "@/components/IPLookup";

export const Route = createFileRoute("/$ip")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(ipQuery());
  },
});

function RouteComponent() {
  const { ip } = Route.useParams();
  return <IPLookup targetIP={ip} />;
}