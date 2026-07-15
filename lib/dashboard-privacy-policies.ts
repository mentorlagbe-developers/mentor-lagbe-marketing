import type { PolicyDocument, RolePolicyDocument } from "@/data/policies/types";
import {
  mentorAgreementAndCodeOfConduct,
  studentTermsPrivacyAndPlatformPolicies,
} from "@/data/policies";

export type { PolicyBlock, PolicyDocument, PolicySection, RolePolicyDocument } from "@/data/policies/types";

function toRolePolicy(doc: PolicyDocument, role: "student" | "teacher"): RolePolicyDocument {
  return { ...doc, role };
}

export const MENTOR_PRIVACY_POLICY = toRolePolicy(mentorAgreementAndCodeOfConduct, "teacher");
export const STUDENT_PRIVACY_POLICY = toRolePolicy(studentTermsPrivacyAndPlatformPolicies, "student");

export function getPrivacyPolicyForRole(role: "student" | "teacher"): RolePolicyDocument {
  return role === "teacher" ? MENTOR_PRIVACY_POLICY : STUDENT_PRIVACY_POLICY;
}
