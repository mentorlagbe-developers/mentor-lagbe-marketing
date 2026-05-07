import { redirect } from "next/navigation";

type DashboardRootPageProps = {
  searchParams: Promise<{ role?: string }>;
};

function resolvePreviewRole(role: string | undefined) {
  if (role === "teacher" || role === "admin" || role === "superadmin") {
    return role;
  }
  return "student";
}

export default async function DashboardRootPage({ searchParams }: DashboardRootPageProps) {
  const role = resolvePreviewRole((await searchParams).role);
  redirect(`/dashboard/dashboard?role=${role}`);
}
