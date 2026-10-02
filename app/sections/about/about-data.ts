import type { LucideIcon } from "lucide-react";
import { BookOpenCheck, HeartHandshake, Sparkles, Target } from "lucide-react";

export type AboutValue = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  /** Tailwind border-top color classes, e.g. border-t-sky-500 */
  topBorderClass?: string;
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
  imageLabel: string;
  /** Public path under /public, e.g. /about/raiyan.png */
  imageSrc?: string;
  linkedinUrl: string;
  facebookUrl: string;
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

export const teamMembers: TeamMember[] = [
  {
    id: "tm-raiyan",
    name: "Mohammad Raiyan Al Sultan",
    role: "Co-Founder & CTO",
    imageLabel: "MR",
    imageSrc: "/about/raiyan.png",
    linkedinUrl: "https://www.linkedin.com/in/raiyan-al-sultan",
    facebookUrl: "https://www.facebook.com/md.raiyan.al.sultan",
  },
  {
    id: "tm-nayeem",
    name: "Mahadi Hasan Nayeem",
    role: "Co-Founder & CMM",
    imageLabel: "MH",
    imageSrc: "/about/nayeem.jpeg",
    linkedinUrl: "https://www.linkedin.com/in/mahadihasannayeem/",
    facebookUrl: "https://www.facebook.com/profile.php?id=61584452465137",
  },
  {
    id: "tm-sudeep",
    name: "Sudeep Mondal",
    role: "Co-Founder & CFO",
    imageLabel: "SM",
    linkedinUrl: "#",
    facebookUrl: "#",
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
