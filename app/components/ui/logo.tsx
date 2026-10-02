import Link from "next/link";
import Image from "next/image";

type LogoProps = {
  isDark?: boolean;
};

export function Logo({ isDark = false }: LogoProps) {
  return (
    <Link href="/" className="inline-flex items-center">
      <Image
        src={isDark ? "/images/logo-2.png" : "/images/logo.png"}
        alt="Mentor Lagbe logo"
        width={240}
        height={64}
        priority
        className="h-10 w-auto max-w-[min(100%,12.5rem)] object-contain sm:h-12 sm:max-w-none"
      />
    </Link>
  );
}
