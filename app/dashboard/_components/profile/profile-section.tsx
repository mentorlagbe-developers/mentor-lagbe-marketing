"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import {
  BadgeCheck,
  CalendarDays,
  GraduationCap,
  IdCard,
  Mail,
  PencilLine,
  Phone,
  Shield,
  UserCircle2,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import type { UserRole } from "@/lib/mock-auth";
import {
  getDepartmentsForProfile,
  updateMyBasicProfile,
  getCoursesByDepartment,
  updateMyMentorProfile,
  updateMyStudentProfile,
} from "@/lib/profile-api";
import { useProfileStatus } from "@/app/dashboard/_components/profile-status-context";
import { Button } from "@/app/components/ui/button";

type DepartmentOption = { id: string; name: string };
type CourseOption = { id: string; name: string };
type AvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

function isValidBdPhone(value: string) {
  return /^\+8801[3-9]\d{8}$/.test(value.trim());
}

function mapDepartments(records: Array<Record<string, unknown>>): DepartmentOption[] {
  return records.map((item, idx) => {
    const id = String(item.id ?? item.uuid ?? item._id ?? `dep-${idx}`);
    const name = String(item.name ?? item.label ?? item.title ?? "Unnamed Department");
    return { id, name };
  });
}

function mapCourses(records: Array<Record<string, unknown>>): CourseOption[] {
  return records.map((item, idx) => {
    const id = String(item.id ?? item.uuid ?? item._id ?? `course-${idx}`);
    const name = String(item.name ?? item.label ?? item.title ?? item.code ?? "Unnamed Course");
    return { id, name };
  });
}

