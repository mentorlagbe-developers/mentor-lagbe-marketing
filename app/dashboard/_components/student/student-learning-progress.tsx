import { useState } from "react";

type ProgressItem = {
  course: string;
  progress: number;
  credits: number;
};

const progressItems = [
  { course: "CSE220 - Data Structures", progress: 78, credits: 3 },
  { course: "BBA210 - Principles of Marketing", progress: 64, credits: 3 },
  { course: "CSE310 - Operating Systems", progress: 88, credits: 3 },
];

type StudentLearningProgressProps = {
  initialData?: ProgressItem[];
};

export function StudentLearningProgress({ initialData = progressItems }: StudentLearningProgressProps) {
  const [items] = useState<ProgressItem[]>(initialData);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Learning Progress</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.course}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-200">
                {item.course} <span className="text-xs text-slate-400">({item.credits} credits)</span>
              </span>
              <span className="font-semibold text-brand-primary">{item.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${item.progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">On track for this semester</p>
          </div>
        ))}
      </div>
    </section>
  );
}
