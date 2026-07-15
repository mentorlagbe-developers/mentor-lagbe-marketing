import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPageShell } from "@/app/policies/_components/policy-page-shell";
import { getAllPolicySlugs, getPolicyBySlug, POLICY_NAV_LINKS } from "@/data/policies";

type PolicyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPolicySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getPolicyBySlug(slug);
  if (!doc) {
    return { title: "Policy not found | Mentor Lagbe" };
  }
  return {
    title: `${doc.title} | Mentor Lagbe`,
    description: doc.intro,
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const doc = getPolicyBySlug(slug);
  if (!doc) notFound();

  const relatedPolicies = POLICY_NAV_LINKS.filter((item) => item.slug !== slug).slice(0, 4);

  return <PolicyPageShell doc={doc} relatedPolicies={relatedPolicies} />;
}
