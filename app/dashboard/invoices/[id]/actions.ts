"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function markInvoicePaid(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "").trim();
  if (!UUID_RE.test(id)) throw new Error(`Invalid invoice id: "${id}"`);

  const { error } = await supabase.from("invoices").update({ status: "paid" }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath(`/dashboard/invoices`);
}

export async function reopenInvoice(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "").trim();
  if (!UUID_RE.test(id)) throw new Error(`Invalid invoice id: "${id}"`);

  const { error } = await supabase.from("invoices").update({ status: "pending" }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath(`/dashboard/invoices`);
}

export async function updateInvoice(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const amountUsd = String(formData.get("amount_usd") || "").trim();

  if (!UUID_RE.test(id)) throw new Error(`Invalid invoice id: "${id}"`);
  if (!date) throw new Error("Missing invoice date.");
  if (status !== "paid" && status !== "pending") throw new Error(`Invalid status: "${status}"`);

  const amountCents = Math.round(Number(amountUsd) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    throw new Error(`Invalid amount_usd: "${amountUsd}"`);
  }

  const { error } = await supabase
    .from("invoices")
    .update({ amount: amountCents, status, date })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath(`/dashboard/invoices`);
}