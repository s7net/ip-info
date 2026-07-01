import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

export const getUserIP = createServerFn({ method: "GET" }).handler(async () => {
  const ip = getRequestIP({ xForwardedFor: true });
  return { ip: ip ?? null };
});
