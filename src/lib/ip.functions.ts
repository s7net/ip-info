import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

export type ASNInfo = {
  asn?: string | null;
  route?: string | null;
  netname?: string | null;
  name?: string | null;
  country_code?: string | null;
  domain?: string | null;
  type?: string | null;
  rir?: string | null;
};

export type CompanyInfo = {
  name?: string | null;
  domain?: string | null;
  country_code?: string | null;
  type?: string | null;
};

export type PrivacyInfo = {
  is_abuser?: boolean | null;
  is_anonymous?: boolean | null;
  is_bogon?: boolean | null;
  is_hosting?: boolean | null;
  is_icloud_relay?: boolean | null;
  is_proxy?: boolean | null;
  is_tor?: boolean | null;
  is_vpn?: boolean | null;
};

export type AbuseInfo = {
  address?: string | null;
  country_code?: string | null;
  email?: string | null;
  name?: string | null;
  network?: string | null;
  phone?: string | null;
};

export type IPInfo = {
  ip: string | null;
  host?: string | null;
  country?: string | null;
  country_code?: string | null;
  is_eu?: boolean | null;
  city?: string | null;
  continent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  time_zone?: string | null;
  postal_code?: string | null;
  subdivision?: string | null;
  currency_code?: string | null;
  calling_code?: string | null;
  is_anycast?: boolean | null;
  is_satellite?: boolean | null;
  asn?: ASNInfo | null;
  privacy?: PrivacyInfo | null;
  company?: CompanyInfo | null;
  abuse?: AbuseInfo | null;
  source?: string | null;
};

async function lookupIplocate(ip: string): Promise<Partial<IPInfo> | null> {
  try {
    const res = await fetch(`https://www.iplocate.io/api/lookup/${ip}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, any>;
    if (!d || d.error) return null;
    return {
      country: d.country ?? null,
      country_code: d.country_code ?? null,
      is_eu: d.is_eu ?? null,
      city: d.city ?? null,
      continent: d.continent ?? null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      time_zone: d.time_zone ?? null,
      postal_code: d.postal_code ?? null,
      subdivision: d.subdivision ?? null,
      currency_code: d.currency_code ?? null,
      calling_code: d.calling_code ?? null,
      is_anycast: d.is_anycast ?? null,
      is_satellite: d.is_satellite ?? null,
      asn: d.asn ?? null,
      privacy: d.privacy ?? null,
      company: d.company ?? null,
      abuse: d.abuse ?? null,
      source: "iplocate.io",
    };
  } catch {
    return null;
  }
}

async function lookupIpiz(ip: string): Promise<Partial<IPInfo> | null> {
  try {
    const res = await fetch(`https://api.ipiz.net/${ip}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, unknown>;
    if (d.status && d.status !== "ok") return null;
    return {
      country: (d.country as string) || null,
      country_code: (d.country_code as string) || null,
      city: (d.city as string) || null,
      subdivision: (d.region as string) || null,
      continent: (d.continent as string) || null,
      latitude: (d.latitude as number) ?? null,
      longitude: (d.longitude as number) ?? null,
      postal_code: (d.postal as string) || null,
      time_zone: (d.timezone as string) || null,
      asn: d.asn != null ? { asn: `AS${d.asn}`, name: (d.org_name as string) || null } : null,
      company: d.org_name ? { name: d.org_name as string, country_code: (d.org_country as string) || null } : null,
      privacy: d.is_tor != null ? { is_tor: d.is_tor as boolean } : null,
      source: "ipiz.net",
    };
  } catch {
    return null;
  }
}

async function lookupIpwhois(ip: string): Promise<Partial<IPInfo> | null> {
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, any>;
    if (d.success === false) return null;
    const conn = d.connection ?? {};
    return {
      country: d.country ?? null,
      country_code: d.country_code ?? null,
      is_eu: d.is_eu ?? null,
      city: d.city ?? null,
      subdivision: d.region ?? null,
      continent: d.continent ?? null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      postal_code: d.postal ?? null,
      time_zone: d.timezone?.id ?? null,
      calling_code: d.calling_code ?? null,
      currency_code: d.currency?.code ?? null,
      asn: conn.asn != null ? { asn: `AS${conn.asn}`, name: conn.isp ?? null, domain: conn.domain ?? null, netname: conn.org ?? null } : null,
      company: conn.org ? { name: conn.org, domain: conn.domain ?? null } : null,
      source: "ipwho.is",
    };
  } catch { return null; }
}

