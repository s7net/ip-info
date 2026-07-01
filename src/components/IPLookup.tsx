import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  Search, X, Copy, Check, Loader2,
  Globe, Network, Building2, Flag as FlagIcon, Map, MapPin,
  Mailbox, Earth, Clock, Compass, ShieldAlert,
  DollarSign, Phone, Satellite, Radio, Route as RouteIcon,
  Server, Tag, Landmark, Mail, User, Home, Fingerprint,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getUserIP, lookupIP, type IPInfo } from "@/lib/ip.functions";
import { Globe as GlobeBG } from "@/components/Globe";
import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";

const ipQuery = () => ({ queryKey: ["user-ip"] as const, queryFn: getUserIP });

function Flag({ code, className }: { code?: string | null; className?: string }) {
  const cc = code?.toUpperCase();
  if (!cc || !hasFlag(cc)) return null;
  const F = (Flags as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[cc];
  return F ? <F title={cc} className={className} /> : null;
}

export function IPLookup({ targetIP }: { targetIP?: string | null }) {
  const navigate = useNavigate();
  const fetchIP = useServerFn(getUserIP);
  const lookup = useServerFn(lookupIP);
  const { data: me } = useSuspenseQuery({ ...ipQuery(), queryFn: fetchIP });

  const [input, setInput] = useState(targetIP ?? "");
  const [copied, setCopied] = useState(false);

  const lookupQ = useQuery({
    queryKey: ["lookup-ip", targetIP],
    queryFn: () => lookup({ data: { ip: targetIP! } }),
    enabled: !!targetIP,
    placeholderData: (prev) => prev,
  });

  const active: IPInfo = (targetIP ? lookupQ.data : me) ?? { ip: null };
  const rawLoading = targetIP ? (lookupQ.isFetching || lookupQ.isPending) : false;

  // Enforce a short minimum visible loading duration so the transition feels natural
  const [loading, setLoading] = useState(rawLoading);
  useEffect(() => {
    if (rawLoading) {
      setLoading(true);
      return;
    }
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [rawLoading, targetIP]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    navigate({ to: "/$ip", params: { ip: v } });
  };

  const reset = () => {
    setInput("");
    navigate({ to: "/" });
  };

  const copyIP = async () => {
    if (!active.ip) return;
    await navigator.clipboard.writeText(active.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const yn = (v: boolean | null | undefined) => v == null ? null : v ? "Yes" : "No";
  const p = active.privacy ?? {};
  const a = active.asn ?? {};
  const c = active.company ?? {};
  const ab = active.abuse ?? {};

  type Row = {
    label: string;
    value: string | null | undefined;
    mono?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
  };
  type Section = { title: string; rows: Row[] };

  const sections: Section[] = [
    {
      title: "Location",
      rows: [
        { label: "IP Address", value: active.ip, mono: true, icon: Globe },
        { label: "Country", value: active.country ? `${active.country}${active.country_code ? ` (${active.country_code})` : ""}` : null, icon: FlagIcon },
        { label: "EU Member", value: yn(active.is_eu), icon: Landmark },
        { label: "Subdivision", value: active.subdivision, icon: Map },
        { label: "City", value: active.city, icon: MapPin },
        { label: "Postal Code", value: active.postal_code, icon: Mailbox },
        { label: "Continent", value: active.continent, icon: Earth },
        { label: "Timezone", value: active.time_zone, icon: Clock },
        { label: "Coordinates", value: active.latitude != null && active.longitude != null ? `${active.latitude}, ${active.longitude}` : null, mono: true, icon: Compass },
        { label: "Currency", value: active.currency_code, icon: DollarSign },
        { label: "Calling Code", value: active.calling_code ? `+${active.calling_code}` : null, icon: Phone },
        { label: "Anycast", value: yn(active.is_anycast), icon: Radio },
        { label: "Satellite", value: yn(active.is_satellite), icon: Satellite },
      ],
    },
    {
      title: "ASN / Network",
      rows: [
        { label: "ASN", value: a.asn, mono: true, icon: Network },
        { label: "Route", value: a.route, mono: true, icon: RouteIcon },
        { label: "Netname", value: a.netname, icon: Tag },
        { label: "Name", value: a.name, icon: Building2 },
        { label: "Country", value: a.country_code, icon: FlagIcon },
        { label: "Domain", value: a.domain, icon: Globe },
        { label: "Type", value: a.type, icon: Server },
        { label: "RIR", value: a.rir, icon: Landmark },
      ],
    },
    {
      title: "Company",
      rows: [
        { label: "Name", value: c.name, icon: Building2 },
        { label: "Domain", value: c.domain, icon: Globe },
        { label: "Country", value: c.country_code, icon: FlagIcon },
        { label: "Type", value: c.type, icon: Server },
      ],
    },
    {
      title: "Privacy",
      rows: [
        { label: "Abuser", value: yn(p.is_abuser), icon: ShieldAlert, highlight: !!p.is_abuser },
        { label: "Anonymous", value: yn(p.is_anonymous), icon: Fingerprint, highlight: !!p.is_anonymous },
        { label: "Bogon", value: yn(p.is_bogon), icon: ShieldAlert, highlight: !!p.is_bogon },
        { label: "Hosting", value: yn(p.is_hosting), icon: Server, highlight: !!p.is_hosting },
        { label: "iCloud Relay", value: yn(p.is_icloud_relay), icon: Radio, highlight: !!p.is_icloud_relay },
        { label: "Proxy", value: yn(p.is_proxy), icon: ShieldAlert, highlight: !!p.is_proxy },
        { label: "Tor", value: yn(p.is_tor), icon: ShieldAlert, highlight: !!p.is_tor },
        { label: "VPN", value: yn(p.is_vpn), icon: ShieldAlert, highlight: !!p.is_vpn },
      ],
    },
    {
      title: "Abuse Contact",
      rows: [
        { label: "Name", value: ab.name, icon: User },
        { label: "Email", value: ab.email, icon: Mail, mono: true },
        { label: "Phone", value: ab.phone, icon: Phone, mono: true },
        { label: "Address", value: ab.address, icon: Home },
        { label: "Country", value: ab.country_code, icon: FlagIcon },
        { label: "Network", value: ab.network, mono: true, icon: RouteIcon },
      ],
    },
  ];

  const lat = active.latitude;
  const lon = active.longitude;
  const mapUrl =
    lat != null && lon != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 2},${lat - 1.2},${lon + 2},${lat + 1.2}&layer=mapnik&marker=${lat},${lon}`
      : null;

  const contentKey = active.ip ?? "empty";

  return (
    <div className="relative min-h-screen text-foreground">
      <GlobeBG />
      <div className="relative border-b border-border/60 bg-card/60 backdrop-blur">
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
                {me.subdivision || me.city ? ` (${[me.subdivision, me.city].filter(Boolean).join(", ")})` : ""}
              </span>
            </span>
          )}
        </div>
      </div>

      <main className="relative mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
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

        <div className="mt-6 rounded-t-lg border border-b-0 border-border bg-muted/60 px-4 py-3 text-center text-sm text-muted-foreground backdrop-blur">
          IP location for: <span dir="ltr" className="font-mono text-foreground">{active.ip ?? "—"}</span>
        </div>

        <div className="relative rounded-b-lg border border-border bg-card/85 backdrop-blur">
          {loading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-24">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm text-primary shadow-lg backdrop-blur animate-fade-in">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            </div>
          )}
          {lookupQ.isError && (
            <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Invalid IP address or lookup temporarily unavailable.
            </div>
          )}
          <div
            key={contentKey}
            className={`grid grid-cols-1 items-stretch md:grid-cols-2 transition-all duration-500 ease-out ${loading ? "opacity-40 blur-[1px]" : "opacity-100 blur-0"}`}
          >
            <div className="col-span-1 md:col-span-2 flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-primary">IP Information</span>
              <div className="flex items-center gap-2">
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

            <div className="flex flex-col divide-y divide-border md:border-r md:border-border">
              {sections.filter(s => s.title === "Location" || s.title === "Abuse Contact").map((sec) => (
                <div key={sec.title}>
                  <div className="bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    {sec.title}
                  </div>
                  {sec.rows.map((r) => (
                    <div key={sec.title + r.label} className="grid grid-cols-[140px_1fr] items-center gap-3 border-t border-border/60 px-4 py-2 text-sm even:bg-muted/20">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <r.icon className="h-4 w-4 text-primary" />
                        {r.label}
                      </span>
                      <span
                        dir={r.mono ? "ltr" : undefined}
                        className={`${r.highlight ? "font-semibold text-foreground" : "text-foreground"} ${r.mono ? "font-mono" : ""} ${!r.value ? "text-muted-foreground/60" : ""} break-all`}
                      >
                        {(r.label === "Country" && active.country_code) ? (
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
              ))}
              <div className="flex-1 border-t border-border/60 bg-muted/10" />
            </div>

            <div className="flex flex-col divide-y divide-border">
              {sections.filter(s => s.title !== "Location" && s.title !== "Abuse Contact").map((sec) => (
                <div key={sec.title}>
                  <div className="bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    {sec.title}
                  </div>
                  {sec.rows.map((r) => (
                    <div key={sec.title + r.label} className="grid grid-cols-[140px_1fr] items-center gap-3 border-t border-border/60 px-4 py-2 text-sm even:bg-muted/20">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <r.icon className="h-4 w-4 text-primary" />
                        {r.label}
                      </span>
                      <span
                        dir={r.mono ? "ltr" : undefined}
                        className={`${r.highlight ? "font-semibold text-foreground" : "text-foreground"} ${r.mono ? "font-mono" : ""} ${!r.value ? "text-muted-foreground/60" : ""} break-all`}
                      >
                        {(r.label === "Country" && r.value) ? (
                          <span className="inline-flex items-center gap-2">
                            <Flag code={r.value} className="h-3.5 w-5 rounded-sm" />
                            {r.value ?? "—"}
                          </span>
                        ) : (
                          r.value ?? "—"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex-1 border-t border-border/60 bg-muted/10" />
            </div>

            <div className="col-span-1 md:col-span-2 border-t border-border h-64 bg-background">
              {mapUrl ? (
                <iframe
                  key={mapUrl}
                  title="Map"
                  src={mapUrl}
                  className="h-full w-full"
                  style={{ filter: "invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9)" }}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  {active.ip
                    ? "Geolocation coordinates are not available for this IP."
                    : "Enter an IP address to see it on the map."}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
            Data from <span className="text-primary">{active.source ?? "iplocate.io"}</span> · Map by OpenStreetMap
          </div>
        </div>
      </main>
    </div>
  );
}

export { ipQuery };