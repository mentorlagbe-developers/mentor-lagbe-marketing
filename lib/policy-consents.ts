/** Reusable policy / consent copy for modals across the app. */

export type PolicyConsentSection = {
  title?: string;
  body?: string;
  bullets?: string[];
};

export type PolicyConsentTone = "brand" | "neutral" | "warning";

export type PolicyConsentConfig = {
  id: string;
  title: string;
  eyebrow?: string;
  intro: string;
  sections: PolicyConsentSection[];
  checkboxLabel: string;
  continueLabel?: string;
  cancelLabel?: string;
  tone?: PolicyConsentTone;
};

/** Before joining a live session (student or mentor). */
export const MEETING_JOIN_CONSENT: PolicyConsentConfig = {
  id: "meeting-join",
  eyebrow: "Before you join",
  title: "Session privacy & recording notice",
  intro:
    "Mentor Lagbe provides built-in video for live sessions. Please review the following before entering the meeting room.",
  sections: [
    {
      title: "Privacy",
      bullets: [
        "Your name and session participation may be visible to the other party and platform administrators.",
        "Do not share passwords, OTPs, or sensitive personal data in the session chat unless required for learning.",
        "Session metadata (time, duration, participants) is stored for support and dispute resolution.",
      ],
    },
    {
      title: "Recording & legal notice",
      bullets: [
        "Sessions may be recorded (audio, video, and/or screen) for quality assurance, safety, and legal compliance.",
        "Recordings may be reviewed if a dispute, refund, or policy violation is reported.",
        "By continuing, you consent to participate under Mentor Lagbe's terms and applicable law.",
      ],
    },
    {
      title: "Conduct",
      body: "Harassment, sharing inappropriate content, or attempting to take sessions off-platform without approval may result in account action.",
    },
  ],
  checkboxLabel:
    "I have read and agree to the privacy notice and session recording policy. I wish to continue to the meeting.",
  continueLabel: "Continue to meeting",
  cancelLabel: "Not now",
  tone: "brand",
};

/** Before a student books a certification exam. */
export const CERT_BOOKING_CONSENT: PolicyConsentConfig = {
  id: "cert-booking",
  eyebrow: "Before booking",
  title: "Certification booking policy",
  intro:
    "Please review booking, payment, and refund terms before creating your certification booking.",
  sections: [
    {
      title: "Booking validity",
      bullets: [
        "Booking creates your seat request immediately and reserves the current displayed price.",
        "Booking status remains pending until your payment is submitted and reviewed.",
      ],
    },
    {
      title: "Payment & verification",
      bullets: [
        "Submit payment using the dashboard form with valid transaction ID and payer number.",
        "Incorrect or reused transaction IDs may lead to delayed approval or rejection.",
      ],
    },
    {
      title: "Refund / cancellation (current policy)",
      bullets: [
        "You may cancel while status is pending payment or payment is under review. Not allowed after payment is approved or a voucher is issued.",
        "Refund approvals depend on payment verification and compliance checks.",
      ],
    },
  ],
  checkboxLabel: "I have read and agree to the certification booking, payment, and refund policy.",
  continueLabel: "Agree & book exam",
  cancelLabel: "Cancel",
  tone: "brand",
};

/** Before a student submits certification payment evidence. */
export const CERT_PAYMENT_CONSENT: PolicyConsentConfig = {
  id: "cert-payment",
  eyebrow: "Before payment submit",
  title: "Certification payment declaration",
  intro:
    "Confirm payment details carefully before submitting. This helps us review and approve your booking faster.",
  sections: [
    {
      title: "Payment proof accuracy",
      bullets: [
        "You must provide the exact transaction ID and payer number used in your transfer.",
        "Submitting incorrect payment proof can lead to rejection.",
      ],
    },
    {
      title: "Review timeline",
      bullets: [
        "Submitted payments are reviewed by admin and status is updated in your booking history.",
        "Do not submit duplicate payments for the same booking unless support instructs you.",
      ],
    },
    {
      title: "Refund note",
      body: "Refund handling follows platform policy and approved verification outcomes.",
    },
  ],
  checkboxLabel: "I confirm the payment details are accurate and I agree to the certification payment policy.",
  continueLabel: "Agree & submit payment",
  cancelLabel: "Cancel",
  tone: "warning",
};
