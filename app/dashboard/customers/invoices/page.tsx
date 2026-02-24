export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";

export default async function CustomerInvoicesPage() {
  const renderedAt = new Date().toISOString();

  const supabase = await createClient();

  // Basic query (NO join). If this returns 0 but you KNOW you have invoices, it's almost always RLS.
  const basic = await supabase
    .from("invoices")
    .select("id, amount, status, date, customer_id")
    .order("date", { ascending: false })
    .limit(20);

  // Join query (requires FK + schema cache)
  const joined = await supabase
    .from("invoices")
    .select(`
      id,
      amount,
      status,
      date,
      customer:customers!invoices_customer_id_fkey (
        id,
        name,
        email,
        image_url
      )
    `)
    .order("date", { ascending: false })
    .limit(20);

  const invoices = (joined.data ?? []) as any[];

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer Invoices</h1>

      {/* This block tells us exactly what's happening */}
      <pre style={{ marginTop: 12, background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(
          {
            renderedAt,
            basic: {
              ok: !basic.error,
              error: basic.error?.message ?? null,
              rows: basic.data?.length ?? 0,
            },
            joined: {
              ok: !joined.error,
              error: joined.error?.message ?? null,
              rows: joined.data?.length ?? 0,
            },
          },
          null,
          2
        )}
      </pre>

      {joined.error ? (
        <p style={{ marginTop: 12, color: "crimson" }}>DB error: {joined.error.message}</p>
      ) : invoices.length === 0 ? (
        <p style={{ marginTop: 12, opacity: 0.7 }}>No invoices returned.</p>
      ) : (
        <ul style={{ marginTop: 12 }}>
          {invoices.map((inv) => {
            const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;

            return (
              <li key={inv.id} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                <div>
                  <b>{customer?.name ?? "Unknown customer"}</b>
                </div>
                <div>
                  ${(Number(inv.amount) / 100).toFixed(2)} — {inv.status}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {new Date(inv.date).toLocaleDateString()}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}