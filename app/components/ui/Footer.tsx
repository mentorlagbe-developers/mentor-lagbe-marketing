import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Mail, MapPin, Phone } from "lucide-react";
import {
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterXIcon,
  YoutubeIcon,
} from "@/app/components/ui/icons";

const footerLinks = {
  quickLinks: [
    { name: "About Us", href: "#" },
    { name: "All Courses", href: "#" },
    { name: "Live Batches", href: "#" },
    { name: "Find Teachers", href: "#" },
    { name: "Success Stories", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Career", href: "#" },
  ],
  support: [
    { name: "Help Center", href: "#" },
    { name: "Student Support", href: "#" },
    { name: "Teacher Guidelines", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Refund Policy", href: "#" },
    { name: "Community Guidelines", href: "#" },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-black px-6 pb-7 pt-14 text-slate-400 md:px-12 md:pt-16 lg:px-24">
      <button
        type="button"
        onClick={handleBackToTop}
        className="absolute right-0 top-[30px] z-10 inline-flex -translate-y-1/2 items-center gap-3 rounded-bl-[28px] rounded-tr-0 bg-white px-4 py-2.5 text-black shadow-[0_16px_44px_-24px_rgba(255,255,255,0.5)] transition-all duration-300 hover:translate-y-[-58%] hover:shadow-[0_18px_54px_-20px_rgba(255,255,255,0.6)]"
        aria-label="Back to top"
      >
        <span className="text-base font-semibold">Back to top</span>
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
          <p className="text-sm leading-relaxed max-w-xs">
            Bangladesh&apos;s leading e-learning platform connecting students with expert mentors. 
            Transform your career with our world-class courses and personalized mentoring.
          </p>
          <div className="flex items-center gap-3">
            <Link href="#" className="text-sky-500 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.45)]"><FacebookIcon className="h-5 w-5" /></Link>
            <Link href="#" className="text-sky-500 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.45)]"><TwitterXIcon className="h-5 w-5" /></Link>
            <Link href="#" className="text-sky-500 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.45)]"><InstagramIcon className="h-5 w-5" /></Link>
            <Link href="#" className="text-sky-500 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.45)]"><YoutubeIcon className="h-5 w-5" /></Link>
            <Link href="#" className="text-sky-500 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.45)]"><LinkedinIcon className="h-5 w-5" /></Link>
            <Link href="#" className="text-sky-500 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.45)]"><GoogleIcon className="h-5 w-5" /></Link>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sky-500 font-semibold mb-6">Quick Links</h4>
          <ul className="space-y-4">
            {footerLinks.quickLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="hover:text-white transition-colors text-sm">{link.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support & Policies */}
        <div>
          <h4 className="text-sky-500 font-semibold mb-6">Support & Policies</h4>
          <ul className="space-y-4">
            {footerLinks.support.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="hover:text-white transition-colors text-sm">{link.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Us & Newsletter */}
        <div className="space-y-8">
          <div>
            <h4 className="text-sky-500 font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-white" />
                <span>+880 1234-567890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-white" />
                <span>hello@mentorlagbe.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-white shrink-0 mt-1" />
                <span>123 Tech Street, Dhanmondi, Dhaka 1205, Bangladesh.</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sky-500 font-semibold mb-4">Subscribe to our Newsletter</h4>
            <p className="text-xs mb-4">Get updates on new courses, live sessions, and exclusive offers</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-transparent border border-slate-600 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button 
                type="submit" 
                className="bg-white text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-900 pt-5 text-xs md:flex-row">
        <p>© {currentYear} Mentor Lagbe. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
          <Link href="#" className="hover:text-white transition-colors">Accessibility</Link>
        </div>
      </div>
    </footer>
  );
}