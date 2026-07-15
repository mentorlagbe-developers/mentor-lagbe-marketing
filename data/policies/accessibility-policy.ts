import type { PolicyDocument } from "./types";

export const accessibilityPolicy: PolicyDocument = {
  slug: "accessibility",
  eyebrow: "Accessibility",
  title: "Accessibility Statement",
  audience: "All users",
  lastUpdated: "July 2026",
  effectiveDate: "Upon use of Mentor Lagbe websites and applications",
  intro:
    "Mentor Lagbe is committed to making learning resources, dashboards, and live session tools accessible to as many users as possible. We continue improving keyboard navigation, contrast, readable typography, and responsive layouts.",
  sections: [
    {
      id: "commitment",
      number: "1",
      title: "Our Commitment",
      blocks: [
        {
          kind: "paragraph",
          text: "We aim to support users with diverse needs by designing interfaces that work across devices, screen sizes, and assistive technologies where reasonably possible.",
        },
      ],
    },
    {
      id: "features",
      number: "2",
      title: "Current Accessibility Features",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Responsive layouts for mobile, tablet, and desktop use.",
            "Readable text sizing and high-contrast dashboard themes where supported.",
            "Keyboard-accessible navigation for major dashboard actions and forms.",
            "Clear labels and status messaging across booking, payment, and session flows.",
          ],
        },
      ],
    },
    {
      id: "feedback",
      number: "3",
      title: "Feedback & Support",
      blocks: [
        {
          kind: "paragraph",
          text: "If you encounter an accessibility barrier while using Mentor Lagbe, contact support through the Help Center with a description of the issue, the page or feature involved, and your device or browser details.",
        },
      ],
    },
  ],
  acknowledgment: "Accessibility improvements are an ongoing priority across the Mentor Lagbe platform.",
};
