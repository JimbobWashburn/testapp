import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (Number(cents) || 0) / 100
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params?.id;

  // Guard against bad URLs like /dashboard/invoices/undefined
  if (!id || id === "undefined") notFound();

  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      `
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
    `
    )
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

  // Supabase embeds sometimes type as array; handle both safely.
  const customer = Array.isArray((invoice as any).customer)
    ? (invoice as any).customer[0]
    : (invoice as any).customer;

  return (
    <main style={{ padding: 24 }}>
      <p>
        <Link href="/dashboard/invoices">← Back to invoices</Link>
      </p>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 10 }}>
        Invoice #{String(invoice.id).slice(0, 8)}
      </h1>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <div style={{ fontWeight: 700 }}>{customer?.name ?? "Unknown customer"}</div>
        <div style={{ opacity: 0.75 }}>{customer?.email ?? ""}</div>

        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          <div>
            <b>Amount:</b> {moneyFromCents((invoice as any).amount)}
          </div>
          <div>
            <b>Status:</b> {(invoice as any).status}
          </div>
          <div>
            <b>Date:</b> {new Date((invoice as any).date).toLocaleDateString()}
          </div>
        </div>
      </div>
    </main>
  );
}