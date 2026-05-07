"use client";

export function DashboardFooter() {
  return (
    <footer className="mt-8 flex items-center justify-between border-t border-slate-200/80 px-6 py-3 text-xs text-slate-500 dark:border-slate-700/80 dark:text-slate-400">
      <p>© {new Date().getFullYear()} Mentor Lagbe</p>
      <div className="flex items-center gap-4">
        <a href="#" className="transition hover:text-brand-primary">
          About
        </a>
        <a href="#" className="transition hover:text-brand-primary">
          Support
        </a>
      </div>
    </footer>
  );
}
