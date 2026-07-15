import type { PolicyDocument } from "./types";

export const refundPolicy: PolicyDocument = {
  slug: "refund-policy",
  eyebrow: "Billing policy",
  title: "Refund Policy",
  audience: "Students & mentors",
  lastUpdated: "July 2026",
  effectiveDate: "Upon payment submission or payout review",
  intro:
    "This Refund Policy explains when refunds may be approved, how disputes are reviewed, and how completed session payouts are handled on Mentor Lagbe.",
  sections: [
    {
      id: "overview",
      number: "1",
      title: "Overview",
      blocks: [
        {
          kind: "paragraph",
          text: "Refund eligibility depends on booking status, payment verification outcome, session completion, cancellation timing, and compliance with Platform policy.",
        },
      ],
    },
    {
      id: "live-sessions",
      number: "2",
      title: "Live Session Refunds",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Payments under review are not final until approved by Platform administration.",
            "Refund requests may be considered when a session is cancelled, not delivered, or disputed according to Platform rules.",
            "Duplicate or fraudulent payment submissions may be rejected without refund until reviewed.",
          ],
        },
      ],
    },
    {
      id: "certifications",
      number: "3",
      title: "Certification Booking Refunds",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Certification refunds depend on booking status, payment verification, and cancellation timing.",
            "Approved refunds are processed according to the payment method and review workflow used at submission time.",
            "Voucher issuance or exam scheduling may affect refund eligibility.",
          ],
        },
        {
          kind: "warning",
          text: "Refund approvals depend on payment verification and compliance checks. Submitting incorrect transaction details may delay or prevent approval.",
        },
      ],
    },
    {
      id: "mentor-payouts",
      number: "4",
      title: "Mentor Payouts",
      blocks: [
        {
          kind: "paragraph",
          text: "Mentor earnings are released for successfully completed and verified sessions. In disputes, the Platform may withhold or adjust payouts while a review is in progress.",
        },
      ],
    },
    {
      id: "process",
      number: "5",
      title: "How to Request a Review",
      blocks: [
        {
          kind: "paragraph",
          text: "Contact Mentor Lagbe support through the Help Center with your booking ID, payment reference, and a clear description of the issue. The Platform will review available session, payment, and attendance records before making a decision.",
        },
      ],
    },
  ],
  acknowledgment: "Refund decisions are made according to Platform policy, verification records, and applicable law.",
};
