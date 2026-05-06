import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  Search,
  Star,
  X,
} from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const SearchIcon = Search;
export const BellIcon = Bell;
export const CloseIcon = X;
export const ArrowLeftIcon = ArrowLeft;
export const ChevronDownIcon = ChevronDown;
export const GlobeIcon = Globe;
export const EyeIcon = Eye;
export const EyeOffIcon = EyeOff;
export const CheckIcon = Check;
export const StarIcon = Star;

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.5 11.8A8.6 8.6 0 0 0 5.8 5.7a8.6 8.6 0 0 0-1.2 9.8L3 21l5.7-1.5a8.7 8.7 0 0 0 3.2.6h.1a8.6 8.6 0 0 0 8.5-8.3Zm-8.5 6.9h-.1a7.1 7.1 0 0 1-3.6-1l-.3-.2-3.4.9.9-3.3-.2-.3a7.2 7.2 0 1 1 6.7 3.9Zm4-5.3c-.2-.1-1.2-.6-1.4-.7s-.3-.1-.5.1-.6.7-.8.9c-.1.1-.3.1-.5 0a5.8 5.8 0 0 1-1.7-1.1 6.4 6.4 0 0 1-1.2-1.5c-.1-.2 0-.3 0-.4l.3-.3.2-.4c.1-.1.1-.3 0-.4s-.5-1.3-.7-1.8c-.2-.4-.3-.4-.5-.4h-.4c-.1 0-.4.1-.6.3s-.8.8-.8 1.8.8 2 1 2.3a8 8 0 0 0 3.2 2.8c1.9.8 1.9.5 2.2.5s1.2-.5 1.4-.9c.2-.4.2-.8.1-.9-.1-.1-.2-.1-.4-.2Z" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#EA4335"
        d="M12.2 10.2v3.9h5.4c-.2 1.2-1.4 3.4-5.4 3.4-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.8 2.9 14.8 2 12.2 2A10 10 0 0 0 2.2 12a10 10 0 0 0 10 10c5.8 0 9.7-4 9.7-9.8 0-.7-.1-1.2-.2-1.7h-9.5Z"
      />
      <path
        fill="#34A853"
        d="M2.2 12c0 1.6.4 3 1.2 4.4l3.4-2.6A5.8 5.8 0 0 1 6.4 12c0-.6.1-1.2.4-1.8L3.4 7.6A10.2 10.2 0 0 0 2.2 12Z"
      />
      <path
        fill="#FBBC05"
        d="M12.2 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 1-3.5 1a5.9 5.9 0 0 1-5.4-3.6l-3.4 2.6A10 10 0 0 0 12.2 22Z"
      />
      <path
        fill="#4285F4"
        d="M18.9 19.6c1.9-1.8 3-4.4 3-7.4 0-.7-.1-1.2-.2-1.7h-9.5v3.9h5.4c-.3 1.4-1.2 2.5-2 3.2l3.3 2.5Z"
      />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.3c0-3.1 1.8-4.8 4.6-4.8 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.4l-.5 3.5H14v8.4A12 12 0 0 0 24 12Z" />
    </svg>
  );
}
