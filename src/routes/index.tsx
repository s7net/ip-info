import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserIP } from "@/lib/ip.functions";

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

  const handleCopy = async () => {
    if (!data?.ip) return;
    await navigator.clipboard.writeText(data.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">آدرس IP شما</CardTitle>
          <CardDescription>این آدرس IP عمومی شما در اینترنت است</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 py-6 text-center">
            <div
              className={`font-mono text-3xl font-semibold tracking-widest text-foreground transition-opacity ${isFetching ? "opacity-50" : "opacity-100"}`}
            >
              {isFetching ? "..." : ip}
            </div>
          </div>
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
