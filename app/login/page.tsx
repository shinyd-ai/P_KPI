import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "config") {
    return "Login is not configured.";
  }

  if (error === "invalid") {
    return "Invalid username or password.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const message = errorMessage(error);

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-700">P-KPI</p>
          <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Enter the private account credentials to continue.
          </p>
        </div>

        <form
          action={login}
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Username
              </span>
              <input
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                name="username"
                type="text"
                autoComplete="username"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Password
              </span>
              <input
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          {message && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          )}

          <button
            className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
