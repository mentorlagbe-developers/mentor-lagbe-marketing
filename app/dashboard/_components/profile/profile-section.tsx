"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useFormik } from "formik";
import Image from "next/image";
import { IdCard, PencilLine } from "lucide-react";
import { ApiError } from "@/lib/api";
import { formatBdPhoneForDisplay, isValidBdPhoneApi } from "@/lib/bd-phone";
import type { UserRole } from "@/lib/mock-auth";
import {
  getCoursesByDepartment,
  getDepartmentsForProfile,
  updateMyBasicProfile,
  updateMyMentorProfile,
  updateMyStudentProfile,
} from "@/lib/profile-api";
import { useProfileStatus } from "@/app/dashboard/_components/profile-status-context";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { ToastCenter, type ToastMessage, type ToastVariant, type ToastAction } from "@/app/components/ui/toast-center";

type DepartmentOption = { id: string; name: string };
type CourseOption = { id: string; name: string };
type MentorCourseMeta = { name: string; departmentId: string; departmentName: string };
type AvailabilityInput = { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean };
const avatarPalette = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-fuchsia-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
] as const;

function isValidBdPhone(value: string) {
  return isValidBdPhoneApi(value);
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback;
  const detailText = error.details
    ?.map((d) => d.message ?? d.field)
    .filter((v): v is string => Boolean(v))
    .join(". ");
  if (detailText) return detailText;
  if (error.code === "INVALID_BD_PHONE_FORMAT") {
    return "Phone must be a valid Bangladesh number (+8801XXXXXXXXX).";
  }
  return error.message || fallback;
}

function summarizeFormikErrors(errors: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const value of Object.values(errors)) {
    if (typeof value === "string" && value.trim()) parts.push(value);
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) parts.push(item);
      }
    }
  }
  return parts.length ? parts.join(" ") : "Please fix the errors below and try again.";
}

/** Formik + type="number" may store a number; always coerce before .trim() or display. */
function formText(value: unknown): string {
  return value == null ? "" : String(value);
}

function mapDepartments(records: Array<Record<string, unknown>>): DepartmentOption[] {
  return records.map((item, idx) => ({
    id: String(item.id ?? item.uuid ?? item._id ?? `dep-${idx}`),
    name: String(item.name ?? item.label ?? item.title ?? "Unnamed Department"),
  }));
}

function mapCourses(records: Array<Record<string, unknown>>): CourseOption[] {
  return records.map((item, idx) => ({
    id: String(item.id ?? item.uuid ?? item._id ?? `course-${idx}`),
    name: String(item.name ?? item.label ?? item.title ?? item.code ?? "Unnamed Course"),
  }));
}

/** Single department for all selected course ids when metadata is known for each. */
function inferExpertiseDepartmentIdFromMeta(
  courseIds: string[],
  meta: Record<string, MentorCourseMeta>
): string | null {
  if (!courseIds.length) return null;
  const deptIds = new Set(
    courseIds.map((id) => meta[id]?.departmentId).filter((d): d is string => Boolean(d && String(d).trim()))
  );
  if (deptIds.size !== 1) return null;
  return [...deptIds][0];
}

function countDistinctExpertiseDepartments(courseIds: string[], meta: Record<string, MentorCourseMeta>): number {
  return new Set(courseIds.map((id) => meta[id]?.departmentId).filter((d): d is string => Boolean(d && String(d).trim())))
    .size;
}

