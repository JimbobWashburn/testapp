import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type CustomerEmbed = {
  name: string | null;
  email?: string | null;
};

type InvoiceRow = {
  id: string;
  amount: number | string;
  status: string;
  created_at: string;
  customers: CustomerEmbed | CustomerEmbed[] | null;
};

function getCustomer(inv: InvoiceRow): CustomerEmbed | null {
  if (!inv.customers) return null;
  return Array.isArray(inv.customers) ? inv.customers[0] ?? null : inv.customers;
}

export default async function CustomerInvoicesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("id, amount, status, created_at, customers(name,email)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Customer Invoices</h1>
        <p>DB error: {error.message}</p>
        <Link href="/dashboard/invoices">← Back to invoices</Link>
      </main>
    );
  }

  const invoices = (data ?? []) as InvoiceRow[];

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer Invoices</h1>

      <ul style={{ marginTop: 12 }}>
        {invoices.map((inv) => {
          const customer = getCustomer(inv);
          const customerName = customer?.name ?? "Unknown customer";

          return (
            <li key={inv.id} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
              <div>
                <b>{customerName}</b>
              </div>
              <div>
                ${Number(inv.amount).toFixed(2)} — {inv.status}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {new Date(inv.created_at).toLocaleString()}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}