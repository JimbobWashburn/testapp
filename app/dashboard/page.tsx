export default function DashboardPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <ul>
        <li><a href="/dashboard/customers">Customers</a></li>
        <li><a href="/dashboard/invoices">Invoices</a></li>

      </ul>
    </main>
  );
}