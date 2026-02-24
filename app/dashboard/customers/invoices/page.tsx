import { createClient } from "@/lib/supabase/server";

export default async function CustomerInvoicesPage() {
  // 1) Prove the page is executing at all
  const renderedAt = new Date().toISOString();

  // 2) Prove env vars exist (won't leak secrets)
  const env = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  // 3) Create client safely
  let supabase: any;
  try {
    supabase = await createClient();
  } catch (e: any) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer Invoices</h1>
        <p style={{ marginTop: 8, color: "crimson" }}>
          Failed to create Supabase client: {e?.message ?? String(e)}
        </p>
        <pre style={{ marginTop: 12, background: "#f6f6f6", padding: 12 }}>
          {JSON.stringify({ renderedAt, env }, null, 2)}
        </pre>
      </main>
    );
  }

  // 4) Run a BASIC query (no join) to isolate RLS / connectivity
  const basic = await supabase
    .from("invoices")
    .select("id, amount, status, date, customer_id")
    .order("date", { ascending: false })
    .limit(50);

  // 5) Run the JOIN query (requires FK + schema cache)
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
    .limit(50);

  const invoices = (joined.data ?? []) as any[];

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer Invoices</h1>

      <pre style={{ marginTop: 12, background: "#f6f6f6", padding: 12 }}>
        {JSON.stringify(
          {
            renderedAt,
            env,
            basic: {
              ok: !basic.error,
              error: basic.error?.message ?? null,
              count: basic.data?.length ?? 0,
            },
            joined: {
              ok: !joined.error,
              error: joined.error?.message ?? null,
              count: joined.data?.length ?? 0,
            },
          },
          null,
          2
        )}
      </pre>

      {joined.error ? (
        <p style={{ marginTop: 12, color: "crimson" }}>
          JOIN failed: {joined.error.message}
        </p>
      ) : !invoices.length ? (
        <p style={{ marginTop: 12, opacity: 0.7 }}>No invoices yet.</p>
      ) : (
        <ul style={{ marginTop: 12 }}>
          {invoices.map((inv) => {
            // Handle either object OR array shape safely
            const customer = Array.isArray(inv.customer)
              ? inv.customer[0]
              : inv.customer;

            return (
              <li
                key={inv.id}
                style={{ padding: 10, borderBottom: "1px solid #eee" }}
              >
                <div>
                  <b>{customer?.name ?? "Unknown customer"}</b>
                </div>

                {/* If amount is dollars already, remove / 100 */}
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