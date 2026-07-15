import type { PolicyDocument } from "./types";

export const termsOfService: PolicyDocument = {
  slug: "terms-of-service",
  eyebrow: "Platform terms",
  title: "Terms of Service",
  audience: "All users",
  lastUpdated: "July 2026",
  effectiveDate: "Upon account registration or continued use of the Platform",
  intro:
    "These Terms of Service govern access to Mentor Lagbe websites, applications, dashboards, live sessions, certification bookings, and related services. By using the Platform, you agree to these terms alongside role-specific policies.",
  sections: [
    {
      id: "acceptance",
      number: "1",
      title: "Acceptance of Terms",
      blocks: [
        {
          kind: "paragraph",
          text: "Creating an account, booking a session, submitting a payment, or otherwise using Mentor Lagbe means you accept these Terms of Service and any policies referenced here.",
        },
      ],
    },
    {
      id: "accounts",
      number: "2",
      title: "Accounts & Eligibility",
      blocks: [
        {
          kind: "bullets",
          items: [
            "You must provide accurate registration information and keep your credentials secure.",
            "You are responsible for activity performed through your account.",
            "Mentor Lagbe may suspend or terminate accounts that violate platform rules or applicable law.",
          ],
        },
      ],
    },
    {
      id: "services",
      number: "3",
      title: "Platform Services",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Mentor Lagbe connects Students and Mentors for live learning, certification support, and related educational services.",
            "The Platform may update features, pricing, verification flows, and operational policies as the product evolves.",
            "Service availability may vary by region, device, payment method, or maintenance windows.",
          ],
        },
      ],
    },
    {
      id: "payments",
      number: "4",
      title: "Payments & Billing",
      blocks: [
        {
          kind: "paragraph",
          text: "Payments must be submitted through authorized Platform flows. Pricing, verification, refunds, and payout handling follow the applicable booking, certification, mentor, and refund policies.",
        },
      ],
    },
    {
      id: "liability",
      number: "5",
      title: "Limitation of Liability",
      blocks: [
        {
          kind: "paragraph",
          text: "Mentor Lagbe provides the Platform on an as-available basis. To the fullest extent permitted by law, the Platform is not liable for indirect, incidental, or consequential damages arising from use of the service.",
        },
      ],
    },
  ],
  acknowledgment: "Continued use of Mentor Lagbe constitutes acceptance of these Terms of Service.",
};
