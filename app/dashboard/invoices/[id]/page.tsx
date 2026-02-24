import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markInvoicePaid, reopenInvoice, updateInvoice } from "./actions";

export const dynamic = "force-dynamic";

function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (Number(cents) || 0) / 100
  );
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const id = params?.id;

  // Don’t hard-404 on bad ids; show a friendly message instead.
  if (!id || id === "undefined") {
    return (
      <main style={{ padding: 24 }}>
        <p>
          <Link href="/dashboard/invoices">← Back to invoices</Link>
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>Invoice</h1>
        <p style={{ marginTop: 8, color: "crimson" }}>Invalid invoice id in URL.</p>
      </main>
    );
  }

  const supabase = await createClient();

  // 1) Fetch invoice WITHOUT join first (more reliable for debugging/RLS).
  const basic = await supabase
    .from("invoices")
    .select("id, customer_id, amount, status, date")
    .eq("id", id)
    .maybeSingle();

  if (basic.error) {
    return (
      <main style={{ padding: 24 }}>
        <p>
          <Link href="/dashboard/invoices">← Back to invoices</Link>
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>Invoice</h1>
        <p style={{ marginTop: 8, color: "crimson" }}>DB error: {basic.error.message}</p>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          Invoice ID: <span style={{ fontFamily: "monospace" }}>{id}</span>
        </div>
      </main>
    );
  }

  // If invoice isn’t returned, don’t 404. Show what’s happening.
  if (!basic.data) {
    return (
      <main style={{ padding: 24 }}>
        <p>
          <Link href="/dashboard/invoices">← Back to invoices</Link>
        </p>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>Invoice not available</h1>

        <p style={{ marginTop: 8, color: "crimson" }}>
          No invoice returned for id:
          <span style={{ fontFamily: "monospace" }}> {id}</span>
        </p>

        <p style={{ marginTop: 10, opacity: 0.85 }}>
          Most common causes:
          <br />• Invoice doesn’t exist
          <br />• RLS is blocking SELECT on <b>invoices</b>
          <br />• Your app is pointing at a different Supabase project (env vars)
        </p>
      </main>
    );
  }

  const invoice = basic.data;

  // 2) Fetch customer separately (avoid join relationship/cache issues).
  const customerRes = await supabase
    .from("customers")
    .select("id, name, email, image_url")
    .eq("id", invoice.customer_id)
    .maybeSingle();

  const customer = customerRes.data ?? null;

  const isPaid = invoice.status === "paid";
  const amountUsdDefault = ((Number(invoice.amount) || 0) / 100).toFixed(2);

  return (
    <main style={{ padding: 24, display: "grid", gap: 14 }}>
      <p>
        <Link href="/dashboard/invoices">← Back to invoices</Link>
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          Invoice #{String(invoice.id).slice(0, 8)}
        </h1>
        <div style={{ fontWeight: 900 }}>{moneyFromCents(invoice.amount)}</div>
      </div>

      <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <div style={{ fontWeight: 800 }}>{customer?.name ?? "Unknown customer"}</div>
        <div style={{ opacity: 0.75 }}>{customer?.email ?? ""}</div>

        {customerRes.error ? (
          <div style={{ marginTop: 6, color: "crimson", fontSize: 12 }}>
            Customer lookup error: {customerRes.error.message}
          </div>
        ) : null}

        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          <div>
            <b>Status:</b> {invoice.status}
          </div>
          <div>
            <b>Date:</b> {new Date(invoice.date).toLocaleDateString()}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Invoice ID: <span style={{ fontFamily: "monospace" }}>{invoice.id}</span>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!isPaid ? (
            <form action={markInvoicePaid}>
              <input type="hidden" name="id" value={invoice.id} />
              <button
                type="submit"
                style={{
                  padding: "10px 12px",
                  background: "#16a34a",
                  color: "white",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Mark Paid
              </button>
            </form>
          ) : (
            <form action={reopenInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <button
                type="submit"
                style={{
                  padding: "10px 12px",
                  background: "#f59e0b",
                  color: "white",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reopen (Pending)
              </button>
            </form>
          )}
        </div>
      </div>

      <section style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800 }}>Edit Invoice</h2>

        <form action={updateInvoice} style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 520 }}>
          <input type="hidden" name="id" value={invoice.id} />

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Amount (USD)</span>
            <input
              name="amount_usd"
              type="number"
              step="0.01"
              min="0"
              defaultValue={amountUsdDefault}
              required
              style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Status</span>
            <select
              name="status"
              defaultValue={invoice.status}
              required
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
              defaultValue={new Date(invoice.date).toISOString().slice(0, 10)}
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
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Save changes
          </button>
        </form>
      </section>
    </main>
  );
}