import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markInvoicePaid(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("invoices").update({ status: "paid" }).eq("id", id);
}

export async function reopenInvoice(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("invoices").update({ status: "pending" }).eq("id", id);
}

export async function updateInvoice(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const amountUsd = String(formData.get("amount_usd") ?? "0");
  const status = String(formData.get("status") ?? "pending");
  const date = String(formData.get("date") ?? new Date().toISOString());
  const amount = Math.round((Number(amountUsd) || 0) * 100);
  const supabase = await createClient();
  await supabase.from("invoices").update({ amount, status, date }).eq("id", id);
}

export const dynamic = "force-dynamic";

function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (Number(cents) || 0) / 100
  );
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id || id === "undefined") notFound();

  const supabase = await createClient();

  const { data: invoice, error } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Invoice</h1>
        <p style={{ marginTop: 8, color: "crimson" }}>DB error: {error.message}</p>
        <p style={{ marginTop: 12 }}>
          <Link href="/dashboard/invoices">← Back to invoices</Link>
        </p>
      </main>
    );
  }

  if (!invoice) return notFound();

  const customer = Array.isArray((invoice as any).customer)
    ? (invoice as any).customer[0]
    : (invoice as any).customer;

  const isPaid = invoice.status === "paid";
  const amountUsdDefault = ((Number(invoice.amount) || 0) / 100).toFixed(2);

  return (
    <main style={{ padding: 24, display: "grid", gap: 14 }}>
      <p>
        <Link href="/dashboard/invoices">← Back to invoices</Link>
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          Invoice #{String(invoice.id).slice(0, 8)}
        </h1>
        <div style={{ fontWeight: 800 }}>{moneyFromCents(invoice.amount)}</div>
      </div>

      <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <div style={{ fontWeight: 700 }}>{customer?.name ?? "Unknown customer"}</div>
        <div style={{ opacity: 0.75 }}>{customer?.email ?? ""}</div>

        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          <div>
            <b>Status:</b> {invoice.status}
          </div>
          <div>
            <b>Date:</b> {new Date(invoice.date).toLocaleDateString()}
          </div>
        </div>

        {/* Quick actions */}
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
                  fontWeight: 600,
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
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reopen (Pending)
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Editable invoice form */}
      <section style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Edit Invoice</h2>

        <form action={updateInvoice} style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 520 }}>
          <input type="hidden" name="id" value={invoice.id} />

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Amount (USD)</span>
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
            <span style={{ fontSize: 13, fontWeight: 600 }}>Status</span>
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
            <span style={{ fontSize: 13, fontWeight: 600 }}>Invoice Date</span>
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
              fontWeight: 600,
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