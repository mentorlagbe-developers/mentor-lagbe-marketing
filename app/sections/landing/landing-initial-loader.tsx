"use client";

import Image from "next/image";

export function LandingInitialLoader() {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-linear-to-br from-sky-50 via-cyan-50 to-blue-100/90 backdrop-blur-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(14,116,144,0.2)_1px,transparent_0)] bg-size-[20px_20px] opacity-40" />
      <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_30px_80px_-40px_rgba(14,116,144,0.5)]">
        <div className="absolute -top-6 h-16 w-16 rounded-full bg-cyan-200/60 blur-xl" />
        <div className="relative h-20 w-20 animate-[pulse_1.8s_ease-in-out_infinite] overflow-hidden rounded-full border border-sky-200 bg-white p-2 shadow-[0_18px_44px_-26px_rgba(2,132,199,0.55)]">
          <Image
            src="/images/logo-3.png"
            alt="Mentor Lagbe logo"
            fill
            sizes="80px"
            className="object-contain p-2"
            priority
          />
        </div>
        <p className="text-sm font-semibold text-sky-700">Preparing your experience...</p>
        <div className="h-2 w-44 overflow-hidden rounded-full bg-sky-100">
          <div className="h-full w-1/2 animate-[loader-slide_1.2s_ease-in-out_infinite] rounded-full bg-brand-primary" />
        </div>
      </div>
      <style jsx>{`
        @keyframes loader-slide {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </div>
  );
}

