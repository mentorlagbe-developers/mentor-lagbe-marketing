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
