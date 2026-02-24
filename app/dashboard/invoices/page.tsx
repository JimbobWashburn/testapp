import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "./actions";

function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (Number(cents) || 0) / 100
  );
}

export default async function CustomerInvoicesPage() {
  const supabase = await createClient();

  // Customers for dropdown
  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, name, email")
    .order("name", { ascending: true });

  // Invoices list (join customers via FK)
  const { data: invoices, error: invoicesError } = await supabase
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

  const error = invoicesError || customersError;
  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer Invoices</h1>
        <p style={{ marginTop: 8, color: "crimson" }}>DB error: {error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer Invoices</h1>

      {/* Create Invoice */}
      <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Create Invoice</h2>

        <form action={createInvoice} style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 520 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Customer</span>
            <select name="customer_id" required style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}>
              <option value="">Select a customer…</option>
              {(customers ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.email ? `(${c.email})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Amount (USD)</span>
            <input
              name="amount_usd"
              type="number"
              step="0.01"
              min="0"
              placeholder="125.00"
              required
              style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            />
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              Stored as cents in DB (e.g. $125.00 → 12500).
            </span>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Status</span>
            <select name="status" required style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Invoice Date</span>
            <input
              name="date"
              type="date"
              required
              style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            />
          </label>

          <button
            type="submit"
            style={{
              padding: "10px 12px",
              background: "#2563eb",
              color: "white",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create invoice
          </button>
        </form>
      </section>

      {/* List */}
      <section style={{ marginTop: 18 }}>
        {!invoices || invoices.length === 0 ? (
          <p style={{ marginTop: 12, opacity: 0.7 }}>No invoices yet.</p>
        ) : (
          <ul style={{ marginTop: 12, padding: 0, listStyle: "none" }}>
            {invoices.map((inv: any) => {
              const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;

              return (
                <li key={inv.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        <Link href={`/dashboard/invoices/${inv.id}`} style={{ textDecoration: "underline" }}>
                          Invoice #{String(inv.id).slice(0, 8)}
                        </Link>
                      </div>

                      <div style={{ marginTop: 4 }}>
                        <b>{customer?.name ?? "Unknown customer"}</b>
                        <span style={{ opacity: 0.7 }}>{customer?.email ? ` — ${customer.email}` : ""}</span>
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        {new Date(inv.date).toLocaleDateString()} • {inv.status}
                      </div>
                    </div>

                    <div style={{ fontWeight: 800 }}>{moneyFromCents(inv.amount)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}