import type { PolicyDocument } from "./types";

export const mentorAgreementAndCodeOfConduct: PolicyDocument = {
  slug: "mentor-guidelines",
  audience: "Mentors",
  eyebrow: "Mentor policies",
  title: "Mentor Agreement & Code of Conduct",
  lastUpdated: "July 2026",
  effectiveDate: "Upon account registration or acceptance of terms",
  intro:
    'This Mentor Agreement & Code of Conduct (the "Agreement") constitutes a legally binding agreement between you (the "Mentor") and Mentor Lagbe (the "Platform"). By registering as a Mentor, creating an account, or accessing or using the Platform\'s services, you expressly agree to be bound by the terms, conditions, and standards set forth herein.',
  sections: [
    {
      id: "scope",
      number: "1",
      title: "Scope & Purpose of the Mentor Program",
      blocks: [
        {
          kind: "paragraph",
          text: 'The Platform serves as an intermediary digital ecosystem connecting registered learners ("Students") with qualified educators and specialists ("Mentors") for personalized, interactive, one-to-one or group learning sessions.',
        },
        {
          kind: "paragraph",
          text: "The primary objective of the Mentor is to provide high-quality instructional guidance, clarify complex concepts, assist with learning challenges, and foster academic development. By participating in this program, the Mentor commits to maintaining exceptional professional standards, safeguarding Student privacy, and complying with all operational policies.",
        },
      ],
    },
    {
      id: "eligibility",
      number: "2",
      title: "Eligibility, Verification, & Credentials",
      blocks: [
        {
          kind: "paragraph",
          text: "To qualify and maintain active status as a Mentor on the Platform, you must satisfy and warrant the following:",
        },
      ],
      subsections: [
        {
          id: "expertise",
          title: "2.1 Academic & Domain Expertise",
          blocks: [
            {
              kind: "bullets",
              items: [
                "You possess verified, advanced knowledge and comprehensive understanding of the specific subjects, courses, or topics you register to teach.",
                "You hold the necessary academic credentials, practical industry experience, or proven technical expertise required to deliver high-standard instruction.",
                "You demonstrate the communication and pedagogical skills necessary to articulate concepts clearly and adjust to varying learning capacities.",
              ],
            },
          ],
        },
        {
          id: "verification",
          title: "2.2 Verification & Background Screening",
          blocks: [
            {
              kind: "paragraph",
              text: "The Platform reserves the absolute right, but not the obligation, to conduct verification procedures at any time. This may include:",
            },
            {
              kind: "bullets",
              items: [
                "Verifying academic transcripts, degrees, and professional certifications.",
                "Auditing self-reported skills, professional portfolios, and prior experience.",
                "Requiring live demo sessions, practical assessments, or interviews.",
              ],
            },
            {
              kind: "warning",
              text: "Crucial warning: Provision of falsified, misleading, or plagiarized credentials during or after the registration process constitutes a material breach of this Agreement and will result in immediate termination of the Mentor's account, forfeiture of pending payouts, and potential legal action.",
            },
          ],
        },
      ],
    },
    {
      id: "responsibilities",
      number: "3",
      title: "Standard of Professional Responsibilities",
      blocks: [
        {
          kind: "paragraph",
          text: "The Mentor agrees to adhere to the highest pedagogical and ethical standards, including but not limited to:",
        },
        {
          kind: "bullets",
          items: [
            "Providing accurate, up-to-date, and evidence-based instructional guidance.",
            "Conducting adequate preparation prior to the commencement of each scheduled session.",
            "Adhering strictly to agreed-upon course syllabus guidelines and platform-approved materials.",
            "Tailoring teaching methodologies dynamically to align with individual Student learning styles and cognitive needs.",
            "Instruction vs. execution: The Mentor's primary mandate is to educate, guide, and support. Mentors are strictly prohibited from executing, completing, or producing academic work on behalf of a Student.",
          ],
        },
      ],
    },
    {
      id: "scheduling",
      number: "4",
      title: "Scheduling, Attendance, & Reliability Policy",
      blocks: [
        {
          kind: "paragraph",
          text: "Reliability is paramount to the operational integrity of the Platform. Mentors must adhere to the following scheduling protocols:",
        },
        {
          kind: "bullets",
          items: [
            "Punctuality: Mentors must join scheduled sessions precisely at the confirmed start time and remain present for the entire duration of the booked slot.",
            "Cancellations & rescheduling: In the event of an unavoidable emergency, the Mentor must notify both the Student and Platform Support at least twenty-four (24) hours in advance.",
            "Reliability metrics: Frequent cancellations, late arrivals, or unexcused absences (no-shows) will negatively impact the Mentor's internal ranking, visibility, and platform-wide algorithm placement, and may lead to administrative suspension.",
          ],
        },
      ],
    },
    {
      id: "conduct",
      number: "5",
      title: "Live Session Conduct & Behavioral Standards",
      blocks: [
        {
          kind: "paragraph",
          text: "The Platform enforces a zero-tolerance policy regarding unprofessional conduct. Sessions must be conducted in a courteous, professional, and safe manner.",
        },
      ],
      subsections: [
        {
          id: "expected-behavior",
          title: "5.1 Expected Professional Behavior",
          blocks: [
            {
              kind: "bullets",
              items: [
                "Maintain respectful, encouraging, and clear verbal and written communication.",
                "Actively listen to student queries and address challenges patiently.",
                "Deliver constructive, professional feedback aimed at boosting student confidence.",
              ],
            },
          ],
        },
        {
          id: "prohibited-behavior",
          title: "5.2 Strictly Prohibited Behavior",
          blocks: [
            {
              kind: "paragraph",
              text: "Mentors are strictly prohibited from engaging in the following actions:",
            },
            {
              kind: "bullets",
              items: [
                "Using derogatory, offensive, obscene, or intimidating language.",
                "Engaging in harassment, bullying, or discrimination of any form, including but not limited to bias based on race, gender, religion, physical ability, skill level, nationality, or sexual orientation.",
                "Utilizing scheduled sessions for unsolicited personal, political, or religious discussions.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "privacy",
      number: "6",
      title: "Privacy, Personal Data, & Anti-Disintermediation Policy",
      blocks: [
        {
          kind: "paragraph",
          text: "To protect the security and privacy of all users, and to maintain the integrity of the Platform's business model, strict communication boundaries are enforced.",
        },
        {
          kind: "bullets",
          items: [
            "No direct contact: Mentors are strictly prohibited from soliciting, requesting, extracting, or sharing personal contact details with Students.",
            "Prohibited channels include personal phone numbers and messaging applications (e.g., WhatsApp, Telegram), personal email addresses, social media profiles (e.g., Facebook, LinkedIn, Instagram), and physical addresses.",
            "Authorized channels: All communications, scheduling, file sharing, and video streaming must occur exclusively within the Platform's designated, secure interfaces.",
          ],
        },
        {
          kind: "warning",
          text: "Penalty for breach: Any attempt to bypass the Platform's communication or billing infrastructure (disintermediation) will result in immediate, permanent account termination and the forfeiture of all accrued, unpaid earnings.",
        },
      ],
    },
    {
      id: "media",
      number: "7",
      title: "Media, Recording, & Content Distribution Policy",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Video & camera usage: Mentors must ensure a professional, clean, quiet, and well-lit background during video calls. Camera usage must comply with Platform instructions.",
            "Unauthorized recording: Recording, screenshotting, or capturing any portion of a live session without explicit, written, prior authorization from both the Student and the Platform is strictly prohibited.",
            "Content ownership: Mentors may not distribute, license, sell, or publicly share student-submitted work, platform-provided training resources, or session recordings on third-party channels (such as YouTube, personal websites, or social media).",
          ],
        },
      ],
    },
    {
      id: "integrity",
      number: "8",
      title: "Academic Integrity & Anti-Cheating Compliance",
      blocks: [
        {
          kind: "paragraph",
          text: "The Platform is dedicated to authentic, ethical learning. Mentors must strictly uphold academic integrity guidelines.",
        },
        {
          kind: "bullets",
          items: [
            "Prohibited assistance: Mentors must not write, solve, or complete academic assignments, live examinations, midterms, quizzes, graded lab reports, or institutional projects on behalf of a Student.",
            "Permissible assistance: Mentors may explain core theoretical frameworks, demonstrate similar mock examples, debug student-written code conceptually, and teach the foundational methodologies required for the student to complete their work independently.",
            "Compliance: Mentors must decline any request that facilitates academic dishonesty or plagiarism.",
          ],
        },
      ],
    },
    {
      id: "quality",
      number: "9",
      title: "Quality Assurance & Performance Auditing",
      blocks: [
        {
          kind: "paragraph",
          text: "The Platform continuously monitors instructional quality to maintain system-wide excellence. Quality metrics are assessed via:",
        },
        {
          kind: "bullets",
          items: [
            "Cumulative Student ratings and qualitative reviews.",
            "Session completion rates and punctuality metrics.",
            "Audits of random session logs or materials when resolving disputes.",
            "Continuous improvement: Mentors are expected to adapt and improve their instructional quality based on performance data and feedback provided by the Platform's administration.",
          ],
        },
      ],
    },
    {
      id: "payouts",
      number: "10",
      title: "Platform Monetization, Validation, & Payout Terms",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Payment validation: Payouts are calculated, authorized, and processed strictly for successfully completed, verified sessions that comply with this Agreement.",
            "Fraud prevention: Creating fraudulent sessions, simulating attendance, or attempting to exploit the billing system will result in the immediate clawback of funds and permanent termination of platform access.",
            "Disputes: In the event of a student dispute regarding session quality or attendance, the Platform reserves sole and absolute discretion to arbitrate, withhold, or refund payments.",
          ],
        },
      ],
    },
    {
      id: "confidentiality",
      number: "11",
      title: "Confidentiality Agreement",
      blocks: [
        {
          kind: "paragraph",
          text: "During the course of your engagement, you may gain access to proprietary, sensitive, or confidential information (including but not limited to user databases, operational frameworks, business strategies, and private student details).",
        },
        {
          kind: "bullets",
          items: [
            "You agree to keep all such information strictly confidential.",
            "You shall not disclose, leak, or utilize such proprietary information for any personal or commercial purpose outside of the direct fulfillment of your duties on the Platform.",
          ],
        },
      ],
    },
    {
      id: "violations",
      number: "12",
      title: "Policy Violations & Disciplinary Procedures",
      blocks: [
        {
          kind: "paragraph",
          text: "The Platform reserves the right, at its sole discretion, to investigate alleged violations of this Agreement. If a violation is confirmed, the Platform may execute disciplinary measures including, but not limited to:",
        },
        {
          kind: "numbered",
          items: [
            "Formal warning: A written warning requiring immediate correction of a minor policy infraction.",
            "Account suspension: Temporary suspension of profile visibility, scheduling abilities, and access to current students.",
            "Program disqualification: Removal of the Mentor from specific high-tier subjects or courses.",
            "Permanent termination: Immediate, permanent ban from the Platform, forfeiture of pending payout balances, and—where applicable—referral to academic institutions or legal authorities.",
          ],
        },
      ],
    },
    {
      id: "acknowledgment",
      number: "13",
      title: "Electronic Acknowledgment & Consent",
      blocks: [
        {
          kind: "paragraph",
          text: 'By clicking "I Agree," "Submit," or by continuing to log into and utilize your Mentor Profile on the Platform, you formally declare that you have read, understood, and agreed to be legally bound by this Mentor Agreement & Code of Conduct. You acknowledge that failure to adhere to these standards may result in immediate administrative action as outlined in Section 12.',
        },
      ],
    },
  ],
  acknowledgment:
    "Continued use of your Mentor account constitutes acceptance of this Agreement and all related Platform policies.",
}
