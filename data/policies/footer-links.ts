/**
 * Footer link labels mapped to policy slugs.
 * Keep labels in sync with `app/components/ui/Footer.tsx`.
 */
export const FOOTER_SUPPORT_POLICY_LINKS = [
  { label: "Mentor Guidelines & Policy", slug: "mentor-guidelines" },
  { label: "Student Support", slug: "student-support" },
  { label: "Student Privacy Policy", slug: "privacy-policy" },
  { label: "Terms of Service", slug: "terms-of-service" },
  { label: "Refund Policy", slug: "refund-policy" },
  { label: "Community Guidelines", slug: "community-guidelines" },
] as const;

export const FOOTER_BOTTOM_POLICY_LINKS = [
  { label: "Privacy Policy", slug: "privacy-policy" },
  { label: "Terms of Service", slug: "terms-of-service" },
  { label: "Cookies", slug: "cookies-policy" },
  { label: "Accessibility", slug: "accessibility" },
] as const;

export function policyPath(slug: string): string {
  return `/policies/${slug}`;
}

export function policyLinkByLabel(label: string): string | undefined {
  const match =
    FOOTER_SUPPORT_POLICY_LINKS.find((item) => item.label === label) ??
    FOOTER_BOTTOM_POLICY_LINKS.find((item) => item.label === label);
  return match ? policyPath(match.slug) : undefined;
}
