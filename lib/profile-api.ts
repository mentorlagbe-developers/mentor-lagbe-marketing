"use client";

import { apiFetch } from "@/lib/api";
import { formatBdPhoneForApi } from "@/lib/bd-phone";

export type UserRoleApi = "student" | "mentor" | "admin" | "super_admin";

export type MeProfile = {
  id: string;
  readableId?: string | null;
  role: UserRoleApi;
  email: string;
  fullName: string;
  phone?: string | null;
  profilePictureUrl?: string | null;
  address?: string | null;
  currentEducationStatus?: string | null;
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
    currentEducationStatus?: string | null;
    address?: string | null;
    biography?: string | null;
    waNumber?: string | null;
    totalSessions?: number | null;
    freeTrialUsed?: boolean | null;
    freeTrialSessionId?: string | null;
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
    /** Set once; only super admin can change via admin tools. */
    expertiseDepartmentId?: string | null;
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
  mentorExpertiseCourseIds?: string[] | null;
  mentorAvailability?: Array<{
    id?: string;
    mentorId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
    createdAt?: string;
  }> | null;
  adminProfile?: Record<string, unknown> | null;
};

export type DepartmentOption = { id: string; name: string };

export async function getMyProfile() {
  return apiFetch<MeProfile>("/users/me", { auth: true });
}

export async function updateMyBasicProfile(payload: {
  fullName?: string;
  phone?: string;
  profilePictureUrl?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: string;
}) {
  const body = { ...payload };
  if (payload.phone !== undefined) {
    const phone = formatBdPhoneForApi(payload.phone);
    if (phone) body.phone = phone;
    else delete body.phone;
  }
  return apiFetch<MeProfile>("/users/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function updateMyStudentProfile(payload: {
  departmentId?: string;
  universityName?: string;
  studentIdNumber?: string;
  semester?: string;
  currentEducationStatus?: string;
  address?: string;
  biography?: string;
  waNumber?: string;
  phone?: string;
}) {
  const body = { ...payload };
  if (payload.phone !== undefined) {
    const phone = formatBdPhoneForApi(payload.phone);
    if (phone) body.phone = phone;
    else delete body.phone;
  }
  if (payload.waNumber !== undefined) {
    const wa = formatBdPhoneForApi(payload.waNumber);
    if (wa) body.waNumber = wa;
    else delete body.waNumber;
  }
  return apiFetch<Record<string, unknown>>("/users/me/student-profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

function wallTimeToHms(value: string) {
  const t = value.trim();
  if (!t) return t;
  const head = t.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(head)) return `${head}:00`;
  return t.length >= 8 ? t.slice(0, 8) : t;
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
  /** Only keys the mentor-profile PATCH is expected to accept (avoids strict schema / unknown-field validation). */
  const body: Record<string, unknown> = {};
  if (payload.biography !== undefined) body.biography = payload.biography;
  if (payload.qualification !== undefined) body.qualification = payload.qualification;
  if (payload.experienceYears !== undefined) {
    const y = Math.trunc(Number(payload.experienceYears));
    if (!Number.isNaN(y)) body.experienceYears = y;
  }
  if (payload.waNumber !== undefined) {
    const wa = formatBdPhoneForApi(payload.waNumber);
    if (wa) body.waNumber = wa;
  }
  if (payload.expertiseCourseIds !== undefined) body.expertiseCourseIds = payload.expertiseCourseIds;
  if (payload.availability !== undefined) {
    body.availability = payload.availability.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: wallTimeToHms(slot.startTime),
      endTime: wallTimeToHms(slot.endTime),
      isActive: Boolean(slot.isActive),
    }));
  }
  return apiFetch<Record<string, unknown>>("/users/me/mentor-profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
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
  return apiFetch<Record<string, unknown>>("/admin/mentors", {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      password: payload.temporaryPassword,
    }),
  });
}
