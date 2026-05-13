import type { LucideIcon } from "lucide-react";
import { BookOpenCheck, HeartHandshake, Sparkles, Target } from "lucide-react";

export type AboutValue = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
};

export type JourneyMilestone = {
  id: string;
  year: string;
  title: string;
  description: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageLabel: string;
  linkedinUrl: string;
  xUrl: string;
};

export type GrowthMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export const aboutHero = {
  badge: "About Mentor Lagbe",
  title: "Bridging the Gap Between Ambition and Expertise",
  description:
    "We connect students with verified mentors for focused one-to-one sessions, so every learner can move from confusion to confidence faster.",
  primaryCta: {
    label: "Book a Session",
    href: "/?auth=register",
  },
  secondaryCta: {
    label: "Meet our Mentors",
    href: "/dashboard?section=mentors",
  },
};

export const mission = {
  heading: "Our Mission",
  description:
    "Mentor Lagbe exists to make personalized learning accessible, practical, and outcome-driven for every student in Bangladesh and beyond.",
  imageCaption: "Human-first mentoring for practical growth",
};

export const coreValues: AboutValue[] = [
  {
    id: "impact",
    title: "Impact",
    description: "We optimize every session for real academic outcomes and measurable progress.",
    icon: Target,
    accentClass: "from-sky-500/15 to-indigo-500/15 text-sky-600 dark:text-sky-300",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    description: "Flexible scheduling and affordable pricing ensure quality support is always reachable.",
    icon: HeartHandshake,
    accentClass: "from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-300",
  },
  {
    id: "personalized-growth",
    title: "Personalized Growth",
    description: "Topic-wise, one-to-one mentorship aligned to each learner's pace and goals.",
    icon: Sparkles,
    accentClass: "from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-300",
  },
  {
    id: "mentor-quality",
    title: "Mentor Quality",
    description: "We onboard experienced experts and continuously improve session quality standards.",
    icon: BookOpenCheck,
    accentClass: "from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-300",
  },
];

export const journeyMilestones: JourneyMilestone[] = [
  {
    id: "mvp",
    year: "2023",
    title: "MVP Launch",
    description: "Started with a small cohort of students solving course blockers through live calls.",
  },
  {
    id: "network",
    year: "2024",
    title: "Mentor Network Expansion",
    description: "Scaled to multiple departments and universities with verified mentor onboarding.",
  },
  {
    id: "platform",
    year: "2025",
    title: "Platform Evolution",
    description: "Built robust booking, profile, and session workflows for a reliable learning experience.",
  },
  {
    id: "today",
    year: "Today",
    title: "Nationwide Mentorship Movement",
    description: "Empowering thousands of learners with focused 1:1 sessions and practical guidance.",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "tm-01",
    name: "Rafid Hasan",
    role: "Founder & Product Lead",
    bio: "Leads product vision with a focus on meaningful student outcomes.",
    imageLabel: "RH",
    linkedinUrl: "#",
    xUrl: "#",
  },
  {
    id: "tm-02",
    name: "Nusrat Jahan",
    role: "Head of Mentor Success",
    bio: "Builds mentor quality systems and learning excellence programs.",
    imageLabel: "NJ",
    linkedinUrl: "#",
    xUrl: "#",
  },
  {
    id: "tm-03",
    name: "Tawsif Rahman",
    role: "Engineering Manager",
    bio: "Drives platform reliability, speed, and seamless user experience.",
    imageLabel: "TR",
    linkedinUrl: "#",
    xUrl: "#",
  },
  {
    id: "tm-04",
    name: "Sadia Akter",
    role: "Community Growth Lead",
    bio: "Partners with campuses and student communities to expand impact.",
    imageLabel: "SA",
    linkedinUrl: "#",
    xUrl: "#",
  },
];

export const growthMetrics: GrowthMetric[] = [
  {
    id: "sessions",
    label: "Live Sessions Delivered",
    value: "10k+",
    detail: "Topic-specific 1:1 sessions completed",
  },
  {
    id: "experts",
    label: "Verified Experts",
    value: "500+",
    detail: "Mentors across major academic disciplines",
  },
  {
    id: "satisfaction",
    label: "Student Satisfaction",
    value: "98%",
    detail: "Learners reporting positive session outcomes",
  },
  {
    id: "response",
    label: "Average Match Time",
    value: "< 15m",
    detail: "From request to mentor allocation",
  },
];
