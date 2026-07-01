import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserIP } from "@/lib/ip.functions";
import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";

const ipQuery = () => ({
  queryKey: ["user-ip"],
  queryFn: getUserIP,
});

export const Route = createFileRoute("/")({
  component: Index,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(ipQuery());
  },
});

function Index() {
  const fetchIP = useServerFn(getUserIP);
  const { data, refetch, isFetching } = useSuspenseQuery({
    ...ipQuery(),
    queryFn: fetchIP,
  });
  const [copied, setCopied] = useState(false);

  const ip = data?.ip ?? "تشخیص داده نشد";

  const code = data?.country_code?.toUpperCase();
  const FlagComponent =
    code && hasFlag(code) ? (Flags as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[code] : null;

  const details: Array<{ label: string; value: string | null | undefined }> = [
    { label: "کشور", value: data?.country ? `${data.country}${data.country_code ? ` (${data.country_code})` : ""}` : null },
    { label: "منطقه", value: data?.region || null },
    { label: "شهر", value: data?.city || null },
    { label: "کد پستی", value: data?.postal || null },
    { label: "قاره", value: data?.continent || null },
    { label: "منطقه زمانی", value: data?.timezone || null },
    { label: "مختصات", value: data?.latitude != null && data?.longitude != null ? `${data.latitude}, ${data.longitude}` : null },
    { label: "سازمان (ISP)", value: data?.org_name || null },
    { label: "ASN", value: data?.asn != null ? `AS${data.asn}` : null },
    { label: "شبکه Tor", value: data?.is_tor == null ? null : data.is_tor ? "بله" : "خیر" },
  ].filter((d) => d.value);

  const handleCopy = async () => {
    if (!data?.ip) return;
    await navigator.clipboard.writeText(data.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">آدرس IP شما</CardTitle>
          <CardDescription>این آدرس IP عمومی شما در اینترنت است</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 py-6 text-center">
            {FlagComponent && (
              <div className="mb-3 flex justify-center">
                <FlagComponent title={data?.country ?? code ?? ""} className="h-10 w-auto rounded shadow-sm" />
              </div>
            )}
            <div
              className={`font-mono text-3xl font-semibold tracking-widest text-foreground transition-opacity ${isFetching ? "opacity-50" : "opacity-100"}`}
            >
              {isFetching ? "..." : ip}
            </div>
          </div>
          {details.length > 0 && (
            <div className="rounded-lg border divide-y">
              {details.map((d) => (
                <div key={d.label} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium text-foreground text-left" dir="ltr">{d.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={handleCopy} disabled={!data?.ip || isFetching} className="flex-1">
              {copied ? "کپی شد" : "کپی IP"}
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              disabled={isFetching}
              className="flex-1"
            >
              به‌روزرسانی
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
