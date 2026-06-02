/** Session display ID — API always provides `readable_id` (snake_case). */

export function sessionReadableIdFromRecord(
  record: Record<string, unknown> | null | undefined,
): string {
  if (!record) return "—";
  const raw = record.readable_id ?? record.readableId;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "—";
}
