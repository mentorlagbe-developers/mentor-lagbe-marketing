export type StudentStatItem = {
  label: string;
  value: string;
  /** Optional second line (e.g. time range under date for Next Session). */
  subtitle?: string;
  trend: string;
};

const statItems: StudentStatItem[] = [
  { label: "CSE Lab Completion", value: "48", trend: "+6 tasks this month" },
  { label: "BBA Case Submissions", value: "12", trend: "2 pending reviews" },
  { label: "Semester GPA Track", value: "3.68", trend: "+0.14 from last term" },
  { label: "Upcoming University Sessions", value: "3", trend: "Next in 2 hours" },
];

type StudentQuickStatsProps = {
  items?: StudentStatItem[];
};

export function StudentQuickStats({ items = statItems }: StudentQuickStatsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
          {item.subtitle ? (
            <p className="mt-1 text-sm font-normal text-slate-500 dark:text-slate-400">{item.subtitle}</p>
          ) : null}
          <p className="mt-1 text-xs text-brand-primary">{item.trend}</p>
        </article>
      ))}
    </section>
  );
}
