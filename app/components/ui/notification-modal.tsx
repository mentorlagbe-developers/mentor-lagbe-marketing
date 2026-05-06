"use client";

import {
  Bell,
  CircleDollarSign,
  Eye,
  House,
  MessageCircleMore,
  Settings,
} from "lucide-react";
import { Modal } from "@/app/components/ui/modal";

type NotificationModalProps = {
  open: boolean;
  onClose: () => void;
};

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

export function NotificationModal({ open, onClose }: NotificationModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      <div className="flex w-full flex-col bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold text-slate-900">Notifications</h2>
            <span className="rounded-full bg-sky-600 px-3 py-1 text-sm font-semibold text-white">
              3 NEW
            </span>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notification settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-400">RECENT</p>
          {recentItems.map((item) => (
            <div key={item.id} className="rounded-2xl bg-[#f2f6fb] px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="relative mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                  <House className="h-5 w-5" />
                  <span
                    className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-white ${item.color}`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-medium leading-8 text-slate-800">{item.title}</p>
                  <p className="text-lg text-slate-500">{item.location}</p>
                  <p className="text-2xl text-slate-400">{item.time}</p>
                </div>
              </div>
            </div>
          ))}

          <p className="pt-2 text-xs font-semibold tracking-[0.16em] text-slate-400">EARLIER</p>
          <div className="rounded-2xl bg-[#f7faf7] px-4 py-4 text-lg text-slate-600">
            Rent payment received <strong>৳35,000</strong>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 border-t border-slate-200 bg-white px-6 py-5 text-2xl font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          <Eye className="h-6 w-6" />
          View All Notifications
        </button>
      </div>
    </Modal>
  );
}
