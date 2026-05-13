import type { Metadata } from "next";
import { AboutPageShell } from "@/app/sections/about/about-page-shell";

export const metadata: Metadata = {
  title: "About Us | Mentor Lagbe",
  description:
    "Learn about Mentor Lagbe's mission, values, team, and impact in one-to-one live mentorship.",
};

export default function AboutPage() {
  return <AboutPageShell />;
}
