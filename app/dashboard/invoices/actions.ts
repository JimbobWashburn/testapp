"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();

  const customer_id = String(formData.get("customer_id") || "").trim();
  const status = String(formData.get("status") || "pending").trim();
  const date = String(formData.get("date") || "").trim();

  // Amount entered in USD; store as cents (integer)
  const amountUsdRaw = String(formData.get("amount_usd") || "").trim();
  const amountCents = Math.round(Number(amountUsdRaw) * 100);

  if (!customer_id) throw new Error("Missing customer_id");
  if (!date) throw new Error("Missing date");
  if (!Number.isFinite(amountCents) || amountCents < 0) throw new Error("Invalid amount");

  const { error } = await supabase.from("invoices").insert({
    customer_id,
    amount: amountCents,
    status,
    date,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/invoices");
}