async function lookupIpapiCo(ip: string): Promise<Partial<IPInfo> | null> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, any>;
    if (d.error) return null;
    return {
      country: d.country_name ?? null,
      country_code: d.country_code ?? null,
      is_eu: d.in_eu ?? null,
      city: d.city ?? null,
      subdivision: d.region ?? null,
      continent: d.continent_code ?? null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      postal_code: d.postal ?? null,
      time_zone: d.timezone ?? null,
      calling_code: d.country_calling_code ? String(d.country_calling_code).replace(/^\+/, "") : null,
      currency_code: d.currency ?? null,
      asn: d.asn ? { asn: d.asn, name: d.org ?? null } : null,
      company: d.org ? { name: d.org } : null,
      source: "ipapi.co",
    };
  } catch { return null; }
}

async function lookupIpApi(ip: string): Promise<Partial<IPInfo> | null> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,continent`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, any>;
    if (d.status !== "success") return null;
    const asMatch = typeof d.as === "string" ? d.as.match(/^AS(\d+)\s*(.*)$/i) : null;
    return {
      country: d.country ?? null,
      country_code: d.countryCode ?? null,
      city: d.city ?? null,
      subdivision: d.regionName ?? null,
      continent: d.continent ?? null,
      latitude: d.lat ?? null,
      longitude: d.lon ?? null,
      postal_code: d.zip ?? null,
      time_zone: d.timezone ?? null,
      asn: asMatch ? { asn: `AS${asMatch[1]}`, name: asMatch[2] || d.asname || null } : (d.asname ? { name: d.asname } : null),
      company: d.org || d.isp ? { name: d.org || d.isp } : null,
      privacy: (d.proxy != null || d.hosting != null) ? { is_proxy: d.proxy ?? null, is_hosting: d.hosting ?? null } : null,
      source: "ip-api.com",
    };
  } catch { return null; }
}

async function lookupFreeIpApi(ip: string): Promise<Partial<IPInfo> | null> {
  try {
    const res = await fetch(`https://free.freeipapi.com/api/json/${ip}`, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, any>;
    if (!d || d.ipVersion == null) return null;
    return {
      country: d.countryName ?? null,
      country_code: d.countryCode ?? null,
      city: d.cityName ?? null,
      subdivision: d.regionName ?? null,
      continent: d.continent ?? null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      postal_code: d.zipCode ?? null,
      time_zone: d.timeZone ?? null,
      is_anycast: null,
      source: "freeipapi.com",
    };
  } catch { return null; }
}

async function lookupReallyFreeGeoIP(ip: string): Promise<Partial<IPInfo> | null> {
  try {
    const res = await fetch(`https://reallyfreegeoip.org/json/${ip}`, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, any>;
    return {
      country: d.country_name ?? null,
      country_code: d.country_code ?? null,
      city: d.city ?? null,
      subdivision: d.region_name ?? null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      postal_code: d.zip_code ?? null,
      time_zone: d.time_zone ?? null,
      source: "reallyfreegeoip.org",
    };
  } catch { return null; }
}

function extractIPv4(ip: string): string | null {
  const mapped = ip.match(/^::(?:(?:ffff|FFFF):)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return mapped[1];
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return ip;
  return null;
}

function pickPreferredIP(forwardedHeader: string | undefined, fallback: string | undefined): string | null {
  if (!forwardedHeader) return fallback ?? null;
  const ips = forwardedHeader.split(",").map((s) => s.trim()).filter(Boolean);
  for (const ip of ips) {
    const ipv4 = extractIPv4(ip);
    if (ipv4) return ipv4;
  }
  return ips[0] ?? fallback ?? null;
}

export type ProviderId =
  | "auto"
  | "iplocate"
  | "ipwhois"
  | "ip-api"
  | "ipapi"
  | "freeipapi"
  | "reallyfreegeoip"
  | "ipiz";

export const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "auto", label: "Auto (fallback)" },
  { id: "iplocate", label: "iplocate.io" },
  { id: "ipwhois", label: "ipwho.is" },
  { id: "ip-api", label: "ip-api.com" },
  { id: "ipapi", label: "ipapi.co" },
  { id: "freeipapi", label: "freeipapi.com" },
  { id: "reallyfreegeoip", label: "reallyfreegeoip.org" },
  { id: "ipiz", label: "ipiz.net" },
];

