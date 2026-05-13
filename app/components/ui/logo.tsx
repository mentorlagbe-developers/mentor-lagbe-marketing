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
        className="h-11 w-auto object-contain"
      />
    </Link>
  );
}
