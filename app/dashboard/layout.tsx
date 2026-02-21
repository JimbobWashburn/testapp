import NavLinks from "../ui/dashboard/nav-links";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:flex">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r p-4 bg-green-100">
        <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
        <nav className="flex flex-col gap-2">
          <NavLinks />
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}