export function ProfileSection({ role }: { role: UserRole }) {
  const { profile, refreshProfile } = useProfileStatus();
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [mentorCourses, setMentorCourses] = useState<CourseOption[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (role !== "student") return;
    void getDepartmentsForProfile()
      .then((data) => setDepartments(mapDepartments(data)))
      .catch(() => setDepartments([]));
  }, [role]);

  useEffect(() => {
    if (role !== "teacher") return;
    let active = true;
    void getDepartmentsForProfile()
      .then(async (data) => {
        const deps = mapDepartments(data);
        const courseGroups = await Promise.all(
          deps.map((dep) => getCoursesByDepartment(dep.id).catch(() => [] as Array<Record<string, unknown>>))
        );
        if (!active) return;
        const flattened = courseGroups.flatMap((group) => mapCourses(group));
        const unique = Array.from(new Map(flattened.map((item) => [item.id, item])).values());
        setMentorCourses(unique);
      })
      .catch(() => {
        if (!active) return;
        setMentorCourses([]);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const studentProfile = profile?.studentProfile;
  const mentorProfile = profile?.mentorProfile;

  const studentForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      departmentId: studentProfile?.departmentId ?? "",
      universityName: studentProfile?.universityName ?? "",
      studentIdNumber: studentProfile?.studentIdNumber ?? "",
      semester: studentProfile?.semester ?? "",
      biography: studentProfile?.biography ?? "",
    },
    validate(values) {
      const errors: Partial<Record<keyof typeof values, string>> = {};
      if (!values.departmentId) errors.departmentId = "Department is required.";
      if (!values.universityName.trim()) errors.universityName = "University name is required.";
      if (!values.studentIdNumber.trim()) errors.studentIdNumber = "Student ID is required.";
      if (!values.semester.trim()) errors.semester = "Semester is required.";
      return errors;
    },
    async onSubmit(values) {
      try {
        setStatus(null);
        await updateMyStudentProfile({
          departmentId: values.departmentId,
          universityName: values.universityName.trim(),
          studentIdNumber: values.studentIdNumber.trim(),
          semester: values.semester.trim(),
          biography: values.biography.trim() || undefined,
        });
        await refreshProfile();
        setStatus("Profile updated successfully.");
        setIsEditing(false);
      } catch (error) {
        setStatus(error instanceof ApiError ? error.message : "Profile update failed.");
      }
    },
  });

  const mentorForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: profile?.fullName ?? "",
      profilePictureUrl: profile?.profilePictureUrl ?? "",
      gender: profile?.gender ?? "",
      dateOfBirth: profile?.dateOfBirth?.slice(0, 10) ?? "",
      biography: mentorProfile?.biography ?? "",
      qualification: mentorProfile?.qualification ?? "",
      experienceYears:
        typeof mentorProfile?.experienceYears === "number" ? String(mentorProfile.experienceYears) : "",
      waNumber: mentorProfile?.waNumber ?? "",
      expertiseCourseIds: mentorProfile?.expertiseCourseIds ?? [],
      availability:
        mentorProfile?.availability && mentorProfile.availability.length > 0
          ? mentorProfile.availability.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isActive: slot.isActive,
            }))
          : ([
              {
                dayOfWeek: 1,
                startTime: "09:00",
                endTime: "12:00",
                isActive: true,
              },
            ] as AvailabilityInput[]),
    },
    validate(values) {
      const errors: Partial<Record<keyof typeof values, string>> = {};
      if (!values.fullName.trim()) errors.fullName = "Full name is required.";
      if (!values.biography.trim()) errors.biography = "Biography is required.";
      if (!values.qualification.trim()) errors.qualification = "Qualification is required.";
      if (!values.experienceYears.trim()) errors.experienceYears = "Experience is required.";
      else if (!/^\d+$/.test(values.experienceYears) || Number(values.experienceYears) > 80) {
        errors.experienceYears = "Experience must be a number between 0 and 80.";
      }
      if (values.waNumber.trim() && !isValidBdPhone(values.waNumber)) {
        errors.waNumber = "WhatsApp number must be +8801XXXXXXXXX format.";
      }
      if (values.profilePictureUrl.trim() && !/^https:\/\//.test(values.profilePictureUrl.trim())) {
        errors.profilePictureUrl = "Profile image URL must start with https://";
      }
      if (!values.expertiseCourseIds.length) {
        errors.expertiseCourseIds = "Select at least one expertise course.";
      }
      if (!values.availability.length) {
        errors.availability = "Add at least one availability slot.";
      } else if (
        values.availability.some(
          (slot) => !slot.startTime || !slot.endTime || slot.startTime >= slot.endTime
        )
      ) {
        errors.availability = "Each availability slot must have valid start/end time.";
      }
      return errors;
    },
    async onSubmit(values) {
      try {
        setStatus(null);
        await updateMyBasicProfile({
          fullName: values.fullName.trim(),
          gender: (values.gender || undefined) as "male" | "female" | "other" | "prefer_not_to_say" | undefined,
          dateOfBirth: values.dateOfBirth || undefined,
        });
        await updateMyMentorProfile({
          biography: values.biography.trim(),
          qualification: values.qualification.trim(),
          experienceYears: Number(values.experienceYears),
          waNumber: values.waNumber.trim() || undefined,
          expertiseCourseIds: values.expertiseCourseIds,
          availability: values.availability.map((slot) => ({
            dayOfWeek: Number(slot.dayOfWeek),
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: Boolean(slot.isActive),
          })),
        });
        await refreshProfile();
        setStatus("Profile updated successfully.");
        setIsEditing(false);
      } catch (error) {
        setStatus(error instanceof ApiError ? error.message : "Profile update failed.");
      }
    },
  });

  const adminForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: profile?.fullName ?? "",
      phone: profile?.phone ?? "",
      gender: profile?.gender ?? "",
      dateOfBirth: profile?.dateOfBirth?.slice(0, 10) ?? "",
    },
    validate(values) {
      const errors: Partial<Record<keyof typeof values, string>> = {};
      if (!values.fullName.trim()) errors.fullName = "Full name is required.";
      if (values.phone.trim() && !isValidBdPhone(values.phone)) errors.phone = "Phone must be +8801XXXXXXXXX.";
      return errors;
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
        setStatus("Profile updated successfully.");
        setIsEditing(false);
      } catch (error) {
        setStatus(error instanceof ApiError ? error.message : "Profile update failed.");
      }
    },
  });

  const formBlock = useMemo(() => {
    if (role === "student") {
      return (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={studentForm.handleSubmit}>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Department</span>
            <select
              name="departmentId"
              value={studentForm.values.departmentId}
              onChange={studentForm.handleChange}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            >
              <option value="">Select department</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
            {studentForm.errors.departmentId ? <p className="text-xs text-rose-500">{studentForm.errors.departmentId}</p> : null}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">University Name</span>
            <input name="universityName" value={studentForm.values.universityName} onChange={studentForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
            {studentForm.errors.universityName ? <p className="text-xs text-rose-500">{studentForm.errors.universityName}</p> : null}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Student ID</span>
            <input name="studentIdNumber" value={studentForm.values.studentIdNumber} onChange={studentForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
            {studentForm.errors.studentIdNumber ? <p className="text-xs text-rose-500">{studentForm.errors.studentIdNumber}</p> : null}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Semester</span>
            <input name="semester" value={studentForm.values.semester} onChange={studentForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
            {studentForm.errors.semester ? <p className="text-xs text-rose-500">{studentForm.errors.semester}</p> : null}
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Biography (optional)</span>
            <textarea name="biography" rows={4} value={studentForm.values.biography} onChange={studentForm.handleChange} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Profile</Button>
          </div>
        </form>
      );
    }

    if (role === "teacher") {
      return (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={mentorForm.handleSubmit}>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Full Name</span>
            <input name="fullName" value={mentorForm.values.fullName} onChange={mentorForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
            {mentorForm.errors.fullName ? <p className="text-xs text-rose-500">{mentorForm.errors.fullName}</p> : null}
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
          <label className="space-y-1 text-sm">
            <span className="font-medium">Date of Birth</span>
            <input type="date" name="dateOfBirth" value={mentorForm.values.dateOfBirth} onChange={mentorForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Profile Image URL (optional)</span>
            <input name="profilePictureUrl" placeholder="https://..." value={mentorForm.values.profilePictureUrl} onChange={mentorForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
            {mentorForm.errors.profilePictureUrl ? <p className="text-xs text-rose-500">{mentorForm.errors.profilePictureUrl}</p> : null}
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Biography</span>
            <textarea name="biography" rows={4} value={mentorForm.values.biography} onChange={mentorForm.handleChange} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            {mentorForm.errors.biography ? <p className="text-xs text-rose-500">{mentorForm.errors.biography}</p> : null}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Qualification</span>
            <input name="qualification" value={mentorForm.values.qualification} onChange={mentorForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
            {mentorForm.errors.qualification ? <p className="text-xs text-rose-500">{mentorForm.errors.qualification}</p> : null}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Experience Years</span>
            <input name="experienceYears" value={mentorForm.values.experienceYears} onChange={mentorForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
            {mentorForm.errors.experienceYears ? <p className="text-xs text-rose-500">{mentorForm.errors.experienceYears}</p> : null}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">WhatsApp Number</span>
            <input name="waNumber" placeholder="+8801XXXXXXXXX" value={mentorForm.values.waNumber} onChange={mentorForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
            {mentorForm.errors.waNumber ? <p className="text-xs text-rose-500">{mentorForm.errors.waNumber}</p> : null}
          </label>
          <div className="space-y-2 text-sm md:col-span-2">
            <p className="font-medium">Expertise Courses (multiple)</p>
            <div className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
              {mentorCourses.map((course) => (
                <label key={course.id} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={mentorForm.values.expertiseCourseIds.includes(course.id)}
                    onChange={(event) => {
                      const current = mentorForm.values.expertiseCourseIds;
                      const next = event.target.checked
                        ? [...current, course.id]
                        : current.filter((id) => id !== course.id);
                      mentorForm.setFieldValue("expertiseCourseIds", next);
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>{course.name}</span>
                </label>
              ))}
            </div>
            {mentorForm.errors.expertiseCourseIds ? <p className="text-xs text-rose-500">{mentorForm.errors.expertiseCourseIds}</p> : null}
          </div>
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Availability (multiple day/time slots)</p>
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
            <div className="space-y-2">
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
                    className="h-11 rounded-xl border border-slate-200 px-3"
                  />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(event) => {
                      const next = [...mentorForm.values.availability];
                      next[index] = { ...next[index], endTime: event.target.value };
                      mentorForm.setFieldValue("availability", next);
                    }}
                    className="h-11 rounded-xl border border-slate-200 px-3"
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
                      className="h-4 w-4 rounded border-slate-300"
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
                        next.length
                          ? next
                          : [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00", isActive: true }]
                      );
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            {typeof mentorForm.errors.availability === "string" ? (
              <p className="text-xs text-rose-500">{mentorForm.errors.availability}</p>
            ) : null}
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
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
        <label className="space-y-1 text-sm">
          <span className="font-medium">Gender</span>
          <select name="gender" value={adminForm.values.gender} onChange={adminForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Date of Birth</span>
          <input type="date" name="dateOfBirth" value={adminForm.values.dateOfBirth} onChange={adminForm.handleChange} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
        </label>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button type="submit">Save Profile</Button>
        </div>
      </form>
    );
  }, [adminForm, departments, mentorCourses, mentorForm, role, studentForm]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-linear-to-br from-sky-100 to-blue-200 text-brand-primary">
              <UserCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {profile?.fullName || "User"}
              </h3>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <IdCard className="h-4 w-4" />
                {profile?.readableId || "N/A"}
              </p>
            </div>
          </div>
          <Button iconLeft={PencilLine} onClick={() => setIsEditing(true)}>
            Update Profile
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              Email
            </p>
            <p className="mt-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{profile?.email || "N/A"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              Role
            </p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-800 dark:text-slate-100">{role}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              Phone
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{profile?.phone || "N/A"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
              {profile?.isEmailVerified ? "Email Verified" : "Pending Verification"}
            </p>
          </div>
        </div>

        {role === "student" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="inline-flex items-center gap-1 text-xs text-slate-500"><GraduationCap className="h-3.5 w-3.5" /> University</p>
              <p className="mt-1 text-sm font-medium">{studentProfile?.universityName || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500">Student ID</p>
              <p className="mt-1 text-sm font-medium">{studentProfile?.studentIdNumber || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="inline-flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> Semester</p>
              <p className="mt-1 text-sm font-medium">{studentProfile?.semester || "N/A"}</p>
            </div>
          </div>
        ) : null}

        {role === "teacher" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500">Qualification</p>
              <p className="mt-1 text-sm font-medium">{mentorProfile?.qualification || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500">Experience</p>
              <p className="mt-1 text-sm font-medium">
                {typeof mentorProfile?.experienceYears === "number"
                  ? `${mentorProfile.experienceYears} years`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:col-span-2">
              <p className="text-xs text-slate-500">Biography</p>
              <p className="mt-1 text-sm font-medium">{mentorProfile?.biography || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:col-span-2">
              <p className="text-xs text-slate-500">WhatsApp</p>
              <p className="mt-1 text-sm font-medium">{mentorProfile?.waNumber || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:col-span-2">
              <p className="text-xs text-slate-500">Expertise Courses</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(mentorProfile?.expertiseCourseIds ?? []).length ? (
                  (mentorProfile?.expertiseCourseIds ?? []).map((courseId) => {
                    const course = mentorCourses.find((item) => item.id === courseId);
                    return (
                      <span key={courseId} className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                        {course?.name || courseId}
                      </span>
                    );
                  })
                ) : (
                  <p className="text-sm font-medium">N/A</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:col-span-2">
              <p className="text-xs text-slate-500">Availability</p>
              <div className="mt-2 space-y-1">
                {(mentorProfile?.availability ?? []).length ? (
                  (mentorProfile?.availability ?? []).map((slot, idx) => (
                    <p key={`${slot.dayOfWeek}-${slot.startTime}-${idx}`} className="text-sm font-medium">
                      Day {slot.dayOfWeek}: {slot.startTime} - {slot.endTime} {slot.isActive ? "(Active)" : "(Inactive)"}
                    </p>
                  ))
                ) : (
                  <p className="text-sm font-medium">N/A</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {isEditing ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h4 className="text-lg font-semibold">Edit Profile Information</h4>
            <p className="text-sm text-slate-500">Keep your profile details up to date.</p>
          </div>
          {formBlock}
          {status ? <p className="mt-3 text-sm text-brand-primary">{status}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
