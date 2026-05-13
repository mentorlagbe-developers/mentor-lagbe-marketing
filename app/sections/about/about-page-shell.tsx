"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import { ContactModal } from "@/app/components/ui/contact-modal";
import Footer from "@/app/components/ui/Footer";
import { AboutHeroSection } from "@/app/sections/about/about-hero-section";
import { AboutMissionSection } from "@/app/sections/about/about-mission-section";
import { AboutTimelineSection } from "@/app/sections/about/about-timeline-section";
import { AboutTeamSection } from "@/app/sections/about/about-team-section";
import { AboutGrowthMetricsSection } from "@/app/sections/about/about-growth-metrics-section";
import {
  aboutHero,
  coreValues,
  growthMetrics,
  journeyMilestones,
  mission,
  teamMembers,
} from "@/app/sections/about/about-data";
import type { AuthUser } from "@/lib/mock-auth";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";

export function AboutPageShell() {
  const router = useRouter();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const user = useSyncExternalStore<AuthUser | null>(
    subscribeAuthStore,
    readAuthSnapshot,
    () => null
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <LandingHeader
        user={user}
        onAuthClick={() => router.push("/?auth=login")}
        onDashboardClick={() => router.push("/dashboard")}
        onContactClick={() => setIsContactModalOpen(true)}
      />
      <main>
        <AboutHeroSection data={aboutHero} />
        <AboutMissionSection
          heading={mission.heading}
          description={mission.description}
          imageCaption={mission.imageCaption}
          values={coreValues}
        />
        <AboutTimelineSection milestones={journeyMilestones} />
        <AboutTeamSection members={teamMembers} />
        <AboutGrowthMetricsSection metrics={growthMetrics} />
      </main>
      <Footer />
      <ContactModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}
