/** Deterministic avatar image from username (Vercel avatar API). */
export function vercelAvatarUrl(username: string): string {
  return `https://vercel.com/api/www/avatar?u=${encodeURIComponent(username)}`;
}
