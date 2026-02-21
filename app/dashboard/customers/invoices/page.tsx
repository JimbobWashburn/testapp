import { createClient } from "@/lib/supabase/server";

export default async function CustomerInvoicesPage() {
  const supabase = await createClient();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, amount, status, created_at, customers(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Customer Invoices</h1>
        <p>DB error: {error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer Invoices</h1>

      <ul style={{ marginTop: 12 }}>
        {invoices?.map((inv) => (
          <li key={inv.id} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
            <div><b>{inv.customers?.name ?? "Unknown customer"}</b></div>
            <div>${Number(inv.amount).toFixed(2)} — {inv.status}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {new Date(inv.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}