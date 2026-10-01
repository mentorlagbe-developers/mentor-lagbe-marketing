export function getYoutubeUrl(): string {
  const url = process.env.NEXT_PUBLIC_YOUTUBE_URL?.trim();
  return url && url.length > 0 ? url : "#";
}

export function getFacebookUrl(): string {
  const url = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim();
  return url && url.length > 0 ? url : "#";
}

export function isExternalSocialUrl(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
