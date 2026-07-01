import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

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

async function lookup(ip: string): Promise<Partial<IPInfo>> {
  return (await lookupIplocate(ip)) ?? (await lookupIpiz(ip)) ?? {};
}

export const getUserIP = createServerFn({ method: "GET" }).handler(async (): Promise<IPInfo> => {
  const ip = getRequestIP({ xForwardedFor: true }) ?? null;
  if (!ip || ip === "::1" || ip === "127.0.0.1") {
    return { ip };
  }
  const info = await lookup(ip);
  return { ip, ...info };
});

const IP_RE = /^([0-9a-fA-F:.]{3,45})$/;
const DOMAIN_RE = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

async function resolveDomainCheckHost(host: string): Promise<string | null> {
  try {
    const start = await fetch(
      `https://check-host.net/check-dns?host=${encodeURIComponent(host)}&max_nodes=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!start.ok) return null;
    const startData = (await start.json()) as { request_id?: string };
    const id = startData.request_id;
    if (!id) return null;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 700));
      const res = await fetch(`https://check-host.net/check-result/${id}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, unknown>;
      let pending = false;
      for (const node of Object.values(data)) {
        if (node == null) {
          pending = true;
          continue;
        }
        const arr = Array.isArray(node) ? node : [node];
        for (const item of arr) {
          const rec = item as { A?: string[]; AAAA?: string[] } | null;
          if (rec?.A?.length) return rec.A[0];
          if (rec?.AAAA?.length) return rec.AAAA[0];
        }
      }
      if (!pending) break;
    }
    return null;
  } catch {
    return null;
  }
}

export const lookupIP = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const { ip } = input as { ip: string };
    const v = (ip ?? "").trim();
    if (!v) throw new Error("Invalid input");
    if (!IP_RE.test(v) && !DOMAIN_RE.test(v)) throw new Error("Invalid IP or domain");
    return { ip: v };
  })
  .handler(async ({ data }): Promise<IPInfo> => {
    let target = data.ip;
    let host: string | null = null;
    if (!IP_RE.test(target)) {
      host = target;
      const resolved = await resolveDomainCheckHost(target);
      if (!resolved) throw new Error("Could not resolve domain via check-host.net");
      target = resolved;
    }
    const info = await lookup(target);
    return { ip: target, ...info, ...(host ? { host } : {}) };
  });
