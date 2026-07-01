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

export const lookupIP = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const { ip } = input as { ip: string };
    if (!ip || !IP_RE.test(ip)) throw new Error("Invalid IP");
    return { ip };
  })
  .handler(async ({ data }): Promise<IPInfo> => {
    const info = await lookup(data.ip);
    return { ip: data.ip, ...info };
  });
