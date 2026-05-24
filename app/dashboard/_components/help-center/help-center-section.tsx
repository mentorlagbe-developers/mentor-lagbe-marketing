"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  UserCircle2,
  Video,
  Wallet,
} from "lucide-react";
import { ContactModal } from "@/app/components/ui/contact-modal";
import { Button } from "@/app/components/ui/button";
import { SITE_CONTACT } from "@/lib/site-contact";
import type { UserRole } from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

type FaqItem = { question: string; answer: string };

const sharedFaq: FaqItem[] = [
  {
    question: "How do I contact support?",
    answer:
      "Use the Contact support button on this page, email us, or call during support hours. We aim to respond within one business day.",
  },
  {
    question: "Is my account data secure?",
    answer:
      "Yes. We use secure API communication, access controls, and privacy-first handling for profile and session data.",
  },
];

const studentFaq: FaqItem[] = [
  {
    question: "How do I book a live session?",
    answer:
      "Go to Live Session → Book Session, choose your topic and time, then submit. A mentor will accept and add a meeting link.",
  },
  {
    question: "When can I join the meeting?",
    answer:
      "After your mentor provides a Google Meet link and your payment is confirmed, the Join meeting button will be enabled on your Live Session page.",
  },
  {
    question: "How do I pay for a session?",
    answer:
      "Open Payments from the sidebar to view history and submit bKash or Nagad payments. Confirmation may take a short review period.",
  },
];

const teacherFaq: FaqItem[] = [
  {
    question: "How do I accept a session request?",
    answer:
      "Open Session Requests, review the student details, enter a valid Google Meet link, and accept. The student is notified automatically.",
  },
  {
    question: "Can I update the meet link later?",
    answer:
      "Yes. From your dashboard upcoming sessions, use Edit meet link to PATCH an updated Google Meet URL before the session starts.",
  },
  {
    question: "When do I receive earnings?",
    answer:
      "Earnings appear in your Earnings section after sessions are completed and payouts are processed according to platform policy.",
  },
];

const adminFaq: FaqItem[] = [
  {
    question: "How do I review session requests?",
    answer:
      "Use Session Request in the admin menu to monitor demand, approvals, and related payment snapshots on each session.",
  },
  {
    question: "How are mentors approved?",
    answer:
      "Mentor applications are reviewed under Mentor Management. Approved mentors can receive live session requests from students.",
  },
];

type QuickLink = {
  label: string;
  description: string;
  href: string;
  icon: typeof Video;
};

function getQuickLinks(role: UserRole): QuickLink[] {
  if (role === "student") {
    return [
      {
        label: "Book a session",
        description: "Schedule your next live mentorship",
        href: "/dashboard/live-session-book",
        icon: Video,
      },
      {
        label: "Payments",
        description: "History and upcoming dues",
        href: "/dashboard/payments",
        icon: Wallet,
      },
      {
        label: "Your profile",
        description: "Update contact and academic info",
        href: "/dashboard/profile",
        icon: UserCircle2,
      },
      {
        label: "Bookings",
        description: "Past and upcoming sessions",
        href: "/dashboard/bookings",
        icon: CalendarDays,
      },
    ];
  }
  if (role === "teacher") {
    return [
      {
        label: "Session requests",
        description: "Accept or decline incoming requests",
        href: "/dashboard/session-requests",
        icon: MessageSquareText,
      },
      {
        label: "Earnings",
        description: "Track completed session payouts",
        href: "/dashboard/earnings",
        icon: Wallet,
      },
      {
        label: "Dashboard",
        description: "Upcoming sessions and meet links",
        href: "/dashboard/dashboard",
        icon: CalendarDays,
      },
      {
        label: "Your profile",
        description: "Mentor profile and availability",
        href: "/dashboard/profile",
        icon: UserCircle2,
      },
    ];
  }
  return [
    {
      label: "User management",
      description: "Students and platform users",
      href: "/dashboard/user-management",
      icon: UserCircle2,
    },
    {
      label: "Mentor management",
      description: "Applications and mentor roster",
      href: "/dashboard/mentor-management",
      icon: UserCircle2,
    },
    {
      label: "Reports",
      description: "Platform analytics and exports",
      href: "/dashboard/reports",
      icon: CalendarDays,
    },
    {
      label: "Session requests",
      description: "Admin session oversight",
      href: "/dashboard/admin-session-requests",
      icon: MessageSquareText,
    },
  ];
}

function getRoleFaq(role: UserRole): FaqItem[] {
  if (role === "student") return studentFaq;
  if (role === "teacher") return teacherFaq;
  return adminFaq;
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <article
            key={item.question}
            className={cn(
              "overflow-hidden rounded-2xl border border-slate-200 bg-white transition dark:border-slate-700 dark:bg-slate-900",
              isOpen && "border-sky-200 shadow-sm dark:border-sky-800/50"
            )}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span className="font-semibold text-slate-900 dark:text-slate-100">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-slate-500 transition-transform",
                  isOpen && "rotate-180 text-sky-500"
                )}
              />
            </button>
            {isOpen ? (
              <div className="border-t border-slate-100 px-5 pb-4 pt-2 dark:border-slate-700">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.answer}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export function HelpCenterSection({ role }: { role: UserRole }) {
  const router = useRouter();
  const [contactOpen, setContactOpen] = useState(false);
  const quickLinks = getQuickLinks(role);
  const faqItems = [...sharedFaq, ...getRoleFaq(role)];

  function withRoleQuery(path: string) {
    if (typeof window === "undefined") return path;
    const query = new URLSearchParams(window.location.search);
    const roleParam = query.get("role");
    if (!roleParam) return path;
    return `${path}${path.includes("?") ? "&" : "?"}role=${roleParam}`;
  }

  return (
    <section className="space-y-6">
      <article className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 shadow-sm dark:border-sky-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-800 dark:bg-slate-800/80 dark:text-sky-300">
            <CircleHelp className="h-3.5 w-3.5" />
            Help Center
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            How can we help you?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Find answers, reach our team, and jump to the right part of your dashboard.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={SITE_CONTACT.emailHref}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <Mail className="h-4 w-4 text-sky-500" />
              {SITE_CONTACT.email}
            </a>
            <a
              href={SITE_CONTACT.phoneHref}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <Phone className="h-4 w-4 text-sky-500" />
              {SITE_CONTACT.phone}
            </a>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <MapPin className="h-4 w-4 text-sky-500" />
              Dhaka, Bangladesh
            </span>
          </div>

          <Button className="mt-6" onClick={() => setContactOpen(true)}>
            Contact support
          </Button>
        </div>
      </article>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick links</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => router.push(withRoleQuery(link.href))}
                className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-800/50"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 font-semibold text-slate-900 dark:text-slate-100">
                    {link.label}
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{link.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-sky-500" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Support hours</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{SITE_CONTACT.supportHours}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{SITE_CONTACT.responseTime}</p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{SITE_CONTACT.address}</p>
          </div>
        </div>
      </article>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Frequently asked questions</h3>
        <div className="mt-3">
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
