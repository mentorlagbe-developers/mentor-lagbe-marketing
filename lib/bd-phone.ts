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

/** API / profile: +8801712345678 (operator digit 3–9). */
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

/**
 * Certification payment (`SubmitCertificationPaymentDto`): +8801 + 9 digits.
 * Slightly looser than profile phone validation.
 */
export function formatBdPhoneForCertPayment(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (/^\+8801\d{9}$/.test(trimmed)) return trimmed;

  const fromProfile = formatBdPhoneForApi(trimmed);
  if (fromProfile && /^\+8801\d{9}$/.test(fromProfile)) return fromProfile;

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = `88${digits}`;
  if (digits.startsWith("1") && digits.length === 10) digits = `880${digits}`;
  if (digits.startsWith("880") && digits.length === 13) return `+${digits}`;

  if (trimmed.startsWith("+880")) return trimmed;
  if (trimmed.startsWith("880")) return `+${digits.startsWith("880") ? digits.slice(0, 13) : trimmed}`;
  if (trimmed.startsWith("01")) return `+88${trimmed}`;

  return trimmed;
}

export function isValidBdPhoneForCertPayment(value: string): boolean {
  return /^\+8801\d{9}$/.test(formatBdPhoneForCertPayment(value));
}

/** @deprecated Use formatBdPhoneForCertPayment */
export const toBdPhoneE164Api = formatBdPhoneForCertPayment;

/** @deprecated Use isValidBdPhoneForCertPayment */
export const isValidBdPhoneE164Api = isValidBdPhoneForCertPayment;
