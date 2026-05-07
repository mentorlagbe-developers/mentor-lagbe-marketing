"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";

const faculties = [
  {
    id: "cse",
    label: "CSE",
    departments: [
      {
        id: "computer-science",
        label: "Computer Science",
        courses: [
          { id: "cse220", label: "CSE220 - Data Structures", topics: ["Trees", "Graphs", "Sorting", "Hashing"] },
          { id: "cse310", label: "CSE310 - Operating Systems", topics: ["Processes", "Threads", "Deadlock", "Memory"] },
        ],
      },
    ],
  },
  {
    id: "bba",
    label: "BBA",
    departments: [
      {
        id: "business-administration",
        label: "Business Administration",
        courses: [
          { id: "bba210", label: "BBA210 - Financial Management", topics: ["NPV", "IRR", "Risk", "Capital Budgeting"] },
          { id: "bba230", label: "BBA230 - Marketing Strategy", topics: ["STP", "Branding", "Case Analysis"] },
        ],
      },
    ],
  },
];

const hourOptions = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minuteOptions = [0, 15, 30, 45];
const PRICE_PER_30_MIN = 100;

type Meridiem = "AM" | "PM";

type BookingFormState = {
  facultyId: string;
  departmentId: string;
  courseId: string;
  topic: string;
  description: string;
  sessionDate: string;
  startHour: number;
  startMinute: number;
  startMeridiem: Meridiem;
  endHour: number;
  endMinute: number;
  endMeridiem: Meridiem;
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
    facultyId: "",
    departmentId: "",
    courseId: "",
    topic: "",
    description: "",
    sessionDate: "",
    startHour: 7,
    startMinute: 30,
    startMeridiem: "PM",
    endHour: 8,
    endMinute: 0,
    endMeridiem: "PM",
  });

  const selectedFaculty = faculties.find((item) => item.id === form.facultyId);
  const selectedDepartment = selectedFaculty?.departments.find((item) => item.id === form.departmentId);
  const selectedCourse = selectedDepartment?.courses.find((item) => item.id === form.courseId);

  const durationMinutes = useMemo(() => {
    const start = toMinutes(form.startHour, form.startMinute, form.startMeridiem);
    const end = toMinutes(form.endHour, form.endMinute, form.endMeridiem);
    return end - start;
  }, [form.endHour, form.endMeridiem, form.endMinute, form.startHour, form.startMeridiem, form.startMinute]);

  const price = useMemo(() => (Math.max(durationMinutes, 0) / 30) * PRICE_PER_30_MIN, [durationMinutes]);

  function backToOverview() {
    router.push(withRoleQuery("/dashboard/live-session"));
  }

  function validateStep1() {
    const nextErrors: ValidationErrors = {};
    if (!form.facultyId) nextErrors.facultyId = "Faculty is required.";
    if (!form.departmentId) nextErrors.departmentId = "Department is required.";
    if (!form.courseId) nextErrors.courseId = "Course is required.";
    if (!form.topic) nextErrors.topic = "Topic is required.";
    if (!form.description.trim()) nextErrors.description = "Problem description is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateStep2() {
    const nextErrors: ValidationErrors = {};
    if (!form.sessionDate) {
      nextErrors.sessionDate = "Date is required.";
    }
    if (durationMinutes < 30 || durationMinutes > 60) {
      nextErrors.duration = "Session duration must be between 30 and 60 minutes.";
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
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Faculty</span>
              <select
                value={form.facultyId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    facultyId: event.target.value,
                    departmentId: "",
                    courseId: "",
                    topic: "",
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Select faculty</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.label}
                  </option>
                ))}
              </select>
              {errors.facultyId ? <p className="text-xs text-rose-500">{errors.facultyId}</p> : null}
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Department</span>
              <select
                value={form.departmentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                    courseId: "",
                    topic: "",
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Select department</option>
                {selectedFaculty?.departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.label}
                  </option>
                ))}
              </select>
              {errors.departmentId ? <p className="text-xs text-rose-500">{errors.departmentId}</p> : null}
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Course</span>
              <select
                value={form.courseId}
                onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value, topic: "" }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Select course</option>
                {selectedDepartment?.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.label}
                  </option>
                ))}
              </select>
              {errors.courseId ? <p className="text-xs text-rose-500">{errors.courseId}</p> : null}
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Topic</span>
              <select
                value={form.topic}
                onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Select topic</option>
                {selectedCourse?.topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              {errors.topic ? <p className="text-xs text-rose-500">{errors.topic}</p> : null}
            </label>

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
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Session Date</span>
              <input
                type="date"
                value={form.sessionDate}
                onChange={(event) => setForm((current) => ({ ...current, sessionDate: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.sessionDate ? <p className="text-xs text-rose-500">{errors.sessionDate}</p> : null}
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold tracking-[0.15em] text-slate-400">START TIME</p>
                <div className="flex items-center gap-2">
                  <select
                    value={form.startHour}
                    onChange={(event) => setForm((current) => ({ ...current, startHour: Number(event.target.value) }))}
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
                    onChange={(event) => setForm((current) => ({ ...current, startMinute: Number(event.target.value) }))}
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
                        onClick={() => setForm((current) => ({ ...current, startMeridiem: meridiem }))}
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

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold tracking-[0.15em] text-slate-400">END TIME</p>
                <div className="flex items-center gap-2">
                  <select
                    value={form.endHour}
                    onChange={(event) => setForm((current) => ({ ...current, endHour: Number(event.target.value) }))}
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
                    value={form.endMinute}
                    onChange={(event) => setForm((current) => ({ ...current, endMinute: Number(event.target.value) }))}
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
                        onClick={() => setForm((current) => ({ ...current, endMeridiem: meridiem }))}
                        className={`block w-14 px-2 py-2 text-sm font-semibold ${
                          form.endMeridiem === meridiem ? "bg-brand-primary text-white" : "bg-white text-slate-600"
                        }`}
                      >
                        {meridiem}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Clock3 className="h-4 w-4" />
                Duration: {durationMinutes > 0 ? `${durationMinutes} minutes` : "Invalid range"}
              </p>
              <p className="mt-1 text-lg font-semibold text-brand-primary">Estimated Price: ৳{price || 0}</p>
              {errors.duration ? <p className="mt-1 text-xs text-rose-500">{errors.duration}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
            <p>
              <strong>Faculty:</strong> {selectedFaculty?.label || "-"}
            </p>
            <p>
              <strong>Department:</strong> {selectedDepartment?.label || "-"}
            </p>
            <p>
              <strong>Course:</strong> {selectedCourse?.label || "-"}
            </p>
            <p>
              <strong>Topic:</strong> {form.topic || "-"}
            </p>
            <p>
              <strong>Date:</strong> {form.sessionDate || "-"}
            </p>
            <p>
              <strong>Start:</strong> {form.startHour}:{String(form.startMinute).padStart(2, "0")} {form.startMeridiem}
            </p>
            <p>
              <strong>End:</strong> {form.endHour}:{String(form.endMinute).padStart(2, "0")} {form.endMeridiem}
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
