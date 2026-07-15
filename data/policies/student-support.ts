import type { PolicyDocument } from "./types";

export const studentSupportPolicy: PolicyDocument = {
  slug: "student-support",
  eyebrow: "Student support",
  title: "Student Support Guide",
  audience: "Students",
  lastUpdated: "July 2026",
  effectiveDate: "Upon use of Mentor Lagbe student services",
  intro:
    "This guide explains how students can get help with bookings, live sessions, certification exams, payments, and account issues on Mentor Lagbe.",
  sections: [
    {
      id: "getting-help",
      number: "1",
      title: "How to Get Help",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Use the Help Center in your dashboard for FAQs and role-specific guidance.",
            "Contact support through the Contact form on the website footer or landing page.",
            "Include your booking ID, payment reference, or session ID when reporting an issue.",
          ],
        },
      ],
    },
    {
      id: "bookings",
      number: "2",
      title: "Bookings & Live Sessions",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Bookings remain requests until a mentor accepts and payment rules are satisfied.",
            "Join live sessions only through the authorized join button in your dashboard.",
            "If a mentor is late or absent, contact support with your session ID and scheduled time.",
            "Repeated no-shows or abusive cancellations may affect future booking privileges.",
          ],
        },
      ],
    },
    {
      id: "payments",
      number: "3",
      title: "Payments & Verification",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Submit the correct payment method, amount, transaction ID, and payer number.",
            "Do not submit duplicate payments while a review is still pending.",
            "Payment approval timelines depend on verification and admin review.",
          ],
        },
        {
          kind: "warning",
          text: "Incorrect or reused transaction IDs may lead to delayed approval or rejection.",
        },
      ],
    },
    {
      id: "certifications",
      number: "4",
      title: "Certification Exam Support",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Review certification booking, payment, and refund terms before creating a booking.",
            "Cancellation eligibility depends on booking status and platform review decisions.",
            "Keep your exam code and booking reference available for support requests.",
          ],
        },
      ],
    },
    {
      id: "safety",
      number: "5",
      title: "Safety, Privacy & Conduct",
      blocks: [
        {
          kind: "paragraph",
          text: "Students must use authorized Platform channels only, treat mentors respectfully, and avoid requests that violate academic integrity. For full policy details, see the Privacy Policy and Community Guidelines.",
        },
      ],
    },
    {
      id: "contact",
      number: "6",
      title: "What to Include in a Support Request",
      blocks: [
        {
          kind: "numbered",
          items: [
            "Your account email or student readable ID.",
            "Booking or session ID (for example SES- or CERT- references).",
            "Payment method, TrxID, and submission date if payment-related.",
            "A short description of the issue and any screenshots if available.",
          ],
        },
      ],
    },
  ],
  acknowledgment:
    "Mentor Lagbe support reviews requests according to platform records, payment verification, and applicable policies.",
};
