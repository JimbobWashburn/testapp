import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CustomerEmbed = { name: string | null } | { name: string | null }[] | null;

function customerName(customers: CustomerEmbed) {
  if (!customers) return null;
  return Array.isArray(customers) ? customers[0]?.name ?? null : customers.name;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("invoices")
      .select("id, amount, status, created_at, customers(name)")
      .eq("amount", 666)
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows =
      (data ?? []).map((inv: any) => ({
        id: inv.id,
        amount: Number(inv.amount),
        status: inv.status,
        created_at: inv.created_at,
        customer: customerName(inv.customers) ?? "(unknown)",
      })) ?? [];

    return NextResponse.json({ rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}