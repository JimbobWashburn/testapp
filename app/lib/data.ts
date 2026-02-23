import "server-only";
import { createClient } from "@/lib/supabase/server";

const ITEMS_PER_PAGE = 6;
const DEFAULT_AVATAR = "/customers/default.png";

type CustomerEmbed = {
  name: string | null;
  email: string | null;
  image_url?: string | null;
};

function pickCustomer(c: CustomerEmbed | CustomerEmbed[] | null | undefined) {
  if (!c) return null;
  return Array.isArray(c) ? c[0] ?? null : c;
}

function titleCaseStatus(s: string) {
  const v = s.toLowerCase();
  if (v === "open") return "Open";
  if (v === "paid") return "Paid";
  if (v === "overdue") return "Overdue";
  return s;
}

export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const supabase = await createClient();
  const q = (query ?? "").trim();
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let builder = supabase
    .from("invoices")
    .select(
      "id, amount, status, created_at, customer_id, customers(name,email,image_url)"
    )
    .order("created_at", { ascending: false });

  try {
    if (q) {
      const status = ["open", "paid", "overdue"].includes(q.toLowerCase())
        ? titleCaseStatus(q)
        : null;

      const { data: custRows } = await supabase
        .from("customers")
        .select("id")
        .or(`name.ilike.%${q}%,email.ilike.%${q}%`);

      const custIds = (custRows ?? []).map((r: any) => r.id);

      if (custIds.length > 0) {
        builder = builder.in("customer_id", custIds);
      } else if (status) {
        builder = builder.eq("status", status);
      } else {
        const asNum = Number(q);
        if (Number.isFinite(asNum)) builder = builder.eq("amount", asNum);
        else return [];
      }
    }

    const { data, error } = await builder.range(from, to);
    if (error) return [];

    return (data ?? []).map((inv: any) => {
      const c = pickCustomer(inv.customers);
      return {
        id: inv.id,
        amount: Number(inv.amount),
        status: inv.status,
        date: inv.created_at, // UI expects `date`
        name: c?.name ?? "(unknown)",
        email: c?.email ?? "",
        // ✅ ALWAYS a string so Next/Image + LatestInvoice typings are happy
        image_url: c?.image_url ?? DEFAULT_AVATAR,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchInvoicesPages(query: string) {
  const supabase = await createClient();
  const q = (query ?? "").trim();

  let builder = supabase
    .from("invoices")
    .select("id, customer_id, status, amount", { count: "exact", head: true });

  try {
    if (q) {
      const status = ["open", "paid", "overdue"].includes(q.toLowerCase())
        ? titleCaseStatus(q)
        : null;

      const { data: custRows } = await supabase
        .from("customers")
        .select("id")
        .or(`name.ilike.%${q}%,email.ilike.%${q}%`);

      const custIds = (custRows ?? []).map((r: any) => r.id);

      if (custIds.length > 0) {
        builder = builder.in("customer_id", custIds);
      } else if (status) {
        builder = builder.eq("status", status);
      } else {
        const asNum = Number(q);
        if (Number.isFinite(asNum)) builder = builder.eq("amount", asNum);
        else return 0;
      }
    }

    const { count } = await builder;
    const total = count ?? 0;
    return Math.ceil(total / ITEMS_PER_PAGE);
  } catch {
    return 0;
  }
}

export async function fetchLatestInvoices() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("id, amount, customers(name,email,image_url)")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return [];

  return (data ?? []).map((inv: any) => {
    const c = pickCustomer(inv.customers);
    return {
      id: inv.id,
      amount: Number(inv.amount),
      name: c?.name ?? "(unknown)",
      email: c?.email ?? "",
      // ✅ ALWAYS a string
      image_url: c?.image_url ?? DEFAULT_AVATAR,
    };
  });
}

export async function fetchCustomers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, email, image_url")
    .order("name", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function fetchFilteredCustomers(query: string) {
  const supabase = await createClient();
  const q = (query ?? "").trim();

  let builder = supabase
    .from("customers")
    .select("id, name, email, image_url")
    .order("name", { ascending: true });

  if (q) builder = builder.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await builder;
  if (error) return [];
  return data ?? [];
}

// If your dashboard references these, return safe defaults so nothing crashes.
export async function fetchRevenue() {
  return [];
}

export async function fetchCardData() {
  const supabase = await createClient();

  const { count: customerCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true });

  const { data: invs } = await supabase.from("invoices").select("amount,status");

  const invoices = invs ?? [];
  const numberOfInvoices = invoices.length;
  const numberOfCustomers = customerCount ?? 0;

  let totalPaidInvoices = 0;
  let totalPendingInvoices = 0;

  for (const inv of invoices as any[]) {
    const amt = Number(inv.amount) || 0;
    if (String(inv.status).toLowerCase() === "paid") totalPaidInvoices += amt;
    else totalPendingInvoices += amt;
  }

  return {
    numberOfCustomers,
    numberOfInvoices,
    totalPaidInvoices,
    totalPendingInvoices,
  };
}