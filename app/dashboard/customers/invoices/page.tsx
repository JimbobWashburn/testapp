import { createClient } from "@/lib/supabase/server";

export default async function CustomerInvoicesPage() {
  const supabase = await createClient();

  const { data: invoices, error } = await supabase
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
    .order("date", { ascending: false });

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

      {!invoices || invoices.length === 0 ? (
        <p style={{ marginTop: 12, opacity: 0.7 }}>No invoices yet.</p>
      ) : (
        <ul style={{ marginTop: 12 }}>
          {invoices.map((inv) => {
            // Supabase embedded relations often type as arrays; use first item.
            const customer = inv.customer?.[0];

            return (
              <li
                key={inv.id}
                style={{ padding: 10, borderBottom: "1px solid #eee" }}
              >
                <div>
                  <b>{customer?.name ?? "Unknown customer"}</b>
                </div>

                {/* If your amount is stored in dollars already, remove the / 100 */}
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