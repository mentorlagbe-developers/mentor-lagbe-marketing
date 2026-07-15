import { accessibilityPolicy } from "./accessibility-policy";
import { communityGuidelines } from "./community-guidelines";
import { cookiesPolicy } from "./cookies-policy";
import { mentorAgreementAndCodeOfConduct } from "./mentor-agreement-and-code-of-conduct";
import { refundPolicy } from "./refund-policy";
import { studentSupportPolicy } from "./student-support";
import { studentTermsPrivacyAndPlatformPolicies } from "./student-terms-privacy-and-platform-policies";
import { termsOfService } from "./terms-of-service";
import type { PolicyDocument } from "./types";

export type { PolicyBlock, PolicyDocument, PolicySection, RolePolicyDocument } from "./types";

export const POLICY_DOCUMENTS: PolicyDocument[] = [
  mentorAgreementAndCodeOfConduct,
  studentTermsPrivacyAndPlatformPolicies,
  studentSupportPolicy,
  termsOfService,
  refundPolicy,
  communityGuidelines,
  cookiesPolicy,
  accessibilityPolicy,
];

export const POLICY_REGISTRY: Record<string, PolicyDocument> = Object.fromEntries(
  POLICY_DOCUMENTS.map((doc) => [doc.slug, doc]),
);

export const POLICY_NAV_LINKS = POLICY_DOCUMENTS.map((doc) => ({
  slug: doc.slug,
  label: doc.title,
  eyebrow: doc.eyebrow,
}));

export function getPolicyBySlug(slug: string): PolicyDocument | undefined {
  return POLICY_REGISTRY[slug];
}

export function getAllPolicySlugs(): string[] {
  return POLICY_DOCUMENTS.map((doc) => doc.slug);
}

export {
  accessibilityPolicy,
  communityGuidelines,
  cookiesPolicy,
  mentorAgreementAndCodeOfConduct,
  refundPolicy,
  studentSupportPolicy,
  studentTermsPrivacyAndPlatformPolicies,
  termsOfService,
};

export {
  FOOTER_BOTTOM_POLICY_LINKS,
  FOOTER_SUPPORT_POLICY_LINKS,
  policyLinkByLabel,
  policyPath,
} from "./footer-links";
