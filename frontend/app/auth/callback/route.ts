import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.session?.user) {
        // Optionally sync with backend
        const apiBase = process.env.BACKEND_URL || "http://127.0.0.1:8000";
        try {
          await fetch(`${apiBase}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.session.user.email,
              full_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || "",
              avatar_url: data.session.user.user_metadata?.avatar_url || data.session.user.user_metadata?.picture || null,
              contact_no: data.session.user.user_metadata?.contact_no || null,
              sub: data.session.user.id,
            }),
          });
        } catch {
          // Non-blocking sync error
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return to root with login modal open or error parameter if failure
  return NextResponse.redirect(`${origin}/?auth_error=true`);
}
