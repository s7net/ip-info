import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Search, X, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getUserIP, lookupIP, type IPInfo } from "@/lib/ip.functions";
import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";

const ipQuery = () => ({
  queryKey: ["user-ip"] as const,
  queryFn: getUserIP,
});

export const Route = createFileRoute("/")({
  component: Index,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(ipQuery());
  },
});

function Flag({ code, className }: { code?: string | null; className?: string }) {
  const cc = code?.toUpperCase();
  if (!cc || !hasFlag(cc)) return null;
  const F = (Flags as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[cc];
  return F ? <F title={cc} className={className} /> : null;
}

function Index() {
  const fetchIP = useServerFn(getUserIP);
  const lookup = useServerFn(lookupIP);
  const { data: me } = useSuspenseQuery({ ...ipQuery(), queryFn: fetchIP });

  const [input, setInput] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const lookupQ = useQuery({
    queryKey: ["lookup-ip", target],
    queryFn: () => lookup({ data: { ip: target! } }),
    enabled: !!target,
  });

  const active: IPInfo = (target ? lookupQ.data : me) ?? { ip: null };
  const loading = target ? lookupQ.isFetching : false;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    setTarget(v);
  };

  const reset = () => {
    setInput("");
    setTarget(null);
  };

  const copyIP = async () => {
    if (!active.ip) return;
    await navigator.clipboard.writeText(active.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const rows: Array<{ label: string; value: string | null | undefined; mono?: boolean }> = [
    { label: "IP Address", value: active.ip, mono: true },
    { label: "ASN", value: active.asn != null ? `AS${active.asn}` : null, mono: true },
    { label: "Organization (ISP)", value: active.org_name },
    { label: "Country", value: active.country ? `${active.country}${active.country_code ? ` (${active.country_code})` : ""}` : null },
    { label: "Region", value: active.region },
    { label: "City", value: active.city },
    { label: "Postal Code", value: active.postal },
    { label: "Continent", value: active.continent },
    { label: "Timezone", value: active.timezone },
    { label: "Coordinates", value: active.latitude != null && active.longitude != null ? `${active.latitude}, ${active.longitude}` : null, mono: true },
    { label: "Tor Network", value: active.is_tor == null ? null : active.is_tor ? "Yes" : "No" },
  ];

  const lat = active.latitude;
  const lon = active.longitude;
  const mapUrl =
    lat != null && lon != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 2},${lat - 1.2},${lon + 2},${lat + 1.2}&layer=mapnik&marker=${lat},${lon}`
      : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Your IP:</span>
          <span dir="ltr" className="rounded bg-primary/20 px-2 py-0.5 font-mono text-primary">
            {me?.ip ?? "—"}
          </span>
          {me?.country && (
            <span className="flex items-center gap-2 text-muted-foreground">
              Country:
              <Flag code={me.country_code} className="h-4 w-6 rounded-sm shadow-sm" />
              <span className="text-foreground">
                {me.country}
                {me.region || me.city ? ` (${[me.region, me.city].filter(Boolean).join(", ")})` : ""}
              </span>
            </span>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Search panel */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                dir="ltr"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter an IP address (e.g. 8.8.8.8)"
                className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-10 font-mono text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              {input && (
                <button
                  type="button"
                  onClick={reset}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="h-11 px-6">Lookup</Button>
          </form>
        </div>

        {/* Header of result */}
        <div className="mt-6 rounded-t-lg border border-b-0 border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
          IP location for: <span dir="ltr" className="font-mono text-foreground">{active.ip ?? "—"}</span>
        </div>

        <div className="rounded-b-lg border border-border bg-card">
          {lookupQ.isError && (
            <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Invalid IP address or lookup temporarily unavailable.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr]">
            {/* Info table */}
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-primary">IP Information</span>
                <div className="flex items-center gap-2">
                  {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
                  {active.ip && (
                    <button
                      onClick={copyIP}
                      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                      aria-label="Copy IP"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
              {rows.map((r) => (
                <div key={r.label} className="grid grid-cols-[110px_1fr] items-center gap-3 px-4 py-2 text-sm even:bg-muted/20">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span
                    dir={r.mono ? "ltr" : undefined}
                    className={`text-foreground ${r.mono ? "font-mono" : ""} ${!r.value ? "text-muted-foreground/60" : ""}`}
                  >
                    {r.label === "Country" && active.country_code ? (
                      <span className="inline-flex items-center gap-2">
                        <Flag code={active.country_code} className="h-3.5 w-5 rounded-sm" />
                        {r.value ?? "—"}
                      </span>
                    ) : (
                      r.value ?? "—"
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="min-h-[320px] border-t border-border md:border-l md:border-t-0">
              {mapUrl ? (
                <iframe
                  key={mapUrl}
                  title="Map"
                  src={mapUrl}
                  className="h-full min-h-[320px] w-full"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  {active.ip
                    ? "Geolocation coordinates are not available for this IP."
                    : "Enter an IP address to see it on the map."}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
            Data from <a href="https://api.ipiz.net" target="_blank" rel="noreferrer" className="text-primary hover:underline">ipiz.net</a> · Map by OpenStreetMap
          </div>
        </div>
      </main>
    </div>
  );
}
