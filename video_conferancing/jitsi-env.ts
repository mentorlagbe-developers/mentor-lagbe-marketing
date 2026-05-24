export function isJitsiEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_JITSI_ENABLED ?? "true").toLowerCase() !== "false";
}

export function jitsiDomain(): string {
  return (process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si").trim() || "meet.jit.si";
}
