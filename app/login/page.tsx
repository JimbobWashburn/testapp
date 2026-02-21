import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const error = sp.error;

  return (
    <main className="p-6 max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>

      {error ? (
        <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>
      ) : null}

      <form className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Email</div>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2"
            placeholder="you@email.com"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Password</div>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-md border px-3 py-2"
            placeholder="At least 6 characters"
          />
        </div>

        <div className="flex gap-2">
          <button
            formAction={login}
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Log in
          </button>

          <button formAction={signup} className="rounded-md border px-4 py-2">
            Sign up
          </button>
        </div>
      </form>
    </main>
  );
}