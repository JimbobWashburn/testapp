"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addCustomer(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!name || !email) return;

  const { error } = await supabase.from("customers").insert({
    name,
    email,
    // image_url omitted: your schema has a DEFAULT, so it's safe
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/customers");
}

export async function removeCustomer(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/customers");
}