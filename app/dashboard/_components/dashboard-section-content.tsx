import { getDashboardMenuByRole, type DashboardSectionKey } from "@/app/dashboard/dashboard-menu";
import { LiveSessionBookingFlow } from "@/app/dashboard/_components/live-session/live-session-booking-flow";
import { LiveSessionOverview } from "@/app/dashboard/_components/live-session/live-session-overview";
import { MentorRegistrationPanel } from "@/app/dashboard/_components/admin/mentor-registration-panel";
import { AdminSessionRequestsPanel } from "@/app/dashboard/_components/admin/admin-session-requests-panel";
import { ProfileSection } from "./profile/profile-section";
import { SettingsSection } from "@/app/dashboard/_components/settings/settings-section";
import { BookingsSection } from "@/app/dashboard/_components/bookings/bookings-section";
import { StudentDashboardOverview } from "@/app/dashboard/_components/student/student-dashboard-overview";
import { MentorDashboardOverview } from "@/app/dashboard/_components/mentor/mentor-dashboard-overview";
import { MentorSessionRequests } from "@/app/dashboard/_components/mentor/mentor-session-requests";
import { PaymentsSection } from "@/app/dashboard/_components/payments/payments-section";
import { HelpCenterSection } from "@/app/dashboard/_components/help-center/help-center-section";
import { AdminPaymentsPanel } from "@/app/dashboard/_components/admin/admin-payments-panel";
import type { UserRole } from "@/lib/mock-auth";

type DashboardSectionContentProps = {
  section: DashboardSectionKey;
  role: UserRole;
};

export function DashboardSectionContent({ section, role }: DashboardSectionContentProps) {
  if (role === "student" && section === "dashboard") {
    return <StudentDashboardOverview />;
  }

  if (role === "teacher" && section === "dashboard") {
    return <MentorDashboardOverview />;
  }

  if (role === "teacher" && section === "session-requests") {
    return <MentorSessionRequests />;
  }

  if (section === "live-session") {
    return <LiveSessionOverview />;
  }

  if (section === "live-session-book") {
    return <LiveSessionBookingFlow />;
  }

  if (section === "profile") {
    return <ProfileSection role={role} />;
  }

  if (section === "platform-settings") {
    return <SettingsSection role={role} />;
  }

  if (section === "bookings") {
    return <BookingsSection />;
  }

  if (section === "payments" && role === "student") {
    return <PaymentsSection />;
  }

  if (section === "help-center") {
    return <HelpCenterSection role={role} />;
  }

  if (role === "superadmin" && section === "admin-session-requests") {
    return <AdminSessionRequestsPanel />;
  }

  if (role === "superadmin" && section === "admin-payments") {
    return <AdminPaymentsPanel />;
  }

  const sectionMeta = getDashboardMenuByRole(role).find((item) => item.id === section);
  if (!sectionMeta) {
    return null;
  }

  return (
    <section className="space-y-5">
      {(role === "admin" || role === "superadmin") && section === "user-management" ? <MentorRegistrationPanel /> : null}

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
