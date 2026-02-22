import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If env vars aren't set, don't crash the whole app
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies for this request lifecycle
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          // Create a fresh response and set cookies on it for the browser
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh/validate session
    await supabase.auth.getClaims();

    return response;
  } catch (err) {
    console.error("updateSession failed:", err);
    return NextResponse.next({ request });
  }
}