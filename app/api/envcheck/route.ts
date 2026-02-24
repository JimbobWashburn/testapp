import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Debug env presence (don’t leak keys)
  if (!url || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        env: {
          hasUrl: !!url,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        },
        message:
          "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY).",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(url, anonKey);

  // NOTE: This join requires a real FK relationship in your DB
  const { data, error } = await supabase
    .from("invoices")
    .select(
      `id, amount, status, date,
       customer:customers!invoices_customer_id_fkey (name, email, image_url)`
    )
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message, hint: error.hint ?? null },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, invoices: data });
}