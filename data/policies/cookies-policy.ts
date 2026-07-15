import type { PolicyDocument } from "./types";

export const cookiesPolicy: PolicyDocument = {
  slug: "cookies-policy",
  eyebrow: "Privacy & cookies",
  title: "Cookies Policy",
  audience: "All users",
  lastUpdated: "July 2026",
  effectiveDate: "Upon visiting Mentor Lagbe websites or apps",
  intro:
    "This Cookies Policy explains how Mentor Lagbe uses cookies and similar technologies to operate the Platform, remember preferences, and improve user experience.",
  sections: [
    {
      id: "what-are-cookies",
      number: "1",
      title: "What Are Cookies?",
      blocks: [
        {
          kind: "paragraph",
          text: "Cookies are small text files stored on your device when you visit a website. They help the Platform remember login state, preferences, and basic usage information.",
        },
      ],
    },
    {
      id: "how-we-use",
      number: "2",
      title: "How We Use Cookies",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Essential cookies required for authentication, security, and core dashboard functionality.",
            "Preference cookies that remember settings such as theme or session state.",
            "Analytics cookies that help us understand feature usage and improve performance.",
          ],
        },
      ],
    },
    {
      id: "control",
      number: "3",
      title: "Managing Cookies",
      blocks: [
        {
          kind: "paragraph",
          text: "You can control or delete cookies through your browser settings. Disabling essential cookies may limit login, booking, or dashboard functionality.",
        },
      ],
    },
  ],
  acknowledgment: "By continuing to use Mentor Lagbe, you consent to cookies as described in this policy.",
};
