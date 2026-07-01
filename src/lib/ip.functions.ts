import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

export type IPInfo = {
  ip: string | null;
  asn?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  country_code?: string | null;
  continent?: string | null;
  continent_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  org_name?: string | null;
  org_country?: string | null;
  postal?: string | null;
  timezone?: string | null;
  is_tor?: boolean | null;
  is_vpn?: boolean | null;
  is_proxy?: boolean | null;
  is_hosting?: boolean | null;
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
    const asn = d.asn as Record<string, any> | undefined;
    const company = d.company as Record<string, any> | undefined;
    const privacy = d.privacy as Record<string, any> | undefined;
    return {
      asn: asn?.asn ?? null,
      city: (d.city as string) || null,
      region: (d.subdivision as string) || null,
      country: (d.country as string) || null,
      country_code: (d.country_code as string) || null,
      continent: (d.continent as string) || null,
      latitude: (d.latitude as number) ?? null,
      longitude: (d.longitude as number) ?? null,
      org_name: (company?.name as string) || (asn?.name as string) || null,
      org_country: (company?.country_code as string) || null,
      postal: (d.postal_code as string) || null,
      timezone: (d.time_zone as string) || null,
      is_tor: privacy?.is_tor ?? null,
      is_vpn: privacy?.is_vpn ?? null,
      is_proxy: privacy?.is_proxy ?? null,
      is_hosting: privacy?.is_hosting ?? null,
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
      asn: d.asn != null ? `AS${d.asn}` : null,
      city: (d.city as string) || null,
      region: (d.region as string) || null,
      country: (d.country as string) || null,
      country_code: (d.country_code as string) || null,
      continent: (d.continent as string) || null,
      continent_code: (d.continent_code as string) || null,
      latitude: (d.latitude as number) ?? null,
      longitude: (d.longitude as number) ?? null,
      org_name: (d.org_name as string) || null,
      org_country: (d.org_country as string) || null,
      postal: (d.postal as string) || null,
      timezone: (d.timezone as string) || null,
      is_tor: (d.is_tor as boolean) ?? null,
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
