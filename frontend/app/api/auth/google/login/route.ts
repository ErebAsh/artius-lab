import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Google authentication is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY on the server in .env.",
      },
      { status: 500 }
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    return NextResponse.json(
      { error: error?.message || "Failed to initialize Google authentication" },
      { status: 400 }
    );
  }

  return NextResponse.redirect(data.url);
}
