import type { PolicyDocument } from "./types";

export const communityGuidelines: PolicyDocument = {
  slug: "community-guidelines",
  eyebrow: "Community standards",
  title: "Community Guidelines",
  audience: "All users",
  lastUpdated: "July 2026",
  effectiveDate: "Upon participation in any Platform activity",
  intro:
    "Mentor Lagbe is built on respectful learning, trust, and safety. These Community Guidelines apply to students, mentors, staff interactions, and all communications on the Platform.",
  sections: [
    {
      id: "respect",
      number: "1",
      title: "Respectful Communication",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Treat mentors, students, and support staff with courtesy and professionalism.",
            "Do not use harassment, threats, hate speech, or discriminatory language.",
            "Keep discussions focused on learning and Platform-supported activities.",
          ],
        },
      ],
    },
    {
      id: "safety",
      number: "2",
      title: "Safety & Privacy",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Do not share passwords, OTPs, or sensitive financial credentials.",
            "Use only authorized Platform channels for scheduling, messaging, and payments.",
            "Report suspicious behavior, impersonation, or policy violations to support.",
          ],
        },
      ],
    },
    {
      id: "integrity",
      number: "3",
      title: "Academic Integrity",
      blocks: [
        {
          kind: "paragraph",
          text: "Mentor Lagbe supports genuine learning. Students must not request completed academic work, and mentors must not provide dishonest assistance for graded assignments or exams.",
        },
      ],
    },
    {
      id: "content",
      number: "4",
      title: "Content & Recording",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Do not record, screenshot, or redistribute session content without required authorization.",
            "Do not upload harmful, illegal, or misleading material through Platform features.",
            "Respect intellectual property belonging to mentors, students, and the Platform.",
          ],
        },
      ],
    },
    {
      id: "enforcement",
      number: "5",
      title: "Enforcement",
      blocks: [
        {
          kind: "paragraph",
          text: "Violations may result in warnings, temporary restrictions, refund review outcomes, payout holds, or permanent account removal depending on severity and repeat behavior.",
        },
      ],
    },
  ],
  acknowledgment: "Participating in Mentor Lagbe means agreeing to uphold these community standards.",
};
