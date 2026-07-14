import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleHelp,
  FileBarChart2,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ScrollText,
  ShieldCheck,
  UserCircle2,
  Users,
  Verified,
  Video,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@/lib/mock-auth";

export type DashboardSectionKey =
  | "dashboard"
  | "live-session"
  | "live-session-book"
  | "bookings"
  | "profile"
  | "payments"
  | "my-students"
  | "session-requests"
  | "mentor-live-sessions"
  | "earnings"
  | "user-management"
  | "mentor-management"
  | "reports"
  | "help-center"
  | "privacy-policies"
  | "platform-settings"
  | "security-center"
  | "pricing"
  | "certifications"
  | "admin-certifications"
  | "admin-session-requests"
  | "admin-payments";

export type DashboardMenuItem = {
  id: DashboardSectionKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

const allMenuItems: Record<DashboardSectionKey, DashboardMenuItem> = {
  dashboard: {
    id: "dashboard",
    label: "Dashbaord",
    href: "/dashboard/dashboard",
    icon: LayoutDashboard,
  },
  "live-session": {
    id: "live-session",
    label: "Live Session",
    href: "/dashboard/live-session",
    icon: Video,
  },
  "live-session-book": {
    id: "live-session-book",
    label: "Book Session",
    href: "/dashboard/live-session-book",
    icon: Video,
  },
  bookings: {
    id: "bookings",
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarDays,
  },
  profile: {
    id: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle2,
  },
  payments: {
    id: "payments",
    label: "Payments",
    href: "/dashboard/payments",
    icon: Wallet,
  },
  "my-students": {
    id: "my-students",
    label: "My Students",
    href: "/dashboard/my-students",
    icon: GraduationCap,
  },
  "session-requests": {
    id: "session-requests",
    label: "Session Requests",
    href: "/dashboard/session-requests",
    icon: MessageSquareText,
  },
  "mentor-live-sessions": {
    id: "mentor-live-sessions",
    label: "Live Sessions",
    href: "/dashboard/mentor-live-sessions",
    icon: Video,
  },
  earnings: {
    id: "earnings",
    label: "Earnings",
    href: "/dashboard/earnings",
    icon: BriefcaseBusiness,
  },
  "user-management": {
    id: "user-management",
    label: "User Management",
    href: "/dashboard/user-management",
    icon: Users,
  },
  "mentor-management": {
    id: "mentor-management",
    label: "Mentor Management",
    href: "/dashboard/mentor-management",
    icon: Building2,
  },
  reports: {
    id: "reports",
    label: "Reports",
    href: "/dashboard/reports",
    icon: FileBarChart2,
  },
  "help-center": {
    id: "help-center",
    label: "Help Center",
    href: "/dashboard/help-center",
    icon: CircleHelp,
  },
  "privacy-policies": {
    id: "privacy-policies",
    label: "Privacy & Policies",
    href: "/dashboard/privacy-policies",
    icon: ScrollText,
  },
  "platform-settings": {
    id: "platform-settings",
    label: "Platform Settings",
    href: "/dashboard/platform-settings",
    icon: Settings,
  },
  "security-center": {
    id: "security-center",
    label: "Security Center",
    href: "/dashboard/security-center",
    icon: ShieldCheck,
  },
  "pricing": {
    id: "pricing",
    label: "Pricing",
    href: "/dashboard/pricing",
    icon: Video,
  },
  certifications: {
    id: "certifications",
    label: "Certifications",
    href: "/dashboard/certifications",
    icon: Verified,
  },
  "admin-certifications": {
    id: "admin-certifications",
    label: "Certifications",
    href: "/dashboard/admin-certifications",
    icon: Verified,
  },
  "admin-session-requests": {
    id: "admin-session-requests",
    label: "Session Request",
    href: "/dashboard/admin-session-requests",
    icon: Inbox,
  },
  "admin-payments": {
    id: "admin-payments",
    label: "Payments",
    href: "/dashboard/admin-payments",
    icon: Wallet,
  },
};

const roleMenuKeys: Record<UserRole, DashboardSectionKey[]> = {
  student: ["dashboard", "live-session", "certifications", "bookings", "payments", "help-center", "privacy-policies", "pricing"],
  teacher: ["dashboard", "my-students", "session-requests", "mentor-live-sessions", "earnings", "help-center", "privacy-policies"],
  admin: ["dashboard", "user-management", "mentor-management", "reports", "help-center"],
  superadmin: [
    "dashboard",
    "user-management",
    "mentor-management",
    "admin-certifications",
    "admin-session-requests",
    "admin-payments",
    "reports",
    "help-center",
    "platform-settings",
    "security-center",
  ],
};

export function getDashboardMenuByRole(role: UserRole) {
  return roleMenuKeys[role].map((key) => allMenuItems[key]);
}

export function isRoleAllowedForSection(role: UserRole, section: string) {
  if (section === "live-session-book" || section === "profile" || section === "platform-settings") {
    return true;
  }
  return roleMenuKeys[role].includes(section as DashboardSectionKey);
}

export function getDefaultSectionForRole(role: UserRole) {
  return roleMenuKeys[role][0];
}
