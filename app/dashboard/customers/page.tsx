import { createClient } from "@/lib/supabase/server";
import { addCustomer, removeCustomer } from "./actions";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, email, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-gray-600">Adds customers in Supabase (real DB).</p>
        {error ? (
          <p className="text-red-600 text-sm mt-2">DB error: {error.message}</p>
        ) : null}
      </div>

      <form action={addCustomer} className="rounded-md border bg-white p-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Name</div>
            <input
              className="w-full rounded-md border px-3 py-2"
              name="name"
              placeholder="Acme Vet Clinic"
              required
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Email</div>
            <input
              className="w-full rounded-md border px-3 py-2"
              name="email"
              placeholder="billing@acme.com"
            />
          </label>
        </div>

        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white">
          Add customer
        </button>
      </form>

      <div className="rounded-md border bg-white">
        <div className="border-b p-3 font-medium">Customer list</div>

        {!customers || customers.length === 0 ? (
          <div className="p-3 text-gray-600">No customers yet.</div>
        ) : (
          <ul className="divide-y">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-600">{c.email ?? ""}</div>
                </div>

                <form action={removeCustomer}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}