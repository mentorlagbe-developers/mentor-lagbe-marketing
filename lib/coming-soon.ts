/**
 * Coming-soon / Vercel-only mode (no backend).
 * Set NEXT_PUBLIC_COMING_SOON=true and COMING_SOON=true on Vercel.
 * Re-enable: set both to false and restore BACKEND_LIVE blocks (see docs/COMING_SOON_VERCEL_LAUNCH.md).
 */
export function isComingSoonMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_COMING_SOON === "true" ||
    process.env.COMING_SOON === "true"
  );
}
