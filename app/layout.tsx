import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthBootstrap } from "@/app/components/auth-bootstrap";
import { AppProviders } from "@/app/components/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mentor Lagbe",
  description:
    process.env.NEXT_PUBLIC_COMING_SOON === "true"
      ? "One-to-one live mentorship coming soon. Free courses and live sessions on YouTube and Facebook."
      : "One-to-one live mentorship platform for students, resources, and guided learning.",
  icons: {
    icon: [{ url: "/images/logo-3.png", type: "image/png" }],
    apple: [{ url: "/images/logo-3.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AppProviders>
          <AuthBootstrap />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
