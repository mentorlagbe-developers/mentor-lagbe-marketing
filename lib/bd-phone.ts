/** Digits-only BD E.164 without '+' (e.g. 8801712345678). */
export function normalizeBdPhoneDigits(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;

  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = `88${digits}`;
  if (digits.startsWith("1") && digits.length === 10) digits = `880${digits}`;
  if (digits.startsWith("88") && !digits.startsWith("880") && digits.length === 12) {
    digits = `880${digits.slice(2)}`;
  }
  if (!/^8801[3-9]\d{8}$/.test(digits)) return null;
  return digits;
}

/** API / form display: +8801712345678 */
export function formatBdPhoneForApi(input: string | null | undefined): string | undefined {
  const digits = normalizeBdPhoneDigits(input);
  return digits ? `+${digits}` : undefined;
}

export function formatBdPhoneForDisplay(input: string | null | undefined): string {
  return formatBdPhoneForApi(input) ?? (input?.trim() ?? "");
}

export function isValidBdPhoneApi(value: string): boolean {
  return /^\+8801[3-9]\d{8}$/.test(value.trim());
}
