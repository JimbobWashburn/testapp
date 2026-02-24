"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();

  const customer_id = String(formData.get("customer_id") || "").trim();
  const status = String(formData.get("status") || "pending").trim();
  const date = String(formData.get("date") || "").trim();
  const amountUsd = String(formData.get("amount_usd") || "").trim();

  if (!UUID_RE.test(customer_id)) throw new Error(`Invalid customer_id: "${customer_id}"`);
  if (!date) throw new Error("Missing invoice date.");
  if (status !== "paid" && status !== "pending") throw new Error(`Invalid status: "${status}"`);

  const amountCents = Math.round(Number(amountUsd) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    throw new Error(`Invalid amount_usd: "${amountUsd}"`);
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({ customer_id, amount: amountCents, status, date })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices/${data.id}`);
}