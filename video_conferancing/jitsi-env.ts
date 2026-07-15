export function isJitsiEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_JITSI_ENABLED ?? "true").toLowerCase() !== "false";
}

export function jitsiDomain(): string {
  return (process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si").trim() || "meet.jit.si";
}

/** Public Jitsi — custom Nest JWTs are not validated; lobby must be disabled client-side. */
export function isPublicJitsiDomain(domain?: string): boolean {
  const d = (domain ?? jitsiDomain()).toLowerCase().replace(/^https?:\/\//, "");
  return d === "meet.jit.si" || d.endsWith(".jit.si");
}
