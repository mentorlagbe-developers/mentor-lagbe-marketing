import { ApiError } from "@/lib/api";

/** User-facing message; includes validation field hints when present. */
export function formatApiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ApiError) {
    if (error.details?.length) {
      const parts = error.details.map((d) => {
        const field = d.field && d.field !== "unknown" ? d.field : null;
        const msg = d.message?.trim() || "Invalid value";
        return field ? `${field}: ${msg}` : msg;
      });
      return parts.join(" · ");
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
