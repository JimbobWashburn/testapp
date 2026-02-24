import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "./actions";

function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (Number(cents) || 0) / 100
  );
}

export const dynamic = "force-dynamic";

export default async function CustomerInvoicesPage() {
  const supabase = await createClient();

  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, name, email")
    .order("name", { ascending: true });

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

  const error = customersError || invoicesError;
  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Customer Invoices</h1>
        <p style={{ marginTop: 8, color: "crimson" }}>DB error: {error.message}</p>
      </main>
    );
  }

  const customerList = customers ?? [];
  const invoiceList = invoices ?? [];

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Customer Invoices</h1>

      {/* Create Invoice */}
      <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Create Invoice</h2>

        {customerList.length === 0 ? (
          <p style={{ marginTop: 8, color: "crimson" }}>
            No customers found. Add a customer first so you can create an invoice.
          </p>
        ) : (
          <form action={createInvoice} style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 520 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Customer</span>
              <select
                name="customer_id"
                required
                defaultValue=""
                style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
              >
                <option value="" disabled>
                  Select a customer…
                </option>
                {customerList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.email ? ` (${c.email})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Amount (USD)</span>
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
              <span style={{ fontSize: 13, fontWeight: 700 }}>Status</span>
              <select
                name="status"
                required
                defaultValue="pending"
                style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Invoice Date</span>
              <input
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
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
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create invoice
            </button>
          </form>
        )}
      </section>

      {/* List */}
      <section style={{ marginTop: 18 }}>
        {invoiceList.length === 0 ? (
          <p style={{ marginTop: 12, opacity: 0.7 }}>No invoices yet.</p>
        ) : (
          <ul style={{ marginTop: 12, padding: 0, listStyle: "none" }}>
            {invoiceList.map((inv: any) => {
              // If inv.id is missing, don’t create a broken link
              if (!inv?.id) {
                return (
                  <li key={Math.random()} style={{ padding: 12, borderBottom: "1px solid #eee", color: "crimson" }}>
                    Invoice row missing id (cannot link)
                  </li>
                );
              }

              const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;

              return (
                <li key={inv.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        <Link href={`/dashboard/invoices/${inv.id}`} style={{ textDecoration: "underline" }}>
                          Invoice #{String(inv.id).slice(0, 8)}
                        </Link>
                      </div>

                      <div style={{ marginTop: 4 }}>
                        <b>{customer?.name ?? "Unknown customer"}</b>
                        <span style={{ opacity: 0.7 }}>
                          {customer?.email ? ` — ${customer.email}` : ""}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        {new Date(inv.date).toLocaleDateString()} • {inv.status}
                      </div>
                    </div>

                    <div style={{ fontWeight: 900 }}>{moneyFromCents(inv.amount)}</div>
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