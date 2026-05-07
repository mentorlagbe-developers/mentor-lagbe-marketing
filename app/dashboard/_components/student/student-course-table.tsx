"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Eye, PencilLine } from "lucide-react";

type CourseRow = {
  id: string;
  courseCode: string;
  courseTitle: string;
  mentorId: string;
  schedule: string;
  status: "active" | "pending" | "completed";
};

const initialRows: CourseRow[] = [
  { id: "1", courseCode: "CSE220", courseTitle: "Data Structures", mentorId: "MTR-2041", schedule: "Mon/Wed 7:30 PM", status: "active" },
  { id: "2", courseCode: "BBA210", courseTitle: "Principles of Marketing", mentorId: "MTR-3198", schedule: "Tue/Thu 6:00 PM", status: "pending" },
  { id: "3", courseCode: "CSE310", courseTitle: "Operating Systems", mentorId: "MTR-1187", schedule: "Sat 9:00 PM", status: "completed" },
];

type StudentCourseTableProps = {
  initialData?: CourseRow[];
};

export function StudentCourseTable({ initialData = initialRows }: StudentCourseTableProps) {
  const [query, setQuery] = useState("");
  const [rows] = useState(initialData);
  const [sortAsc, setSortAsc] = useState(true);

  const filteredRows = useMemo(() => {
    const searched = rows.filter((row) =>
      `${row.courseCode} ${row.courseTitle} ${row.mentorId}`.toLowerCase().includes(query.toLowerCase())
    );
    return searched.sort((a, b) =>
      sortAsc ? a.courseCode.localeCompare(b.courseCode) : b.courseCode.localeCompare(a.courseCode)
    );
  }, [query, rows, sortAsc]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Course Session Table</h3>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search course or mentor ID"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => setSortAsc((state) => !state)}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-3 py-2 font-medium">Course</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Mentor ID</th>
              <th className="px-3 py-2 font-medium">Schedule</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">{row.courseCode}</td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{row.courseTitle}</td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{row.mentorId}</td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{row.schedule}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      row.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : row.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <button className="rounded-md p-1.5 text-slate-500 hover:bg-sky-50 hover:text-brand-primary dark:hover:bg-slate-700">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-1.5 text-slate-500 hover:bg-sky-50 hover:text-brand-primary dark:hover:bg-slate-700">
                      <PencilLine className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export type { CourseRow };
