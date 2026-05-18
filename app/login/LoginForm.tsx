"use client";

import { useState } from "react";

type LoginFormProps = {
  errorMessage: string | null;
  nextPath: string;
};

export default function LoginForm({ errorMessage, nextPath }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action="/api/login"
      method="post"
      onSubmit={(event) => {
        event.currentTarget.action = "/api/login";
        setIsSubmitting(true);
      }}
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
    >
      <input name="next" type="hidden" value={nextPath} />

      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-zinc-800">
            Username
          </span>
          <input
            className="mt-2 h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            name="username"
            type="text"
            autoComplete="username"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-zinc-800">
            Password
          </span>
          <input
            className="mt-2 h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
      </div>

      {errorMessage && (
        <p className="mt-5 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        className="mt-6 h-12 w-full rounded-md bg-[#155dfc] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#1447e6] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-zinc-400"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
