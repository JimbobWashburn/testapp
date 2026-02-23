import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

if (!url || !serviceKey) throw new Error("Missing Supabase env vars");

const supabase = createClient(url, serviceKey);

async function main() {
  // Use upsert so you can run this multiple times safely
  const { error } = await supabase.from("customers").upsert(
    [
      { id: "cust_acme", name: "Acme Vet", email: "ops@acmevet.com" },
      { id: "cust_blueoak", name: "Blue Oak Animal Hospital", email: "admin@blueoak.com" },
    ],
    { onConflict: "id" }
  );

  if (error) throw error;
  console.log("Seeded customers ✅");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});