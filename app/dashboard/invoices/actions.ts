"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();

  const rawCustomerId = formData.get("customer_id");
  const rawAmountUsd = formData.get("amount_usd");
  const rawStatus = formData.get("status");
  const rawDate = formData.get("date");

  const customer_id = typeof rawCustomerId === "string" ? rawCustomerId.trim() : "";
  const status = typeof rawStatus === "string" ? rawStatus.trim() : "pending";
  const date = typeof rawDate === "string" ? rawDate.trim() : "";
  const amountUsd = typeof rawAmountUsd === "string" ? rawAmountUsd.trim() : "";

  if (!customer_id) throw new Error("Pick a customer (customer_id missing).");
  if (customer_id === "undefined" || !UUID_RE.test(customer_id)) {
    throw new Error(`Invalid customer_id: "${customer_id}"`);
  }

  if (!date) throw new Error("Pick an invoice date.");

  const amountCents = Math.round(Number(amountUsd) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    throw new Error(`Invalid amount_usd: "${amountUsd}"`);
  }

  const { error } = await supabase.from("invoices").insert({
    customer_id,
    amount: amountCents,
    status,
    date,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/invoices");
}