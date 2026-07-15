"use client";

import { PolicyDocumentBody, PolicyDocumentHero } from "@/app/components/policies/policy-document-view";
import { getPrivacyPolicyForRole } from "@/lib/dashboard-privacy-policies";
import type { UserRole } from "@/lib/mock-auth";

type PrivacyPoliciesSectionProps = {
  role: UserRole;
};

export function PrivacyPoliciesSection({ role }: PrivacyPoliciesSectionProps) {
  const policyRole = role === "teacher" ? "teacher" : "student";
  const doc = getPrivacyPolicyForRole(policyRole);

  return (
    <section className="space-y-5">
      <PolicyDocumentHero doc={doc} />
      <PolicyDocumentBody doc={doc} />
    </section>
  );
}
