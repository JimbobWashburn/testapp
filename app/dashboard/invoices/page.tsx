import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "./actions";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email")
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, amount, status, created_at, customers(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-gray-600">Creates invoices in Supabase (real DB).</p>
      </div>

      {!customers || customers.length === 0 ? (
        <div className="rounded-md border bg-white p-4">
          <p className="text-gray-700">
            Add a customer first on <strong>/dashboard/customers</strong>.
          </p>
        </div>
      ) : (
        <form action={createInvoice} className="rounded-md border bg-white p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <div className="text-sm font-medium">Customer</div>
              <select className="w-full rounded-md border px-3 py-2" name="customer_id" defaultValue={customers[0].id}>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Amount</div>
              <input className="w-full rounded-md border px-3 py-2" name="amount" defaultValue="99.00" inputMode="decimal" />
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Status</div>
              <select className="w-full rounded-md border px-3 py-2" name="status" defaultValue="Open">
                <option>Open</option>
                <option>Paid</option>
                <option>Overdue</option>
              </select>
            </label>
          </div>

          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white">
            Create invoice
          </button>
        </form>
      )}

      <div className="rounded-md border bg-white">
        <div className="border-b p-3 font-medium">Invoice list</div>

        {!invoices || invoices.length === 0 ? (
          <div className="p-3 text-gray-600">No invoices yet.</div>
        ) : (
          <ul className="divide-y">
            {invoices.map((inv: any) => (
              <li key={inv.id} className="p-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/dashboard/invoices/${inv.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {inv.id}
                    </Link>

                    <div className="text-gray-700">{inv.customers?.name ?? "(unknown)"}</div>
                    <div className="text-gray-700">${Number(inv.amount).toFixed(2)}</div>
                    <div className="rounded-full bg-gray-100 px-2 py-0.5 text-sm">
                      {inv.status}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(inv.created_at).toLocaleString()}
                  </div>
                </div>

                <Link
                  href={`/dashboard/invoices/${inv.id}`}
                  className="text-blue-600 hover:underline whitespace-nowrap"
                >
                  View →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}