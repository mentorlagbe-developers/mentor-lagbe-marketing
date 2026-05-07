"use client";

import { Bell, CircleDollarSign, House, MessageCircleMore, Settings } from "lucide-react";

const recentItems = [
  {
    id: 1,
    color: "bg-emerald-500",
    icon: CircleDollarSign,
    title: "Rafiul Islam submitted a new offer of ৳85,00,000",
    location: "House 12, Road 4, Dhanmondi, Dhaka",
    time: "2m ago",
  },
  {
    id: 2,
    color: "bg-amber-500",
    icon: Bell,
    title: "Nadia Chowdhury scheduled a viewing for tomorrow at 11:00 AM",
    location: "Apt 5B, Bashundhara R/A, Dhaka",
    time: "18m ago",
  },
  {
    id: 3,
    color: "bg-violet-500",
    icon: MessageCircleMore,
    title: "Arif Hossain sent you a message about lease terms",
    location: "Shop 3, Gulshan Avenue, Dhaka",
    time: "45m ago",
  },
];

export function NotificationDropdown() {
  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(92vw,340px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-26px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-2.5 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
          <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">3 NEW</span>
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Notification settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2.5 px-3.5 py-3">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400">RECENT</p>

        {recentItems.map((item) => (
          <article key={item.id} className="relative overflow-hidden rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/80">
            <span className={`absolute bottom-2 left-0 top-2 w-1 rounded-r ${item.color}`} />
            <div className="flex gap-2.5">
              <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm dark:bg-slate-700 dark:text-slate-200">
                <House className="h-3.5 w-3.5" />
                <span
                  className={`absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full text-white ${item.color}`}
                >
                  <item.icon className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-[13px] font-semibold leading-4.5 text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.location}</p>
                <p className="text-[11px] text-slate-400">{item.time}</p>
              </div>
            </div>
          </article>
        ))}

        <p className="pt-0.5 text-[10px] font-semibold tracking-[0.16em] text-slate-400">EARLIER</p>
        <article className="rounded-xl bg-[#f7faf7] px-3 py-2.5 dark:bg-slate-800/70">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
            Rent payment received <span className="font-bold">৳35,000</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Flat 8A, Uttara Sector 7, Dhaka</p>
          <p className="mt-1 text-[11px] text-slate-400">2h ago</p>
        </article>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 border-t border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        View All Notifications
      </button>
    </div>
  );
}
