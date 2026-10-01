const DEFAULT_YOUTUBE_URL = "https://www.youtube.com/@MentorLagbe";
const DEFAULT_FACEBOOK_URL = "https://www.facebook.com/mentorlagbe";

export function getYoutubeUrl(): string {
  const url = process.env.NEXT_PUBLIC_YOUTUBE_URL?.trim();
  return url && url.length > 0 ? url : DEFAULT_YOUTUBE_URL;
}

export function getFacebookUrl(): string {
  const url = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim();
  return url && url.length > 0 ? url : DEFAULT_FACEBOOK_URL;
}

export function isExternalSocialUrl(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
