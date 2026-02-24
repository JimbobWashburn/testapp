import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (Number(cents) || 0) / 100
  );
}

export default async function CustomerProfilePage({ params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id || id === "undefined") notFound();

  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, email, image_url")
    .eq("id", id)
    .maybeSingle();

  if (customerError) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer</h1>
        <p style={{ marginTop: 8, color: "crimson" }}>DB error: {customerError.message}</p>
      </main>
    );
  }
  if (!customer) return notFound();

  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, amount, status, date")
    .eq("customer_id", id)
    .order("date", { ascending: false });

  if (invoicesError) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{customer.name}</h1>
        <p style={{ marginTop: 8, color: "crimson" }}>DB error: {invoicesError.message}</p>
      </main>
    );
  }

  const list = invoices ?? [];
  const open = list.filter((i) => i.status !== "paid");
  const paid = list.filter((i) => i.status === "paid");

  const openTotal = open.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const paidTotal = paid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  return (
    <main style={{ padding: 24 }}>
      <p><Link href="/dashboard/customers">← Back to customers</Link></p>

      <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customer.image_url}
          alt={customer.name}
          style={{ width: 48, height: 48, borderRadius: 999, border: "1px solid #eee" }}
        />
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{customer.name}</h1>
          <div style={{ opacity: 0.75 }}>{customer.email}</div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ marginTop: 16, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Open invoices</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{open.length}</div>
          <div style={{ marginTop: 4, fontWeight: 700 }}>{moneyFromCents(openTotal)}</div>
        </div>

        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Paid invoices</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{paid.length}</div>
          <div style={{ marginTop: 4, fontWeight: 700 }}>{moneyFromCents(paidTotal)}</div>
        </div>
      </div>

      {/* Open list */}
      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Open</h2>
        {open.length === 0 ? (
          <p style={{ opacity: 0.7, marginTop: 8 }}>No open invoices.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
            {open.map((inv) => (
              <li key={inv.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                <Link href={`/dashboard/invoices/${inv.id}`} style={{ textDecoration: "underline", fontWeight: 700 }}>
                  Invoice #{String(inv.id).slice(0, 8)}
                </Link>
                <div style={{ marginTop: 4 }}>
                  {moneyFromCents(inv.amount)} • {new Date(inv.date).toLocaleDateString()} • {inv.status}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Paid list (small UI) */}
      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Paid</h2>
        {paid.length === 0 ? (
          <p style={{ opacity: 0.7, marginTop: 8 }}>No paid invoices.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 8, opacity: 0.85 }}>
            {paid.slice(0, 10).map((inv) => (
              <li key={inv.id} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                <Link href={`/dashboard/invoices/${inv.id}`} style={{ textDecoration: "underline" }}>
                  Invoice #{String(inv.id).slice(0, 8)}
                </Link>
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  {moneyFromCents(inv.amount)} • {new Date(inv.date).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}