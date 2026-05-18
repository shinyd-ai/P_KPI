import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "config") {
    return "Login is not configured. Check the Vercel environment variables.";
  }

  if (error === "invalid") {
    return "The username or password does not match.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;
  const message = errorMessage(error);
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden bg-[#10233f] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-lg font-black text-[#10233f]">
              PK
            </div>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.24em] text-cyan-100">
              Personal KPI System
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-bold leading-tight">
              Goals, plans, and daily execution in one private workspace.
            </h1>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">100%</p>
              <p className="mt-1 text-sm text-cyan-50">private access</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">30d</p>
              <p className="mt-1 text-sm text-cyan-50">secure session</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">AI</p>
              <p className="mt-1 text-sm text-cyan-50">monthly review</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#10233f] text-lg font-black text-white">
                PK
              </div>
            </div>

            <div className="mb-7">
              <p className="text-sm font-semibold text-blue-700">P-KPI</p>
              <h2 className="mt-2 text-3xl font-bold">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Sign in to continue managing goals, monthly plans, and daily
                records.
              </p>
            </div>

            <LoginForm errorMessage={message} nextPath={nextPath} />

            <p className="mt-5 text-center text-xs text-zinc-500">
              Protected private deployment powered by Vercel and Turso.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
