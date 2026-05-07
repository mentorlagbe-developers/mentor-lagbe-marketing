"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

const WHATSAPP_NUMBER = "8801409365577";
const DEFAULT_MESSAGE = "Hello, i want to purchase a session. Please help me.";

export function WhatsAppChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  function sendMessage() {
    const encoded = encodeURIComponent(message.trim() || DEFAULT_MESSAGE);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-6 right-6 z-40 w-[min(90vw,340px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between bg-brand-primary px-4 py-3 text-white">
            <p className="text-sm font-semibold">WhatsApp Support</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 transition hover:bg-white/20"
              aria-label="Close chat widget"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send your message directly to support team.
            </p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-secondary"
            >
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
        aria-label="Open WhatsApp chat support"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
}
