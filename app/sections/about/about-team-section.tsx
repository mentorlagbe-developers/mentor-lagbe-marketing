"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "@/app/components/ui/about/section-heading";
import { TeamMemberCard } from "@/app/components/ui/about/team-member-card";
import type { TeamMember } from "@/app/sections/about/about-data";

type AboutTeamSectionProps = {
  members: TeamMember[];
};

export function AboutTeamSection({ members }: AboutTeamSectionProps) {
  return (
    <section className="bg-slate-50 py-14 dark:bg-slate-900/60 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Team"
          title="People Behind the Platform"
          description="A multidisciplinary team focused on trust, speed, and practical student success."
          centered
        />
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                layout
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