/** Renders API wall time (HH:mm or HH:mm:ss) as 12-hour, e.g. 09:00 → 9:00 AM */
function formatTime12h(time: string): string {
  const trimmed = time.trim();
  const parts = trimmed.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return trimmed.slice(0, 8);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  const minStr = Math.min(59, Math.max(0, m)).toString().padStart(2, "0");
  return `${hour12}:${minStr} ${period}`;
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</h4>
      <div className="mt-3 grid items-start gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function InfoItem({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/20"
        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

export function ProfileSection({ role }: { role: UserRole }) {
  const { profile, refreshProfile } = useProfileStatus();
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [mentorExpertiseBrowseDepartmentId, setMentorExpertiseBrowseDepartmentId] = useState("");
  const [mentorBrowseCourses, setMentorBrowseCourses] = useState<CourseOption[]>([]);
  const [mentorBrowseCoursesLoading, setMentorBrowseCoursesLoading] = useState(false);
  const [mentorCourseMetaById, setMentorCourseMetaById] = useState<Record<string, MentorCourseMeta>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [studentImagePreview, setStudentImagePreview] = useState<string>("");
  const [studentImageError, setStudentImageError] = useState<string | null>(null);
  const [isUploadingStudentImage, setIsUploadingStudentImage] = useState(false);
  const [mentorImagePreview, setMentorImagePreview] = useState<string>("");
  const [mentorImageError, setMentorImageError] = useState<string | null>(null);
  const [isUploadingMentorImage, setIsUploadingMentorImage] = useState(false);
  const studentImageInputRef = useRef<HTMLInputElement | null>(null);
  const mentorImageInputRef = useRef<HTMLInputElement | null>(null);

  function dismissToast(toastId: number) {
    setToasts((current) => current.filter((item) => item.id !== toastId));
  }

  type PushToastOptions = {
    /** `undefined` = default (3s, or no timer if `actions` are set). `null` = never auto-dismiss. */
    durationMs?: number | null;
    actions?: ToastAction[];
  };

  function pushToast(variant: ToastVariant, message: string, options?: PushToastOptions) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const hasActions = Boolean(options?.actions?.length);
    const explicit = options?.durationMs;
    const autoDismissMs =
      explicit === null ? null : explicit === undefined ? (hasActions ? null : 3000) : explicit;

    const actions: ToastAction[] | undefined = options?.actions?.map((a) => ({
      label: a.label,
      variant: a.variant,
      onClick: () => {
        try {
          a.onClick();
        } finally {
          dismissToast(id);
        }
      },
    }));

    setToasts((current) => [...current, { id, variant, message, actions }]);

    if (typeof autoDismissMs === "number" && autoDismissMs > 0) {
      window.setTimeout(() => dismissToast(id), autoDismissMs);
    }
  }

  const studentProfile = profile?.studentProfile;
  const mentorProfile = profile?.mentorProfile;
  const profileRoot = profile as (typeof profile & { address?: string | null; currentEducationStatus?: string | null }) | null;
  const resolvedAddress =
    studentProfile?.address ??
    (profileRoot?.address ?? null);
  const resolvedCurrentEducationStatus =
    studentProfile?.currentEducationStatus ??
    (profileRoot?.currentEducationStatus ?? null);
  const mentorExpertiseCourseIds =
    mentorProfile?.expertiseCourseIds?.length
      ? mentorProfile.expertiseCourseIds
      : profile?.mentorExpertiseCourseIds ?? [];
  const mentorAvailability =
    mentorProfile?.availability?.length
      ? mentorProfile.availability
      : profile?.mentorAvailability ?? [];
  const initials = (profile?.fullName?.trim().charAt(0) || "U").toUpperCase();
  const avatarSeed = profile?.fullName ?? profile?.email ?? "User";
  const avatarIndex = Array.from(avatarSeed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarPalette.length;
  const avatarGradient = avatarPalette[avatarIndex];

  useEffect(() => {
    if (role !== "student" && role !== "teacher") return;
    void getDepartmentsForProfile()
      .then((data) => setDepartments(mapDepartments(data)))
      .catch(() => setDepartments([]));
  }, [role]);

  const studentModalForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: profile?.fullName ?? "",
      phone: formatBdPhoneForDisplay(profile?.phone),
      profilePictureUrl: profile?.profilePictureUrl ?? "",
      gender: profile?.gender ?? "",
      dateOfBirth: profile?.dateOfBirth?.slice(0, 10) ?? "",
      departmentId: studentProfile?.departmentId ?? "",
      universityName: studentProfile?.universityName ?? "",
      studentIdNumber: studentProfile?.studentIdNumber ?? "",
      semester: studentProfile?.semester ?? "",
      currentEducationStatus: resolvedCurrentEducationStatus ?? "",
      address: resolvedAddress ?? "",
      biography: studentProfile?.biography ?? "",
      waNumber: formatBdPhoneForDisplay(studentProfile?.waNumber),
    },
    validate(values) {
      const errors: Partial<Record<keyof typeof values, string>> = {};
      if (!values.fullName.trim()) errors.fullName = "Full name is required.";
      if (values.phone.trim() && !isValidBdPhone(values.phone)) errors.phone = "Phone must be +8801XXXXXXXXX.";
      if (
        values.profilePictureUrl.trim() &&
        !/^https:\/\//.test(values.profilePictureUrl.trim()) &&
        !/^http:\/\//.test(values.profilePictureUrl.trim()) &&
        !/^\/uploads\//.test(values.profilePictureUrl.trim()) &&
        !/^data:image\//.test(values.profilePictureUrl.trim())
      ) {
        errors.profilePictureUrl = "Use a valid image URL or upload an image.";
      }
      if (!values.departmentId) errors.departmentId = "Department is required.";
      if (!values.universityName.trim()) errors.universityName = "University name is required.";
      if (!values.studentIdNumber.trim()) errors.studentIdNumber = "Student ID is required.";
      if (!values.semester.trim()) errors.semester = "Semester is required.";
      if (!values.currentEducationStatus.trim()) errors.currentEducationStatus = "Current education status is required.";
      if (!values.address.trim()) errors.address = "Address is required.";
      if (values.waNumber.trim() && !isValidBdPhone(values.waNumber)) {
        errors.waNumber = "WhatsApp number must be +8801XXXXXXXXX format.";
      }
      return errors;
    },
    async onSubmit(values) {
      try {
        setStatus(null);
        await updateMyBasicProfile({
          fullName: values.fullName.trim(),
          phone: values.phone.trim() || undefined,
          profilePictureUrl: values.profilePictureUrl.trim() || undefined,
          gender: (values.gender || undefined) as "male" | "female" | "other" | "prefer_not_to_say" | undefined,
          dateOfBirth: values.dateOfBirth || undefined,
        });
        await updateMyStudentProfile({
          departmentId: values.departmentId,
          universityName: values.universityName.trim(),
          studentIdNumber: values.studentIdNumber.trim(),
          semester: values.semester.trim(),
          currentEducationStatus: values.currentEducationStatus.trim(),
          address: values.address.trim(),
          biography: values.biography.trim() || undefined,
          waNumber: values.waNumber.trim() || undefined,
        });
        setIsStudentModalOpen(false);
        setStatus(null);
        pushToast("success", "Profile updated successfully.");
        void refreshProfile();
      } catch (error) {
        const message = apiErrorMessage(error, "Profile update failed.");
        setStatus(message);
        pushToast("danger", message);
      }
    },
  });

  useEffect(() => {
    if (!isStudentModalOpen) return;
    setStudentImageError(null);
    setStudentImagePreview(studentModalForm.values.profilePictureUrl || "");
  }, [isStudentModalOpen, studentModalForm.values.profilePictureUrl]);

  async function handleStudentImageSelect(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStudentImageError("Please select a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStudentImageError("Image size should be 2MB or less.");
      return;
    }
    setStudentImageError(null);
    setIsUploadingStudentImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { publicUrl?: string; relativeUrl?: string };
        error?: { message?: string };
      };
      if (!response.ok || !payload?.success || !payload.data?.relativeUrl) {
        throw new Error(payload?.error?.message || "Upload failed.");
      }
      setStudentImagePreview(payload.data.relativeUrl);
      studentModalForm.setFieldValue("profilePictureUrl", payload.data.relativeUrl);
    } catch (error) {
      setStudentImageError(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploadingStudentImage(false);
    }
  }

  async function handleMentorImageSelect(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMentorImageError("Please select a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMentorImageError("Image size should be 2MB or less.");
      return;
    }
    setMentorImageError(null);
    setIsUploadingMentorImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { relativeUrl?: string };
        error?: { message?: string };
      };
      if (!response.ok || !payload?.success || !payload.data?.relativeUrl) {
        throw new Error(payload?.error?.message || "Upload failed.");
      }
      setMentorImagePreview(payload.data.relativeUrl);
      mentorForm.setFieldValue("profilePictureUrl", payload.data.relativeUrl);
    } catch (error) {
      setMentorImageError(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploadingMentorImage(false);
    }
  }

  const mentorForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: profile?.fullName ?? "",
      phone: formatBdPhoneForDisplay(profile?.phone),
      profilePictureUrl: profile?.profilePictureUrl ?? "",
      gender: profile?.gender ?? "",
      dateOfBirth: profile?.dateOfBirth?.slice(0, 10) ?? "",
      biography: mentorProfile?.biography ?? "",
      qualification: mentorProfile?.qualification ?? "",
      experienceYears: formText(mentorProfile?.experienceYears),
      waNumber: formatBdPhoneForDisplay(mentorProfile?.waNumber),
      expertiseCourseIds: mentorExpertiseCourseIds,
      availability:
        mentorAvailability.length
          ? mentorAvailability.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime.slice(0, 5),
              endTime: slot.endTime.slice(0, 5),
              isActive: slot.isActive,
            }))
          : ([{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00", isActive: true }] as AvailabilityInput[]),
    },
    validate(values) {
      const errors: Partial<Record<keyof typeof values, string>> = {};
      if (!values.fullName.trim()) errors.fullName = "Full name is required.";
      if (!values.biography.trim()) errors.biography = "Biography is required.";
      if (!values.qualification.trim()) errors.qualification = "Qualification is required.";
      const experienceYears = formText(values.experienceYears).trim();
      if (!experienceYears) errors.experienceYears = "Experience is required.";
      else if (Number.isNaN(Number(experienceYears)) || Number(experienceYears) < 0) {
        errors.experienceYears = "Enter a valid number of years.";
      }
      if (values.waNumber.trim() && !isValidBdPhone(values.waNumber)) {
        errors.waNumber = "WhatsApp number must be +8801XXXXXXXXX format.";
      }
      if (!values.expertiseCourseIds.length) errors.expertiseCourseIds = "Select at least one course.";
      if (values.expertiseCourseIds.length) {
        const distinct = countDistinctExpertiseDepartments(values.expertiseCourseIds, mentorCourseMetaById);
        if (distinct > 1) {
          errors.expertiseCourseIds =
            "Expertise must be from one department only. Remove courses from other departments, or change department and start over.";
        }
      }
      if (
        !values.availability.length ||
        values.availability.some((slot) => !slot.startTime || !slot.endTime || slot.startTime >= slot.endTime)
      ) {
        errors.availability = "Each availability slot needs valid start and end time.";
      }
      return errors;
    },
    async onSubmit(values) {
      try {
        setStatus(null);
        await updateMyBasicProfile({
          fullName: values.fullName.trim(),
          phone: values.phone.trim() || undefined,
          profilePictureUrl: values.profilePictureUrl.trim() || undefined,
          gender: (values.gender || undefined) as "male" | "female" | "other" | "prefer_not_to_say" | undefined,
          dateOfBirth: values.dateOfBirth || undefined,
        });
        await updateMyMentorProfile({
          biography: values.biography.trim(),
          qualification: values.qualification.trim(),
          experienceYears: Number(formText(values.experienceYears)),
          waNumber: values.waNumber.trim() || undefined,
          expertiseCourseIds: values.expertiseCourseIds,
          availability: values.availability.map((slot) => ({
            dayOfWeek: Number(slot.dayOfWeek),
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: Boolean(slot.isActive),
          })),
        });
        setIsMentorModalOpen(false);
        setStatus(null);
        pushToast("success", "Profile updated successfully.");
        void refreshProfile();
      } catch (error) {
        const message = apiErrorMessage(error, "Profile update failed.");
        setStatus(message);
        pushToast("danger", message);
      }
    },
  });

  const handleMentorModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = await mentorForm.validateForm();
    if (Object.keys(errors).length > 0) {
      const message = summarizeFormikErrors(errors as Record<string, unknown>);
      setStatus(message);
      pushToast("warning", message);
      return;
    }
    await mentorForm.submitForm();
  };

  useEffect(() => {
    if (!isMentorModalOpen) return;
    setStatus(null);
    setMentorImageError(null);
    setMentorImagePreview(mentorForm.values.profilePictureUrl || "");
  }, [isMentorModalOpen, mentorForm.values.profilePictureUrl]);

  const shouldPrefetchMentorCourseMeta =
    role === "teacher" && (isMentorModalOpen || isEditing) && departments.length > 0;

  useEffect(() => {
    if (!shouldPrefetchMentorCourseMeta) return;
    const courseIds = mentorForm.values.expertiseCourseIds;
    if (!courseIds.length) return;
    let cancelled = false;
    void (async () => {
      for (const dep of departments) {
        if (cancelled) return;
        const raw = await getCoursesByDepartment(dep.id).catch(() => [] as Array<Record<string, unknown>>);
        const list = mapCourses(raw);
        if (cancelled) return;
        setMentorCourseMetaById((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const c of list) {
            if (courseIds.includes(c.id) && !next[c.id]) {
              next[c.id] = { name: c.name, departmentId: dep.id, departmentName: dep.name };
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shouldPrefetchMentorCourseMeta, departments, mentorForm.values.expertiseCourseIds]);

  useEffect(() => {
    if (role !== "teacher") return;
    if (!mentorExpertiseBrowseDepartmentId) {
      setMentorBrowseCourses([]);
      setMentorBrowseCoursesLoading(false);
      return;
    }
    let cancelled = false;
    setMentorBrowseCoursesLoading(true);
    void getCoursesByDepartment(mentorExpertiseBrowseDepartmentId)
      .then((records) => {
        if (cancelled) return;
        const list = mapCourses(records);
        setMentorBrowseCourses(list);
        const dep = departments.find((d) => d.id === mentorExpertiseBrowseDepartmentId);
        const departmentName = dep?.name ?? "Department";
        setMentorCourseMetaById((prev) => {
          const next = { ...prev };
          for (const c of list) {
            next[c.id] = {
              name: c.name,
              departmentId: mentorExpertiseBrowseDepartmentId,
              departmentName,
            };
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setMentorBrowseCourses([]);
      })
      .finally(() => {
        if (!cancelled) setMentorBrowseCoursesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, mentorExpertiseBrowseDepartmentId, departments]);

  const mentorExpertiseIdsKey = useMemo(
    () => mentorForm.values.expertiseCourseIds.join("\u0001"),
    [mentorForm.values.expertiseCourseIds]
  );

  /** Keep the department picker aligned with the single department implied by current selections. */
  useEffect(() => {
    if (role !== "teacher") return;
    const ids = mentorExpertiseIdsKey ? mentorExpertiseIdsKey.split("\u0001") : [];
    const inferred = inferExpertiseDepartmentIdFromMeta(ids, mentorCourseMetaById);
    if (!inferred) return;
    setMentorExpertiseBrowseDepartmentId((prev) => (prev === inferred ? prev : inferred));
  }, [role, mentorExpertiseIdsKey, mentorCourseMetaById]);

  const adminForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: profile?.fullName ?? "",
      phone: formatBdPhoneForDisplay(profile?.phone),
      gender: profile?.gender ?? "",
      dateOfBirth: profile?.dateOfBirth?.slice(0, 10) ?? "",
    },
    async onSubmit(values) {
      try {
        setStatus(null);
        await updateMyBasicProfile({
          fullName: values.fullName.trim(),
          phone: values.phone.trim() || undefined,
          gender: (values.gender || undefined) as "male" | "female" | "other" | "prefer_not_to_say" | undefined,
          dateOfBirth: values.dateOfBirth || undefined,
        });
        await refreshProfile();
        pushToast("success", "Profile updated successfully.");
        setIsEditing(false);
      } catch (error) {
        setStatus(apiErrorMessage(error, "Profile update failed."));
      }
    },
  });

  const renderMentorExpertiseBlock = (opts: { compact: boolean; colSpanClass: string }) => {
    const textMain = opts.compact ? "text-[11px]" : "text-sm";
    const hintClass = opts.compact ? "text-[10px] text-slate-500 dark:text-slate-400" : "text-xs text-slate-500 dark:text-slate-400";
    const titleClass = opts.compact ? "font-semibold text-slate-600" : "font-medium";
    const selectClass = opts.compact
      ? "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      : "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
    const courseGridClass = opts.compact
      ? "grid gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700 md:grid-cols-2"
      : "grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:grid-cols-2";
    const labelRowClass = opts.compact ? "inline-flex items-center gap-2 text-xs" : "inline-flex items-center gap-2";

    return (
      <div className={`space-y-2 ${textMain} ${opts.colSpanClass}`}>
        <p className={titleClass}>Expertise Courses</p>
        <p className={hintClass}>
          Pick one department, then choose any number of courses from that department only. To use another department,
          change the department below—you will be asked to clear current selections first so everything stays in one
          department.
        </p>
        <label className="block space-y-1">
          <span className={titleClass}>Department</span>
          <select
            value={mentorExpertiseBrowseDepartmentId}
            onChange={(event) => {
              const next = event.target.value;
              if (mentorForm.values.expertiseCourseIds.length > 0 && next !== mentorExpertiseBrowseDepartmentId) {
                pushToast(
                  "warning",
                  "Switching department clears your selected expertise courses so everything stays in one department. How would you like to proceed?",
                  {
                    actions: [
                      {
                        label: "Cancel",
                        variant: "secondary",
                        onClick: () => {},
                      },
                      {
                        label: "Clear & switch",
                        variant: "primary",
                        onClick: () => {
                          mentorForm.setFieldValue("expertiseCourseIds", []);
                          setMentorExpertiseBrowseDepartmentId(next);
                        },
                      },
                    ],
                  }
                );
                return;
              }
              setMentorExpertiseBrowseDepartmentId(next);
            }}
            className={selectClass}
          >
            <option value="">Choose department…</option>
            {departments.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.name}
              </option>
            ))}
          </select>
        </label>
        {!mentorExpertiseBrowseDepartmentId ? (
          <p className={hintClass}>Choose a department to load its courses.</p>
        ) : mentorBrowseCoursesLoading ? (
          <p className={hintClass}>Loading courses…</p>
        ) : mentorBrowseCourses.length ? (
          <div className={courseGridClass}>
            {mentorBrowseCourses.map((course) => (
              <label key={course.id} className={labelRowClass}>
                <input
                  type="checkbox"
                  checked={mentorForm.values.expertiseCourseIds.includes(course.id)}
                  onChange={(event) => {
                    const current = mentorForm.values.expertiseCourseIds;
                    if (event.target.checked) {
                      const browseId = mentorExpertiseBrowseDepartmentId;
                      const existingDepts = new Set(
                        current
                          .map((id) => mentorCourseMetaById[id]?.departmentId)
                          .filter((d): d is string => Boolean(d && String(d).trim()))
                      );
                      if (
                        browseId &&
                        existingDepts.size === 1 &&
                        [...existingDepts][0] !== browseId
                      ) {
                        pushToast(
                          "warning",
                          "Clear your current selections or switch back to the same department before adding more courses."
                        );
                        return;
                      }
                    }
                    const next = event.target.checked
                      ? [...current, course.id]
                      : current.filter((id) => id !== course.id);
                    mentorForm.setFieldValue("expertiseCourseIds", next);
                  }}
                />
                <span>{course.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className={hintClass}>No courses listed for this department.</p>
        )}
        {mentorForm.values.expertiseCourseIds.length ? (
          <div className="space-y-1">
            <p className={titleClass}>Selected ({mentorForm.values.expertiseCourseIds.length})</p>
            <ul className="flex flex-wrap gap-2">
              {mentorForm.values.expertiseCourseIds.map((id) => {
                const meta = mentorCourseMetaById[id];
                const label = meta ? `${meta.name} — ${meta.departmentName}` : `Course ${id.slice(0, 8)}…`;
                return (
                  <li
                    key={id}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 dark:border-slate-600 dark:bg-slate-800/80"
                  >
                    <span className="truncate">{label}</span>
                    <button
                      type="button"
                      className="shrink-0 rounded-full px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      aria-label={`Remove ${label}`}
                      onClick={() =>
                        mentorForm.setFieldValue(
                          "expertiseCourseIds",
                          mentorForm.values.expertiseCourseIds.filter((cid) => cid !== id)
                        )
                      }
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {typeof mentorForm.errors.expertiseCourseIds === "string" && mentorForm.submitCount > 0 ? (
          <p className="text-xs text-rose-600">{mentorForm.errors.expertiseCourseIds}</p>
        ) : null}
      </div>
    );
  };

  const nonStudentEditForm = useMemo(() => {
    if (role === "teacher") {
      return (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={mentorForm.handleSubmit}>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Full Name</span>
            <input name="fullName" value={mentorForm.values.fullName} onChange={mentorForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Gender</span>
            <select name="gender" value={mentorForm.values.gender} onChange={mentorForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Biography</span>
            <textarea name="biography" rows={4} value={mentorForm.values.biography} onChange={mentorForm.handleChange} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>

          {renderMentorExpertiseBlock({ compact: false, colSpanClass: "md:col-span-2" })}

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Availability Slots</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  mentorForm.setFieldValue("availability", [
                    ...mentorForm.values.availability,
                    { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", isActive: true },
                  ])
                }
              >
                Add Slot
              </Button>
            </div>
            {mentorForm.values.availability.map((slot, index) => (
              <div key={`${index}-${slot.dayOfWeek}-${slot.startTime}`} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                <select
                  value={slot.dayOfWeek}
                  onChange={(event) => {
                    const next = [...mentorForm.values.availability];
                    next[index] = { ...next[index], dayOfWeek: Number(event.target.value) };
                    mentorForm.setFieldValue("availability", next);
                  }}
                  className="h-11 rounded-xl border border-slate-200 px-3"
                >
                  <option value={0}>Sunday</option><option value={1}>Monday</option><option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option><option value={4}>Thursday</option><option value={5}>Friday</option><option value={6}>Saturday</option>
                </select>
                <input type="time" value={slot.startTime} onChange={(event) => {
                  const next = [...mentorForm.values.availability];
                  next[index] = { ...next[index], startTime: event.target.value };
                  mentorForm.setFieldValue("availability", next);
                }} className="h-11 rounded-xl border border-slate-200 px-3" />
                <input type="time" value={slot.endTime} onChange={(event) => {
                  const next = [...mentorForm.values.availability];
                  next[index] = { ...next[index], endTime: event.target.value };
                  mentorForm.setFieldValue("availability", next);
                }} className="h-11 rounded-xl border border-slate-200 px-3" />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={slot.isActive} onChange={(event) => {
                    const next = [...mentorForm.values.availability];
                    next[index] = { ...next[index], isActive: event.target.checked };
                    mentorForm.setFieldValue("availability", next);
                  }} />
                  Active
                </label>
                <Button type="button" variant="secondary" onClick={() => {
                  const next = mentorForm.values.availability.filter((_, idx) => idx !== index);
                  mentorForm.setFieldValue("availability", next.length ? next : [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00", isActive: true }]);
                }}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit">Save Profile</Button>
          </div>
        </form>
      );
    }

    return (
      <form className="grid gap-4 md:grid-cols-2" onSubmit={adminForm.handleSubmit}>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Full Name</span>
          <input name="fullName" value={adminForm.values.fullName} onChange={adminForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Phone</span>
          <input name="phone" value={adminForm.values.phone} onChange={adminForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
        </label>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button type="submit">Save Profile</Button>
        </div>
      </form>
    );
  }, [
    adminForm,
    departments,
    mentorBrowseCourses,
    mentorBrowseCoursesLoading,
    mentorCourseMetaById,
    mentorExpertiseBrowseDepartmentId,
    mentorForm,
    role,
  ]);

  return (
    <>
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile?.profilePictureUrl ? (
              <Image
                src={profile.profilePictureUrl}
                alt={profile?.fullName || "User"}
                width={72}
                height={72}
                unoptimized
                className="h-18 w-18 rounded-2xl border border-slate-200 object-cover"
              />
            ) : (
              <div className={`flex h-18 w-18 items-center justify-center rounded-2xl bg-linear-to-br ${avatarGradient} text-2xl font-bold text-white shadow-lg`}>
                {initials}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{profile?.fullName || "User"}</h3>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <IdCard className="h-4 w-4" />
                {profile?.readableId || "N/A"}
              </p>
            </div>
          </div>
          <Button
            iconLeft={PencilLine}
            onClick={() =>
              role === "student"
                ? setIsStudentModalOpen(true)
                : role === "teacher"
                  ? setIsMentorModalOpen(true)
                  : setIsEditing(true)
            }
          >
            Update Profile
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="Email" value={profile?.email || "N/A"} />
          <InfoItem label="Role" value={role} />
          <InfoItem label="Phone" value={profile?.phone || "N/A"} />
          <InfoItem label="Verification" value={profile?.isEmailVerified ? "Email Verified" : "Pending"} tone={profile?.isEmailVerified ? "success" : "danger"} />
        </div>

        {role === "student" ? (
          <div className="mt-4 space-y-3">
            <InfoSection title="Personal Information">
              <InfoItem label="Address" value={resolvedAddress || "N/A"} />
              <InfoItem label="Readable ID" value={profile?.readableId || "N/A"} />
              <InfoItem label="Gender" value={profile?.gender || "N/A"} />
              <InfoItem label="Current Education Status" value={resolvedCurrentEducationStatus || "N/A"} />
            </InfoSection>
            <InfoSection title="Academic Information">
              <InfoItem label="University" value={studentProfile?.universityName || "N/A"} />
              <InfoItem label="Total Sessions" value={String(studentProfile?.totalSessions ?? 0)} />
              <InfoItem label="Student ID Number" value={studentProfile?.studentIdNumber || "N/A"} />
              <InfoItem label="Semester" value={studentProfile?.semester || "N/A"} />
            </InfoSection>
            <InfoSection title="Contact And Support">
              <InfoItem label="WhatsApp Number" value={studentProfile?.waNumber || "N/A"} />
              <InfoItem label="Biography" value={studentProfile?.biography || "N/A"} />
              <InfoItem label="Profile Active" value={profile?.isActive ? "Yes" : "No"} tone={profile?.isActive ? "success" : "danger"} />
              <InfoItem label="Phone Verified" value={profile?.isPhoneVerified ? "Yes" : "No"} tone={profile?.isPhoneVerified ? "success" : "danger"} />
            </InfoSection>
          </div>
        ) : null}

        {role === "teacher" ? (
          <div className="mt-4 space-y-3">
            <InfoSection title="Personal Information">
              <InfoItem label="Full Name" value={profile?.fullName || "N/A"} />
              <InfoItem label="Readable ID" value={profile?.readableId || "N/A"} />
              <InfoItem label="Gender" value={profile?.gender || "N/A"} />
              <InfoItem label="Date Of Birth" value={profile?.dateOfBirth?.slice(0, 10) || "N/A"} />
            </InfoSection>
            <InfoSection title="Mentor Information">
              <InfoItem label="Qualification" value={mentorProfile?.qualification || "N/A"} />
              <InfoItem label="Experience Years" value={String(mentorProfile?.experienceYears ?? "N/A")} />
              <InfoItem label="Total Sessions Done" value={String((mentorProfile as { totalSessionsDone?: number } | null)?.totalSessionsDone ?? 0)} />
              <InfoItem label="Approval Status" value={(mentorProfile as { isApproved?: boolean } | null)?.isApproved ? "Approved" : "Pending"} tone={(mentorProfile as { isApproved?: boolean } | null)?.isApproved ? "success" : "danger"} />
            </InfoSection>
            <InfoSection title="Contact And Support">
              <InfoItem label="WhatsApp Number" value={mentorProfile?.waNumber || "N/A"} />
              <InfoItem label="Biography" value={mentorProfile?.biography || "N/A"} />
              <InfoItem label="Phone Verified" value={profile?.isPhoneVerified ? "Yes" : "No"} tone={profile?.isPhoneVerified ? "success" : "danger"} />
              <InfoItem label="Email Verified" value={profile?.isEmailVerified ? "Yes" : "No"} tone={profile?.isEmailVerified ? "success" : "danger"} />
            </InfoSection>
            <InfoSection title="Availability And Expertise">
              <InfoItem label="Expertise Courses" value={mentorExpertiseCourseIds.length ? String(mentorExpertiseCourseIds.length) : "N/A"} />
              <InfoItem label="Active Slots" value={String(mentorAvailability.filter((slot) => slot.isActive).length)} />
              <InfoItem
                label="Availability"
                value={
                  mentorAvailability.length
                    ? mentorAvailability
                        .map((slot) => {
                          const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][slot.dayOfWeek] || "Day";
                          return `${day} ${formatTime12h(slot.startTime)}–${formatTime12h(slot.endTime)}`;
                        })
                        .join(" | ")
                    : "N/A"
                }
              />
            </InfoSection>
          </div>
        ) : null}
      </section>

      {role !== "student" && isEditing ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h4 className="text-lg font-semibold">Edit Profile Information</h4>
            <p className="text-sm text-slate-500">Keep your profile details up to date.</p>
          </div>
          {nonStudentEditForm}
          {status ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{status}</p> : null}
        </section>
      ) : null}

      <Modal
        open={role === "student" && isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        className="h-auto min-h-[520px] max-w-2xl rounded-2xl"
      >
        <div className="w-full">
          <div className="border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-base font-semibold text-slate-900">Update Profile Information</h4>
            <p className="mt-0.5 text-[11px] text-slate-500">Update your editable profile details.</p>
          </div>
          <form className="grid items-start gap-2.5 p-5 md:grid-cols-3" onSubmit={studentModalForm.handleSubmit}>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">Full Name</span><input name="fullName" value={studentModalForm.values.fullName} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">Phone</span><input name="phone" value={studentModalForm.values.phone} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">Date Of Birth</span><input type="date" name="dateOfBirth" value={studentModalForm.values.dateOfBirth} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">Gender</span><select name="gender" value={studentModalForm.values.gender} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">Department</span><select name="departmentId" value={studentModalForm.values.departmentId} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs"><option value="">Select department</option>{departments.map((dep) => <option key={dep.id} value={dep.id}>{dep.name}</option>)}</select></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">University Name</span><input name="universityName" value={studentModalForm.values.universityName} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">Student ID Number</span><input name="studentIdNumber" value={studentModalForm.values.studentIdNumber} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">Semester</span><input name="semester" value={studentModalForm.values.semester} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">Education Status</span><input name="currentEducationStatus" value={studentModalForm.values.currentEducationStatus} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <label className="space-y-1 text-[11px] md:col-span-2"><span className="font-semibold text-slate-600">Address</span><input name="address" value={studentModalForm.values.address} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <label className="space-y-1 text-[11px]"><span className="font-semibold text-slate-600">WhatsApp Number</span><input name="waNumber" value={studentModalForm.values.waNumber} onChange={studentModalForm.handleChange} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs" /></label>
            <div className="space-y-1 text-[11px] md:col-span-3">
              <span className="font-semibold text-slate-600">Profile Image</span>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {studentImagePreview ? (
                    <Image src={studentImagePreview} alt="Selected profile" width={48} height={48} unoptimized className="h-12 w-12 object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">No Image</div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={studentImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void handleStudentImageSelect(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={() => studentImageInputRef.current?.click()}>
                    {isUploadingStudentImage ? "Uploading..." : "Choose Image"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isUploadingStudentImage}
                    onClick={() => {
                      setStudentImagePreview("");
                      studentModalForm.setFieldValue("profilePictureUrl", "");
                      setStudentImageError(null);
                    }}
                  >
                    Remove
                  </Button>
                  <span className="text-[10px] text-slate-500">PNG/JPG/WebP, max 2MB</span>
                </div>
              </div>
              {studentImageError ? <p className="text-[11px] text-rose-600">{studentImageError}</p> : null}
            </div>
            <label className="space-y-1 text-[11px] md:col-span-3"><span className="font-semibold text-slate-600">Biography</span><textarea rows={3} name="biography" value={studentModalForm.values.biography} onChange={studentModalForm.handleChange} className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" /></label>
            <div className="md:col-span-3 mt-0.5 flex justify-end gap-2 border-t border-slate-200 pt-2.5">
              <Button type="button" variant="secondary" onClick={() => setIsStudentModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
          {status ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{status}</p> : null}
        </div>
      </Modal>

      <Modal
        open={role === "teacher" && isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        className="h-auto max-h-[92vh] max-w-3xl rounded-2xl"
      >
        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden dark:border-slate-700">
          <div className="shrink-0 border-b border-slate-200 px-5 py-3 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Update Mentor Profile</h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update your mentor profile details.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="origin-top scale-[0.97] px-4 py-1 sm:scale-100 sm:px-5 sm:py-2">
              <form
                className="grid items-start gap-3.5 p-4 text-[15px] leading-snug sm:p-5 md:grid-cols-3 md:text-base md:leading-normal"
                onSubmit={(event) => void handleMentorModalSubmit(event)}
              >
                {mentorForm.submitCount > 0 && Object.keys(mentorForm.errors).length > 0 ? (
                  <div className="md:col-span-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                    {summarizeFormikErrors(mentorForm.errors as Record<string, unknown>)}
                  </div>
                ) : null}
                <label className="space-y-1.5 text-sm md:col-span-1 md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Full Name</span>
                  <input
                    name="fullName"
                    value={mentorForm.values.fullName}
                    onChange={mentorForm.handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1.5 text-sm md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Phone</span>
                  <input
                    name="phone"
                    value={mentorForm.values.phone}
                    onChange={mentorForm.handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1.5 text-sm md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Date Of Birth</span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={mentorForm.values.dateOfBirth}
                    onChange={mentorForm.handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1.5 text-sm md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Gender</span>
                  <select
                    name="gender"
                    value={mentorForm.values.gender}
                    onChange={mentorForm.handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-sm md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Qualification</span>
                  <input
                    name="qualification"
                    value={mentorForm.values.qualification}
                    onChange={mentorForm.handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1.5 text-sm md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Experience Years</span>
                  <input
                    name="experienceYears"
                    type="number"
                    min={0}
                    value={formText(mentorForm.values.experienceYears)}
                    onChange={(e) => mentorForm.setFieldValue("experienceYears", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1.5 text-sm md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">WhatsApp Number</span>
                  <input
                    name="waNumber"
                    value={mentorForm.values.waNumber}
                    onChange={mentorForm.handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <div className="space-y-1.5 text-sm md:col-span-2 md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Profile Image</span>
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600">
                      {mentorImagePreview ? (
                        <Image src={mentorImagePreview} alt="Selected profile" width={56} height={56} unoptimized className="h-14 w-14 object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">No Image</div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={mentorImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          void handleMentorImageSelect(event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                      <Button type="button" variant="secondary" onClick={() => mentorImageInputRef.current?.click()}>
                        {isUploadingMentorImage ? "Uploading..." : "Choose Image"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isUploadingMentorImage}
                        onClick={() => {
                          setMentorImagePreview("");
                          mentorForm.setFieldValue("profilePictureUrl", "");
                          setMentorImageError(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  {mentorImageError ? <p className="text-sm text-rose-600">{mentorImageError}</p> : null}
                </div>
                <label className="space-y-1.5 text-sm md:col-span-3 md:text-[15px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Biography</span>
                  <textarea
                    rows={4}
                    name="biography"
                    value={mentorForm.values.biography}
                    onChange={mentorForm.handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>

                {renderMentorExpertiseBlock({ compact: false, colSpanClass: "md:col-span-3" })}

                <div className="space-y-2.5 text-sm md:col-span-3 md:text-[15px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Availability Slots</span>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        mentorForm.setFieldValue("availability", [
                          ...mentorForm.values.availability,
                          { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", isActive: true },
                        ])
                      }
                    >
                      Add Slot
                    </Button>
                  </div>
                  {typeof mentorForm.errors.availability === "string" && mentorForm.submitCount > 0 ? (
                    <p className="text-sm text-rose-600 dark:text-rose-400">{mentorForm.errors.availability}</p>
                  ) : null}
                  {mentorForm.values.availability.map((slot, index) => (
                    <div
                      key={`${index}-${slot.dayOfWeek}-${slot.startTime}`}
                      className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700 md:grid-cols-[1fr_1fr_1fr_auto_auto]"
                    >
                      <select
                        value={slot.dayOfWeek}
                        onChange={(event) => {
                          const next = [...mentorForm.values.availability];
                          next[index] = { ...next[index], dayOfWeek: Number(event.target.value) };
                          mentorForm.setFieldValue("availability", next);
                        }}
                        className="h-10 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(event) => {
                          const next = [...mentorForm.values.availability];
                          next[index] = { ...next[index], startTime: event.target.value };
                          mentorForm.setFieldValue("availability", next);
                        }}
                        className="h-10 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(event) => {
                          const next = [...mentorForm.values.availability];
                          next[index] = { ...next[index], endTime: event.target.value };
                          mentorForm.setFieldValue("availability", next);
                        }}
                        className="h-10 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={slot.isActive}
                          onChange={(event) => {
                            const next = [...mentorForm.values.availability];
                            next[index] = { ...next[index], isActive: event.target.checked };
                            mentorForm.setFieldValue("availability", next);
                          }}
                        />
                        Active
                      </label>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const next = mentorForm.values.availability.filter((_, idx) => idx !== index);
                          mentorForm.setFieldValue(
                            "availability",
                            next.length ? next : [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00", isActive: true }]
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="md:col-span-3 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                  {status ? <p className="text-sm text-rose-600 dark:text-rose-400">{status}</p> : null}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setIsMentorModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mentorForm.isSubmitting}>
                      {mentorForm.isSubmitting ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Modal>
    </div>
    <ToastCenter toasts={toasts} />
    </>
  );
}
