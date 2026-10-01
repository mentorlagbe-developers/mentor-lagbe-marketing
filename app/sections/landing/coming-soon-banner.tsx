"use client";

export function ComingSoonBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-sky-700/40 bg-linear-to-r from-sky-600 via-sky-500 to-cyan-600 px-4 py-3.5 text-center shadow-md shadow-sky-900/20 sm:py-4"
    >
      <p className="mx-auto max-w-4xl text-sm font-medium leading-relaxed text-white sm:text-base">
        <span className="font-bold tracking-tight">One-to-one live mentorship is coming soon.</span>
        <span className="hidden sm:inline"> — </span>
        <span className="mt-0.5 block sm:mt-0 sm:inline">
          Until launch, follow us on YouTube and Facebook for free courses and live sessions.
        </span>
      </p>
    </div>
  );
}
