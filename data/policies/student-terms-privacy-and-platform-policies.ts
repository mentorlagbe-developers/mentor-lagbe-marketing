import type { PolicyDocument } from "./types";

export const studentTermsPrivacyAndPlatformPolicies: PolicyDocument = {
  slug: "privacy-policy",
  audience: "Students",
  eyebrow: "Student policies",
  title: "Student Code of Conduct, Privacy & Platform Policy",
  lastUpdated: "July 2026",
  effectiveDate: "Upon account registration or continued use of the Platform",
  intro:
    "To maintain a secure, equitable, and high-quality learning environment on our one-to-one mentorship platform, all students are required to adhere to the following rules and guidelines. Compliance with these policies ensures the protection of both students and mentors while preserving the integrity of our services.",
  sections: [
    {
      id: "scheduling-attendance",
      number: "1",
      title: "Session Scheduling, Attendance & Punctuality",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Punctuality: Students must join scheduled sessions promptly via the official platform link. It is the student's responsibility to ensure availability at the designated start time.",
            "Cancellation Notice: If a student is unable to attend, notice must be submitted through the platform at least one (1) hour prior to the scheduled session.",
            "No-Show Policy: Failure to attend a session without the required prior notice will be classified as a \"No-Show.\"",
            "Account Restrictions: Documented patterns of late cancellations or repeated No-Shows may result in temporary or permanent restrictions on future session bookings.",
          ],
        },
      ],
    },
    {
      id: "cancellation-refund",
      number: "2",
      title: "Cancellation & Refund Policy",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Processing Timelines: Approved refunds for canceled sessions may require 1 to 2 days for processing, subject to verification and institutional guidelines.",
            "Eligibility: Refund approval is contingent upon the timing of the cancellation and compliance with platform terms.",
            "Policy Abuse: Unjustified, frequent cancellations or manipulation of the booking system may result in the forfeiture of refund eligibility and account review.",
          ],
        },
      ],
    },
    {
      id: "professional-conduct",
      number: "3",
      title: "Professional Conduct & Mutual Respect",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Behavioral Expectations: Students are expected to maintain a respectful, professional, and serious demeanor during all interactions.",
            "Zero-Tolerance Policy: Any form of harassment, abuse, discrimination, or inappropriate behavior toward mentors or staff is strictly prohibited and grounds for immediate termination.",
            "Academic Focus: Sessions must remain strictly dedicated to the designated educational curriculum. Irrelevant, disruptive, or highly personal dialogue is prohibited.",
          ],
        },
      ],
    },
    {
      id: "confidentiality-ip",
      number: "4",
      title: "Confidentiality & Intellectual Property",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Recording Prohibited: Any form of unauthorized digital recording—including screen captures, audio, or video recording of sessions—is strictly forbidden.",
            "Distribution Restrictions: Students may not share, distribute, upload, or resell any proprietary materials, session links, notes, or curriculum insights provided through the platform.",
            "Confidentiality Agreement: All discussions, proprietary methodologies, and learning materials shared during mentorship remain strictly confidential within the platform.",
          ],
        },
      ],
    },
    {
      id: "session-access",
      number: "5",
      title: "Session Access & Single-User Restrictions",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Authorized Access: Each booked session is strictly non-transferable and limited exclusively to the single registered student.",
            "Credential Sharing: Sharing session links or allowing unauthorized third parties to participate in a paid session is strictly prohibited.",
            "Enforcement: Unauthorized access violations will result in an immediate review and potential suspension of the offending account.",
          ],
        },
      ],
    },
    {
      id: "communication-boundaries",
      number: "6",
      title: "Communication Boundaries",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Platform Exclusivity: All communication between students and mentors must occur exclusively through the platform's official channels.",
            "Contact Information: The exchange of personal phone numbers, email addresses, social media profiles, or external contact details is strictly prohibited.",
            "Solicitation: Students must not solicit or pressure mentors for private arrangements or communication outside the platform.",
          ],
        },
      ],
    },
    {
      id: "technical-requirements",
      number: "7",
      title: "Technical Infrastructure Requirements",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Student Responsibility: Students are responsible for procuring and maintaining a stable internet connection and compatible hardware/software prior to the session.",
            "Disruption Policy: Missed or disrupted sessions due to technical failures on the student's side do not qualify for mandatory rescheduling or refunds.",
            "Pre-Session Verification: Students are strongly encouraged to test their equipment and connectivity before each scheduled session.",
          ],
        },
      ],
    },
    {
      id: "academic-integrity",
      number: "8",
      title: "Academic Integrity & Ethical Standards",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Educational Purpose: Mentorship sessions are designed for supplemental learning, skill development, and conceptual guidance.",
            "Academic Misconduct: Platform services must not be used to facilitate academic dishonesty, including the direct copying of exam answers, completing assignments on behalf of the student, or bypassing independent evaluation metrics.",
            "Compliance: Misuse of mentorship for unfair academic advantage will result in disciplinary action.",
          ],
        },
      ],
    },
    {
      id: "platform-integrity",
      number: "9",
      title: "Platform Integrity & System Exploitation",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Fraud Prevention: Fraudulent activities—including spam bookings, malicious cancellation loops, or attempts to circumvent the platform's payment gateway—are strictly prohibited.",
            "Account Duplication: Users are prohibited from creating multiple accounts to exploit promotions, bypass restrictions, or manipulate platform metrics.",
          ],
        },
      ],
    },
    {
      id: "account-security",
      number: "10",
      title: "Account Security & Credential Protection",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Data Safeguards: Students are solely responsible for maintaining the confidentiality and security of their platform login credentials.",
            "Prohibited Delegation: Allowing secondary users to access or utilize an account is strictly prohibited. Any suspected data breaches or unauthorized access must be reported to support services immediately.",
          ],
        },
      ],
    },
    {
      id: "quality-assurance",
      number: "11",
      title: "Quality Assurance & Monitoring",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Session Audits: The platform reserves the right to monitor and record sessions for quality assurance, safety, dispute resolution, and regulatory compliance.",
            "Disciplinary Scale: Substantiated complaints or policy infractions will result in a progressive disciplinary response, ranging from formal warnings to permanent account revocation.",
          ],
        },
      ],
    },
    {
      id: "enforcement",
      number: "12",
      title: "Enforcement, Jurisdiction & Revisions",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Remedial Actions: Violations of this policy may result in session cancellation, refund denial, temporary account suspension, or permanent termination, depending on the severity of the infraction.",
            "Right to Investigate: The platform reserves the right to investigate any reported or suspected breach of this policy.",
            "Policy Amendments: The company reserves the right to modify, amend, or update these policies at any time without prior notice to adapt to regulatory changes and ensure the safety of our community.",
          ],
        },
      ],
    },
  ],
  acknowledgment:
    "By registering, booking sessions, or continuing to use Mentor Lagbe as a student, you confirm that you have read and agreed to this Student Code of Conduct, Privacy & Platform Policy.",
};