const PROVIDER_MAP: Record<Exclude<ProviderId, "auto">, (ip: string) => Promise<Partial<IPInfo> | null>> = {
  iplocate: lookupIplocate,
  ipwhois: lookupIpwhois,
  "ip-api": lookupIpApi,
  ipapi: lookupIpapiCo,
  freeipapi: lookupFreeIpApi,
  reallyfreegeoip: lookupReallyFreeGeoIP,
  ipiz: lookupIpiz,
};

const AUTO_ORDER: ProviderId[] = ["iplocate", "ipwhois", "ip-api", "ipapi", "freeipapi", "reallyfreegeoip", "ipiz"];

async function lookup(ip: string, provider: ProviderId = "auto"): Promise<Partial<IPInfo>> {
  if (provider !== "auto") {
    const fn = PROVIDER_MAP[provider];
    const res = fn ? await fn(ip) : null;
    if (res) return res;
  }
  for (const id of AUTO_ORDER) {
    if (provider !== "auto" && id === provider) continue;
    const res = await PROVIDER_MAP[id as Exclude<ProviderId, "auto">](ip);
    if (res) return res;
  }
  return {};
}

export const getUserIP = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const p = (input as { provider?: string } | undefined)?.provider as ProviderId | undefined;
    return { provider: (p && (p === "auto" || p in PROVIDER_MAP) ? p : "auto") as ProviderId };
  })
  .handler(async ({ data }): Promise<IPInfo> => {
    const fallback = getRequestIP({ xForwardedFor: true }) ?? undefined;
    const forwarded = getRequestHeader("x-forwarded-for");
    const ip = pickPreferredIP(forwarded, fallback);
    if (!ip || ip === "::1" || ip === "127.0.0.1") {
      return { ip };
    }
    const info = await lookup(ip, data.provider);
    return { ip, ...info };
  });

const IP_RE = /^([0-9a-fA-F:.]{3,45})$/;
const DOMAIN_RE = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

async function resolveDomainDoH(host: string): Promise<string | null> {
  const endpoints = [
    "https://cloudflare-dns.com/dns-query",
    "https://dns.google/resolve",
  ];
  for (const base of endpoints) {
    for (const type of ["A", "AAAA"]) {
      try {
        const res = await fetch(
          `${base}?name=${encodeURIComponent(host)}&type=${type}`,
          { headers: { accept: "application/dns-json" } },
        );
        if (!res.ok) continue;
        const d = (await res.json()) as { Answer?: { type: number; data: string }[] };
        const wantType = type === "A" ? 1 : 28;
        const ans = d.Answer?.find((a) => a.type === wantType);
        if (ans?.data) return ans.data;
      } catch { /* try next */ }
    }
  }
  return null;
}

export const lookupIP = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const { ip, provider } = input as { ip: string; provider?: string };
    const v = (ip ?? "").trim();
    if (!v) throw new Error("Invalid input");
    if (!IP_RE.test(v) && !DOMAIN_RE.test(v)) throw new Error("Invalid IP or domain");
    const prov = (provider && (provider === "auto" || provider in PROVIDER_MAP) ? provider : "auto") as ProviderId;
    return { ip: v, provider: prov };
  })
  .handler(async ({ data }): Promise<IPInfo> => {
    let target = data.ip;
    let host: string | null = null;
    if (!IP_RE.test(target)) {
      host = target;
      const resolved = await resolveDomainDoH(target);
      if (!resolved) throw new Error("Could not resolve domain");
      target = resolved;
    }
    const info = await lookup(target, data.provider);
    return { ip: target, ...info, ...(host ? { host } : {}) };
  });
