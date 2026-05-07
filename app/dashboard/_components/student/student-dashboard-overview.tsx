import { BookOpenCheck, BriefcaseBusiness, Cpu } from "lucide-react";
import { StudentHeroSlider, type StudentHeroSlide } from "@/app/dashboard/_components/student/student-hero-slider";
import { StudentCourseTable } from "@/app/dashboard/_components/student/student-course-table";
import { StudentLearningProgress } from "@/app/dashboard/_components/student/student-learning-progress";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { StudentUpcomingSessions } from "@/app/dashboard/_components/student/student-upcoming-sessions";

const slides: StudentHeroSlide[] = [
  {
    id: "cse-core-concepts",
    title: "CSE Core Concepts Sprint",
    subtitle: "Master Data Structures, OOP, and DBMS with semester-focused live classes.",
    ctaLabel: "Start Module",
    ctaIcon: Cpu,
    ctaValue: "৳ 999",
    badge: "70% Off",
    gradientFrom: "#0f172a",
    gradientTo: "#1d4ed8",
  },
  {
    id: "bba-case-lab",
    title: "BBA Case Study Lab",
    subtitle: "Build business strategy, marketing, and finance decision skills with real cases.",
    ctaLabel: "Join Lab",
    ctaIcon: BriefcaseBusiness,
    ctaValue: "৳ 799",
    badge: "Live Batch",
    gradientFrom: "#1e3a8a",
    gradientTo: "#0284c7",
  },
  {
    id: "university-exam-bootcamp",
    title: "University Exam Revision Bootcamp",
    subtitle: "CSE + BBA exam prep with quick notes, problem solving, and viva guidance.",
    ctaLabel: "Enroll Today",
    ctaIcon: BookOpenCheck,
    ctaValue: "৳ 649",
    badge: "New",
    gradientFrom: "#0f766e",
    gradientTo: "#1d8cff",
  },
];

export function StudentDashboardOverview() {
  return (
    <section className="space-y-5">
      <StudentHeroSlider slides={slides} />
      <StudentQuickStats />
      <div className="grid gap-4 xl:grid-cols-2">
        <StudentUpcomingSessions />
        <StudentLearningProgress />
      </div>
      <StudentCourseTable />
    </section>
  );
}
