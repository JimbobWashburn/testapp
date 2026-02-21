"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addCustomer(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!name) redirect("/dashboard/customers?error=name");

  const { error } = await supabase.from("customers").insert({
    user_id: user.id,
    name,
    email: email || null,
  });

  if (error) redirect("/dashboard/customers?error=db");

  redirect("/dashboard/customers");
}

export async function removeCustomer(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard/customers");

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) redirect("/dashboard/customers?error=db");

  redirect("/dashboard/customers");
}