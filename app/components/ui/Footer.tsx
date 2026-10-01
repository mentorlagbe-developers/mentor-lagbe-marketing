"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUp, Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, YoutubeIcon } from "@/app/components/ui/icons";
import { ContactModal } from "@/app/components/ui/contact-modal";
import {
  FOOTER_BOTTOM_POLICY_LINKS,
  FOOTER_SUPPORT_POLICY_LINKS,
  policyPath,
} from "@/data/policies";
import { getAccessToken } from "@/lib/auth-store";
import { getFacebookUrl, getYoutubeUrl } from "@/lib/social-links";
import { SITE_CONTACT } from "@/lib/site-contact";
import { useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";

const footerLinks = {
  quickLinks: [
    { nameKey: "footer.aboutUs" as MessageKey, href: "/about" },
    { nameKey: "footer.allCourses" as MessageKey, href: "#" },
    { nameKey: "footer.liveBatches" as MessageKey, href: "#" },
    { nameKey: "footer.findTeachers" as MessageKey, href: "#" },
    { nameKey: "footer.successStories" as MessageKey, href: "#" },
    { nameKey: "footer.blog" as MessageKey, href: "#" },
    { nameKey: "footer.career" as MessageKey, href: "#" },
  ],
  support: [
    { name: "Help Center", href: "/dashboard/help-center", kind: "help-center" as const },
    ...FOOTER_SUPPORT_POLICY_LINKS.map((item) => ({
      name: item.label,
      href: policyPath(item.slug),
      kind: "policy" as const,
    })),
  ],
};

export default function Footer() {
  const t = useT();
  const currentYear = new Date().getFullYear();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const facebookUrl = getFacebookUrl();
  const youtubeUrl = getYoutubeUrl();

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function handleHelpCenterClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (getAccessToken()) {
      return;
    }
    event.preventDefault();
    setIsContactOpen(true);
  }

  return (
    <footer className="relative bg-black px-4 pb-7 pt-20 text-slate-400 sm:px-6 sm:pt-16 md:px-12 md:pt-16 lg:px-24">
      <button
        type="button"
        onClick={handleBackToTop}
        className="absolute right-0 top-[30px] z-10 inline-flex -translate-y-1/2 items-center gap-2 rounded-bl-[28px] rounded-tr-0 bg-white px-2.5 py-2 text-black shadow-[0_16px_44px_-24px_rgba(255,255,255,0.5)] transition-all duration-300 hover:translate-y-[-58%] hover:shadow-[0_18px_54px_-20px_rgba(255,255,255,0.6)] sm:gap-3 sm:px-4 sm:py-2.5"
        aria-label={t("footer.backToTop")}
      >
        <span className="hidden text-base font-semibold sm:inline">{t("footer.backToTop")}</span>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
          <ArrowUp className="h-5 w-5" />
        </span>
      </button>
      <div className="mx-auto mb-7 grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Brand Section */}
        <div className="space-y-6">
          <Image 
            src="/images/logo-2.png" 
            alt="Mentor Lagbe Logo" 
            width={150} 
            height={50} 
            className="brightness-0 invert" 
          />
          <p className="text-sm leading-relaxed max-w-xs">{t("footer.brand")}</p>
          <div className="flex items-center gap-3">
            <Link
              href={youtubeUrl}
              className="text-sky-500 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.45)]"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <YoutubeIcon className="h-5 w-5" />
            </Link>
            <Link
              href={facebookUrl}
              className="text-sky-500 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.45)]"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FacebookIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sky-500 font-semibold mb-6">{t("footer.quickLinks")}</h4>
          <ul className="space-y-4">
            {footerLinks.quickLinks.map((link) => (
              <li key={link.nameKey}>
                <Link href={link.href} className="hover:text-white transition-colors text-sm">{t(link.nameKey)}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support & Policies */}
        <div>
          <h4 className="text-sky-500 font-semibold mb-6">{t("footer.support")}</h4>
          <ul className="space-y-4">
            {footerLinks.support.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  onClick={link.kind === "help-center" ? handleHelpCenterClick : undefined}
                  className="hover:text-white transition-colors text-sm"
                >
                  {link.kind === "help-center" ? t("footer.helpCenter") : link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Us & Newsletter */}
        <div className="space-y-8">
          <div>
            <h4 className="text-sky-500 font-semibold mb-6">{t("footer.contactUs")}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-white shrink-0" />
                <a href={SITE_CONTACT.phoneHref} className="hover:text-white transition-colors">
                  {SITE_CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-white shrink-0" />
                <a href={SITE_CONTACT.emailHref} className="break-all hover:text-white transition-colors">
                  {SITE_CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-white shrink-0 mt-1" />
                <span>{SITE_CONTACT.address}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sky-500 font-semibold mb-4">{t("footer.newsletter")}</h4>
            <p className="text-xs mb-4">{t("footer.newsletterSub")}</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder={t("footer.emailPlaceholder")} 
                className="bg-transparent border border-slate-600 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button 
                type="submit" 
                className="bg-white text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {t("footer.subscribe")}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-900 pt-5 text-xs md:flex-row">
        <p>© {currentYear} {t("footer.copyright")} {t("footer.rights")}</p>
        <div className="flex gap-6">
          {FOOTER_BOTTOM_POLICY_LINKS.map((link) => (
            <Link key={link.slug} href={policyPath(link.slug)} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </footer>
  );
}
