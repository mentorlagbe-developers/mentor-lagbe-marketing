import Link from "next/link";
import { LinkedinIcon, TwitterXIcon } from "@/app/components/ui/icons";
import type { TeamMember } from "@/app/sections/about/about-data";

type TeamMemberCardProps = {
  member: TeamMember;
};

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="relative h-48 bg-linear-to-br from-slate-300 via-slate-200 to-sky-200 grayscale transition duration-300 group-hover:grayscale-0 dark:from-slate-700 dark:via-slate-800 dark:to-sky-900">
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-slate-700 dark:text-slate-200">
          {member.imageLabel}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {member.name}
        </h3>
        <p className="text-sm font-medium text-sky-600 dark:text-sky-300">{member.role}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{member.bio}</p>
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={member.linkedinUrl}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:text-sky-300"
            aria-label={`${member.name} LinkedIn`}
          >
            <LinkedinIcon className="h-4 w-4" />
          </Link>
          <Link
            href={member.xUrl}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:text-sky-300"
            aria-label={`${member.name} X profile`}
          >
            <TwitterXIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
