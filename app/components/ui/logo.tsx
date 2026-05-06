import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center">
      <Image
        src="/images/logo.png"
        alt="Mentor Lagbe logo"
        width={220}
        height={58}
        priority
        className="h-11 w-auto object-contain"
      />
    </Link>
  );
}
