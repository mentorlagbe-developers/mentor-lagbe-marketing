"use client";

import { apiFetch } from "@/lib/api";

export type UserRoleApi = "student" | "mentor" | "admin" | "super_admin";

export type MeProfile = {
  id: string;
  readableId?: string | null;
  role: UserRoleApi;
  email: string;
  fullName: string;
  phone?: string | null;
  profilePictureUrl?: string | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  dateOfBirth?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  studentProfile?: {
    id: string;
    userId: string;
    departmentId?: string | null;
    universityName?: string | null;
    studentIdNumber?: string | null;
    semester?: string | null;
    biography?: string | null;
    waNumber?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  mentorProfile?: {
    id: string;
    userId: string;
    biography?: string | null;
    qualification?: string | null;
    experienceYears?: number | null;
    waNumber?: string | null;
    expertiseCourseIds?: string[] | null;
    availability?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isActive: boolean;
    }> | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  adminProfile?: Record<string, unknown> | null;
};

export type DepartmentOption = { id: string; name: string };

export async function getMyProfile() {
  return apiFetch<MeProfile>("/users/me", { auth: true });
}

export async function updateMyBasicProfile(payload: {
  fullName?: string;
  phone?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: string;
}) {
  return apiFetch<MeProfile>("/users/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateMyStudentProfile(payload: {
  departmentId?: string;
  universityName?: string;
  studentIdNumber?: string;
  semester?: string;
  biography?: string;
  waNumber?: string;
}) {
  return apiFetch<Record<string, unknown>>("/users/me/student-profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateMyMentorProfile(payload: {
  biography?: string;
  qualification?: string;
  experienceYears?: number;
  waNumber?: string;
  expertiseCourseIds?: string[];
  availability?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
}) {
  return apiFetch<Record<string, unknown>>("/users/me/mentor-profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function getDepartmentsForProfile() {
  return apiFetch<Array<Record<string, unknown>>>("/departments", { auth: true });
}

export async function getCoursesByDepartment(departmentId: string) {
  return apiFetch<Array<Record<string, unknown>>>(
    `/courses?departmentId=${encodeURIComponent(departmentId)}`,
    { auth: true }
  );
}

export async function createMentorByAdmin(payload: {
  email: string;
  phone: string;
  temporaryPassword: string;
}) {
  try {
    return await apiFetch<Record<string, unknown>>("/admin/users", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        role: "mentor",
        email: payload.email,
        phone: payload.phone,
        temporaryPassword: payload.temporaryPassword,
      }),
    });
  } catch {
    return apiFetch<Record<string, unknown>>("/admin/users", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        role: "mentor",
        email: payload.email,
        phone: payload.phone,
        password: payload.temporaryPassword,
      }),
    });
  }
}
