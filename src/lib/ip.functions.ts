import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

export type IPInfo = {
  ip: string | null;
  asn?: number | null;
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
};

async function lookup(ip: string): Promise<Partial<IPInfo>> {
  try {
    const res = await fetch(`https://api.ipiz.net/${ip}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return {};
    const d = (await res.json()) as Record<string, unknown>;
    if (d.status && d.status !== "ok") return {};
    return {
      asn: (d.asn as number) ?? null,
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
    };
  } catch {
    return {};
  }
}

export const getUserIP = createServerFn({ method: "GET" }).handler(async (): Promise<IPInfo> => {
  const ip = getRequestIP({ xForwardedFor: true }) ?? null;
  if (!ip || ip === "::1" || ip === "127.0.0.1") {
    return { ip };
  }
  const info = await lookup(ip);
  return { ip, ...info };
});
