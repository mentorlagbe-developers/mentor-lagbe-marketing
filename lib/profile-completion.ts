"use client";

import type { MeProfile } from "@/lib/profile-api";
import type { UserRole } from "@/lib/mock-auth";

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

export function isProfileCompleteForRole(profile: MeProfile | null, role: UserRole) {
  if (!profile) return false;

  if (role === "student") {
    const student = profile.studentProfile;
    return Boolean(
      student &&
        hasText(student.departmentId ?? null) &&
        hasText(student.universityName ?? null) &&
        hasText(student.studentIdNumber ?? null) &&
        hasText(student.semester ?? null)
    );
  }

  if (role === "teacher") {
    const mentor = profile.mentorProfile;
    return Boolean(
      mentor &&
        hasText(mentor.biography ?? null) &&
        hasText(mentor.qualification ?? null) &&
        typeof mentor.experienceYears === "number"
    );
  }

  return true;
}
