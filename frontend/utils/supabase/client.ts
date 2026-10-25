/**
 * Client-side direct Supabase access has been deprecated in favor of secure
 * server-side proxy route handlers (/api/auth/google/login).
 * This prevents leaking API keys or backend URLs in client-side bundles (NEXT_PUBLIC_).
 */
export function createClient() {
  return null;
}
