"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const customer_id = String(formData.get("customer_id") || "");
  const amount = Number(formData.get("amount"));
  const status = String(formData.get("status") || "Open");

  if (!customer_id || !Number.isFinite(amount) || amount <= 0) {
    redirect("/dashboard/invoices?error=invalid");
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      customer_id,
      amount,
      status, // "Open" | "Paid" | "Overdue"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect("/dashboard/invoices?error=db");
  }

  // ✅ this is the “auto-open invoice page” moment
  redirect(`/dashboard/invoices/${data.id}`);
}