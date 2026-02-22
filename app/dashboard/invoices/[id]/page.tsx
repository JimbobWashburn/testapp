import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, amount, status, created_at, customers(name, email)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-bold">Invoice not found</h1>
        <p className="text-gray-600">{error?.message}</p>
        <Link href="/dashboard/invoices" className="text-blue-600 hover:underline">
          ← Back to invoices
        </Link>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoice</h1>
        <p className="text-gray-600 font-mono">{invoice.id}</p>
      </div>

      <div className="rounded-md border bg-white p-4 space-y-4">
        <div>
  <div className="text-sm text-gray-500">Customer</div>
  <div className="font-medium">{invoice.customers?.[0]?.name ?? "(unknown)"}</div>
  <div className="text-sm text-gray-600">{invoice.customers?.[0]?.email ?? ""}</div>
</div>

        <div className="flex gap-8">
          <div>
            <div className="text-sm text-gray-500">Amount</div>
            <div className="font-semibold">${Number(invoice.amount).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-semibold">{invoice.status}</div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Created: {new Date(invoice.created_at).toLocaleString()}
        </div>
      </div>

      <Link href="/dashboard/invoices" className="text-blue-600 hover:underline">
        ← Back to invoices
      </Link>
    </main>
  );
}