/**
 * True when the string looks like a usable Google Meet URL (https, meet.google.com, valid path).
 * Incomplete or malformed URLs (e.g. trailing "-") return false so UI can disable "Join" actions.
 */
export function isValidGoogleMeetUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  let u: URL;
  try {
    u = new URL(t.includes("://") ? t : `https://${t}`);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host !== "meet.google.com" && !host.endsWith(".meet.google.com")) return false;
  const pathOnly = u.pathname.split("?")[0].replace(/\/+$/, "") || "/";
  // Typical room: /xxx-yyy-zzz (optional trailing slash / query stripped above from pathname — pathname has no ?)
  if (/^\/[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/i.test(pathOnly)) return true;
  if (u.pathname.startsWith("/lookup/") && u.pathname.length > "/lookup/".length + 2) return true;
  return false;
}
