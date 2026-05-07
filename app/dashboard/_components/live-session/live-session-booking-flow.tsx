"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { apiFetch } from "@/lib/api";

const hourOptions = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minuteOptions = [0, 15, 30, 45];
const PRICE_PER_30_MIN = 100;
const TOPIC_OTHER_VALUE = "__other__";

type Meridiem = "AM" | "PM";
type SelectOption = { id: string; label: string };

type BookingFormState = {
  departmentId: string;
  courseId: string;
  topicId: string;
  customTopic: string;
  description: string;
  sessionDate: string;
  startHour: number;
  startMinute: number;
  startMeridiem: Meridiem;
  sessionDuration: 30 | 60;
};

type ValidationErrors = Partial<Record<keyof BookingFormState, string>> & {
  duration?: string;
};

function to24Hour(hour12: number, meridiem: Meridiem) {
  if (meridiem === "AM") {
    return hour12 % 12;
  }
  return hour12 % 12 + 12;
}

function toMinutes(hour12: number, minute: number, meridiem: Meridiem) {
  return to24Hour(hour12, meridiem) * 60 + minute;
}

function to12Hour(totalMinutes: number): { hour: number; minute: number; meridiem: Meridiem } {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const meridiem: Meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour: hour12, minute, meridiem };
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function pickStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeOption(record: Record<string, unknown>, fallbackPrefix: string, index: number): SelectOption {
  const id = pickStringValue(record, ["id", "uuid", "_id"]) || `${fallbackPrefix}-${index}`;
  const label = pickStringValue(record, ["label", "name", "title", "code"]) || "Unnamed";
  return { id, label };
}

