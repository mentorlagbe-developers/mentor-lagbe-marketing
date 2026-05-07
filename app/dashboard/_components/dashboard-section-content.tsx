import { getDashboardMenuByRole, type DashboardSectionKey } from "@/app/dashboard/dashboard-menu";
import { LiveSessionOverview } from "@/app/dashboard/_components/live-session/live-session-overview";
import { StudentDashboardOverview } from "@/app/dashboard/_components/student/student-dashboard-overview";
import type { UserRole } from "@/lib/mock-auth";

type DashboardSectionContentProps = {
  section: DashboardSectionKey;
  role: UserRole;
};

export function DashboardSectionContent({ section, role }: DashboardSectionContentProps) {
  const sectionMeta = getDashboardMenuByRole(role).find((item) => item.id === section);

  if (!sectionMeta) {
    return null;
  }

  if (role === "student" && section === "dashboard") {
    return <StudentDashboardOverview />;
  }

  if (section === "live-session") {
    return <LiveSessionOverview />;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Current Workspace</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{sectionMeta.label}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Your {sectionMeta.label.toLowerCase()} workspace for <span className="capitalize">{role}</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <article key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              {sectionMeta.label} card {index + 1}
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              Dynamic {sectionMeta.label} module
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Replace this block with connected data, analytics widgets, or management tools
              for <span className="font-medium capitalize">{role}</span> users.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
