"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "@/app/components/ui/about/section-heading";
import { TeamMemberCard } from "@/app/components/ui/about/team-member-card";
import type { TeamMember } from "@/app/sections/about/about-data";
import { useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";

type AboutTeamSectionProps = {
  members: TeamMember[];
};

const ROLE_KEYS: Record<string, MessageKey> = {
  "tm-raiyan": "about.team.role.cto",
  "tm-nayeem": "about.team.role.cmm",
  "tm-sudeep": "about.team.role.cfo",
};

export function AboutTeamSection({ members }: AboutTeamSectionProps) {
  const t = useT();

  const localizedMembers = members.map((member) => ({
    ...member,
    role: ROLE_KEYS[member.id] ? t(ROLE_KEYS[member.id]) : member.role,
  }));

  return (
    <section className="bg-slate-50 py-14 dark:bg-slate-900/60 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("about.team.eyebrow")}
          title={t("about.team.title")}
          description={t("about.team.sub")}
          centered
        />
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="mx-auto mt-10 flex max-w-5xl flex-wrap items-stretch justify-center gap-5"
          >
            {localizedMembers.map((member, index) => (
              <motion.div
                key={member.id}
                layout
                className="flex w-full justify-center sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
              >
                <TeamMemberCard member={member} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
