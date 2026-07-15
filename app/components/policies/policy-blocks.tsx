import type { PolicyBlock } from "@/data/policies/types";

export function PolicyBlocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.kind === "paragraph") {
          return (
            <p key={index} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {block.text}
            </p>
          );
        }
        if (block.kind === "warning") {
          return (
            <div
              key={index}
              className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            >
              <p className="font-semibold text-amber-900 dark:text-amber-50">Important notice</p>
              <p className="mt-1">{block.text}</p>
            </div>
          );
        }
        if (block.kind === "bullets") {
          return (
            <ul key={index} className="space-y-2 pl-1">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={index} className="space-y-2.5">
            {block.items.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}