export function LiveSessionBookingFlow() {
  const router = useRouter();
  function withRoleQuery(path: string) {
    if (typeof window === "undefined") {
      return path;
    }
    const query = new URLSearchParams(window.location.search);
    const role = query.get("role");
    if (!role) {
      return path;
    }
    return `${path}${path.includes("?") ? "&" : "?"}role=${role}`;
  }

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<BookingFormState>({
    departmentId: "",
    courseId: "",
    topicId: "",
    customTopic: "",
    description: "",
    sessionDate: "",
    startHour: 7,
    startMinute: 30,
    startMeridiem: "PM",
    sessionDuration: 30,
  });
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [courses, setCourses] = useState<SelectOption[]>([]);
  const [topics, setTopics] = useState<SelectOption[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const todayDate = getTodayDateString();

  const selectedDepartment = departments.find((item) => item.id === form.departmentId);
  const selectedCourse = courses.find((item) => item.id === form.courseId);
  const selectedTopic = topics.find((item) => item.id === form.topicId);
  const topicDisplayValue =
    form.topicId === TOPIC_OTHER_VALUE ? form.customTopic.trim() : (selectedTopic?.label ?? "");

  const durationMinutes = form.sessionDuration;

  const startInMinutes = useMemo(() => {
    return toMinutes(form.startHour, form.startMinute, form.startMeridiem);
  }, [form.startHour, form.startMeridiem, form.startMinute]);

  const endTime = useMemo(() => {
    return to12Hour(startInMinutes + form.sessionDuration);
  }, [form.sessionDuration, startInMinutes]);

  const durationError = useMemo(() => {
    if (durationMinutes < 30 || durationMinutes > 60) {
      return "Session duration must be between 30 and 60 minutes.";
    }
    return null;
  }, [durationMinutes]);

  const price = useMemo(() => (form.sessionDuration / 30) * PRICE_PER_30_MIN, [form.sessionDuration]);

  const autoTimeSlot = useMemo(() => {
    const start = toMinutes(form.startHour, form.startMinute, form.startMeridiem);
    const computedEnd = start + form.sessionDuration;
    const { hour, minute, meridiem } = to12Hour(computedEnd);
    return `${form.startHour}:${String(form.startMinute).padStart(2, "0")} ${form.startMeridiem} - ${hour}:${String(minute).padStart(2, "0")} ${meridiem}`;
  }, [form.sessionDuration, form.startHour, form.startMeridiem, form.startMinute]);

  function backToOverview() {
    router.push(withRoleQuery("/dashboard/live-session"));
  }

  useEffect(() => {
    let alive = true;
    setIsLoadingDepartments(true);
    setCatalogError(null);

    void apiFetch<Record<string, unknown>[]>("/departments", { auth: true })
      .then((data) => {
        if (!alive) return;
        const normalized = data.map((item, index) => normalizeOption(item, "department", index));
        setDepartments(normalized);
      })
      .catch(() => {
        if (!alive) return;
        setCatalogError("Failed to load departments. Please try again.");
      })
      .finally(() => {
        if (!alive) return;
        setIsLoadingDepartments(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!form.departmentId) {
      setCourses([]);
      setTopics([]);
      return;
    }

    let alive = true;
    setIsLoadingCourses(true);
    setCatalogError(null);

    void apiFetch<Record<string, unknown>[]>(
      `/courses?departmentId=${encodeURIComponent(form.departmentId)}`,
      { auth: true }
    )
      .then((data) => {
        if (!alive) return;
        const normalized = data.map((item, index) => normalizeOption(item, "course", index));
        setCourses(normalized);
      })
      .catch(() => {
        if (!alive) return;
        setCatalogError("Failed to load courses. Please select department again.");
      })
      .finally(() => {
        if (!alive) return;
        setIsLoadingCourses(false);
      });

    return () => {
      alive = false;
    };
  }, [form.departmentId]);

  useEffect(() => {
    if (!form.courseId) {
      setTopics([]);
      return;
    }

    let alive = true;
    setIsLoadingTopics(true);
    setCatalogError(null);

    void apiFetch<Record<string, unknown>[]>(
      `/topics?courseId=${encodeURIComponent(form.courseId)}`,
      { auth: true }
    )
      .then((data) => {
        if (!alive) return;
        const normalized = data.map((item, index) => normalizeOption(item, "topic", index));
        setTopics(normalized);
      })
      .catch(() => {
        if (!alive) return;
        setCatalogError("Failed to load topics. Please select course again.");
      })
      .finally(() => {
        if (!alive) return;
        setIsLoadingTopics(false);
      });

    return () => {
      alive = false;
    };
  }, [form.courseId]);

  function validateStep1() {
    const nextErrors: ValidationErrors = {};
    if (!form.departmentId) nextErrors.departmentId = "Department is required.";
    if (!form.courseId) nextErrors.courseId = "Course is required.";
    if (!form.topicId) nextErrors.topicId = "Topic is required.";
    if (form.topicId === TOPIC_OTHER_VALUE) {
      const topicInput = form.customTopic.trim();
      if (!topicInput) {
        nextErrors.customTopic = "Please write your topic name.";
      } else if (topicInput.length <= 3) {
        nextErrors.customTopic = "Topic name must be longer than 3 characters.";
      } else if (!/^[A-Za-z\s]+$/.test(topicInput)) {
        nextErrors.customTopic = "Topic name must contain only letters and spaces.";
      }
    }
    if (!form.description.trim()) nextErrors.description = "Problem description is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateStep2() {
    const nextErrors: ValidationErrors = {};
    if (!form.sessionDate) {
      nextErrors.sessionDate = "Date is required.";
    }
    if (form.sessionDate && form.sessionDate < todayDate) {
      nextErrors.sessionDate = "You cannot select a past date.";
    }
    if (form.sessionDate === todayDate) {
      const startMinutes = toMinutes(form.startHour, form.startMinute, form.startMeridiem);
      if (startMinutes < getCurrentMinutes()) {
        nextErrors.duration = "Start time cannot be in the past for today.";
      }
    }
    if (durationError) {
      nextErrors.duration = durationError;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    const valid = step === 1 ? validateStep1() : validateStep2();
    if (!valid) return;
    setStep((current) => Math.min(current + 1, 3));
  }

  function submitBooking() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="space-y-4">
        <Button variant="secondary" iconLeft={ArrowLeft} onClick={backToOverview}>
          Back to Live Session Page
        </Button>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Booking Request Submitted</h3>
          </div>
          <p className="mt-2 text-sm text-emerald-700/90 dark:text-emerald-200">
            Your request is submitted. You will receive confirmation and payment instructions in dashboard notifications.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Button variant="secondary" iconLeft={ArrowLeft} onClick={backToOverview}>
        Back to Live Session Page
      </Button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Book Live Session</h3>
          <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
            Step {step} of 3
          </span>
        </div>

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5 text-sm md:col-span-1">
              <span className="font-medium text-slate-700 dark:text-slate-200">Department</span>
              <select
                value={form.departmentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                    courseId: "",
                    topicId: "",
                    customTopic: "",
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">{isLoadingDepartments ? "Loading departments..." : "Select department"}</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.label}
                  </option>
                ))}
              </select>
              {errors.departmentId ? <p className="text-xs text-rose-500">{errors.departmentId}</p> : null}
            </label>

            <label className="space-y-1.5 text-sm md:col-span-1">
              <span className="font-medium text-slate-700 dark:text-slate-200">Course</span>
              <select
                value={form.courseId}
                disabled={!form.departmentId || isLoadingCourses}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    courseId: event.target.value,
                    topicId: "",
                    customTopic: "",
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">
                  {!form.departmentId
                    ? "Select department first"
                    : isLoadingCourses
                      ? "Loading courses..."
                      : "Select course"}
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.label}
                  </option>
                ))}
              </select>
              {errors.courseId ? <p className="text-xs text-rose-500">{errors.courseId}</p> : null}
            </label>

            <label className="space-y-1.5 text-sm md:col-span-1">
              <span className="font-medium text-slate-700 dark:text-slate-200">Topic</span>
              <select
                value={form.topicId}
                disabled={!form.courseId || isLoadingTopics}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    topicId: event.target.value,
                    customTopic: event.target.value === TOPIC_OTHER_VALUE ? current.customTopic : "",
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">
                  {!form.courseId
                    ? "Select course first"
                    : isLoadingTopics
                      ? "Loading topics..."
                      : "Select topic"}
                </option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.label}
                  </option>
                ))}
                <option value={TOPIC_OTHER_VALUE}>Other</option>
              </select>
              {errors.topicId ? <p className="text-xs text-rose-500">{errors.topicId}</p> : null}
            </label>

            {form.topicId === TOPIC_OTHER_VALUE ? (
              <label className="space-y-1.5 text-sm md:col-span-2">
                <span className="font-medium text-slate-700 dark:text-slate-200">Write Topic Name</span>
                <input
                  type="text"
                  value={form.customTopic}
                  onChange={(event) => setForm((current) => ({ ...current, customTopic: event.target.value }))}
                  placeholder="Enter topic name"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
                />
                {errors.customTopic ? <p className="text-xs text-rose-500">{errors.customTopic}</p> : null}
              </label>
            ) : null}

            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium text-slate-700 dark:text-slate-200">Problem Description</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.description ? <p className="text-xs text-rose-500">{errors.description}</p> : null}
            </label>

            {catalogError ? <p className="text-xs text-rose-500 md:col-span-2">{catalogError}</p> : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Session Date</span>
              <input
                type="date"
                value={form.sessionDate}
                min={todayDate}
                onChange={(event) =>
                  setForm((current) => {
                    const nextDate = event.target.value;
                    const next = { ...current, sessionDate: nextDate };
                    if (nextDate === todayDate) {
                      const startMinutes = toMinutes(next.startHour, next.startMinute, next.startMeridiem);
                      const nowMinutes = getCurrentMinutes();
                      if (startMinutes < nowMinutes) {
                        const roundedNow = Math.min(Math.ceil(nowMinutes / 15) * 15, 23 * 60 + 45);
                        const adjusted = to12Hour(roundedNow);
                        next.startHour = adjusted.hour;
                        next.startMinute = adjusted.minute;
                        next.startMeridiem = adjusted.meridiem;
                      }
                    }
                    return next;
                  })
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.sessionDate ? <p className="text-xs text-rose-500">{errors.sessionDate}</p> : null}
            </label>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold tracking-[0.15em] text-slate-400">START TIME</p>
                <div className="flex items-center gap-2">
                  <select
                    value={form.startHour}
                    onChange={(event) =>
                      setForm((current) => {
                        const next = { ...current, startHour: Number(event.target.value) };
                        if (next.sessionDate === todayDate) {
                          const startMinutes = toMinutes(next.startHour, next.startMinute, next.startMeridiem);
                          const nowMinutes = getCurrentMinutes();
                          if (startMinutes < nowMinutes) {
                            const adjusted = to12Hour(Math.min(Math.ceil(nowMinutes / 15) * 15, 23 * 60 + 45));
                            next.startHour = adjusted.hour;
                            next.startMinute = adjusted.minute;
                            next.startMeridiem = adjusted.meridiem;
                          }
                        }
                        return next;
                      })
                    }
                    className="h-14 w-24 rounded-xl border border-brand-primary px-3 text-2xl outline-none"
                  >
                    {hourOptions.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <span className="text-2xl font-semibold text-slate-500">:</span>
                  <select
                    value={form.startMinute}
                    onChange={(event) =>
                      setForm((current) => {
                        const next = { ...current, startMinute: Number(event.target.value) };
                        if (next.sessionDate === todayDate) {
                          const startMinutes = toMinutes(next.startHour, next.startMinute, next.startMeridiem);
                          const nowMinutes = getCurrentMinutes();
                          if (startMinutes < nowMinutes) {
                            const adjusted = to12Hour(Math.min(Math.ceil(nowMinutes / 15) * 15, 23 * 60 + 45));
                            next.startHour = adjusted.hour;
                            next.startMinute = adjusted.minute;
                            next.startMeridiem = adjusted.meridiem;
                          }
                        }
                        return next;
                      })
                    }
                    className="h-14 w-24 rounded-xl border border-slate-200 bg-slate-100 px-3 text-2xl outline-none"
                  >
                    {minuteOptions.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    {(["AM", "PM"] as const).map((meridiem) => (
                      <button
                        key={meridiem}
                        type="button"
                        onClick={() =>
                          setForm((current) => {
                            const next = { ...current, startMeridiem: meridiem };
                            if (next.sessionDate === todayDate) {
                              const startMinutes = toMinutes(next.startHour, next.startMinute, next.startMeridiem);
                              const nowMinutes = getCurrentMinutes();
                              if (startMinutes < nowMinutes) {
                                const adjusted = to12Hour(Math.min(Math.ceil(nowMinutes / 15) * 15, 23 * 60 + 45));
                                next.startHour = adjusted.hour;
                                next.startMinute = adjusted.minute;
                                next.startMeridiem = adjusted.meridiem;
                              }
                            }
                            return next;
                          })
                        }
                        className={`block w-14 px-2 py-2 text-sm font-semibold ${
                          form.startMeridiem === meridiem ? "bg-brand-primary text-white" : "bg-white text-slate-600"
                        }`}
                      >
                        {meridiem}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex flex-col justify-center rounded-2xl border border-brand-primary/30 bg-brand-primary/5 px-4 py-3 text-sm dark:border-brand-primary/40">
                <span className="mb-1 text-xs font-semibold tracking-[0.15em] text-brand-primary">SESSION LENGTH</span>
                <select
                  value={form.sessionDuration}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sessionDuration: Number(event.target.value) as 30 | 60,
                    }))
                  }
                  className="h-11 rounded-xl border border-brand-primary/30 bg-white px-3 font-semibold text-brand-primary outline-none"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </label>

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold tracking-[0.15em] text-slate-400">END TIME</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-14 w-24 items-center justify-center rounded-xl border border-brand-primary bg-brand-primary/5 px-3 text-2xl font-semibold">
                    {endTime.hour}
                  </div>
                  <span className="text-2xl font-semibold text-slate-500">:</span>
                  <div className="flex h-14 w-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-2xl font-semibold">
                    {String(endTime.minute).padStart(2, "0")}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-brand-primary px-3 py-2 text-sm font-semibold text-white">
                    {endTime.meridiem}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">End time is auto-calculated from start time and selected duration.</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Clock3 className="h-4 w-4" />
                Time Slot: {autoTimeSlot}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Duration: {durationMinutes} minutes</p>
              <p className="mt-1 text-lg font-semibold text-brand-primary">Estimated Price: ৳{price || 0}</p>
              {errors.duration ? <p className="mt-1 text-xs text-rose-500">{errors.duration}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
            <p>
              <strong>Department:</strong> {selectedDepartment?.label || "-"}
            </p>
            <p>
              <strong>Course:</strong> {selectedCourse?.label || "-"}
            </p>
            <p>
              <strong>Topic:</strong> {topicDisplayValue || "-"}
            </p>
            <p>
              <strong>Date:</strong> {form.sessionDate || "-"}
            </p>
            <p>
              <strong>Start:</strong> {form.startHour}:{String(form.startMinute).padStart(2, "0")} {form.startMeridiem}
            </p>
            <p>
              <strong>End:</strong> {endTime.hour}:{String(endTime.minute).padStart(2, "0")} {endTime.meridiem}
            </p>
            <p>
              <strong>Duration:</strong> {form.sessionDuration} minutes
            </p>
            <p>
              <strong>Total Price:</strong> ৳{price || 0}
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep((current) => current - 1)}>
              Previous
            </Button>
          ) : null}
          {step < 3 ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button iconLeft={CheckCircle2} onClick={submitBooking}>
              Submit Booking Request
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
