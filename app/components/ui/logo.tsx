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
        width={220}
        height={58}
        priority
        className="h-9 w-auto max-w-[min(100%,11rem)] object-contain sm:h-11 sm:max-w-none"
      />
    </Link>
  );
}
