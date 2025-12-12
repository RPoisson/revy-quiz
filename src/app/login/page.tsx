// src/app/login/page.tsx
"use client";

import { useMemo, useState } from "react";

export default function LoginPage() {
  const EXPECTED_PASSWORD = useMemo(
    () => process.env.NEXT_PUBLIC_QUIZ_PASSWORD ?? "",
    []
  );

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!EXPECTED_PASSWORD) {
        setError("Password is not configured on this deployment.");
        setIsSubmitting(false);
        return;
      }

      if (!password) {
        setError("Password is required");
        setIsSubmitting(false);
        return;
      }

      if (password !== EXPECTED_PASSWORD) {
        setError("Incorrect password");
        setIsSubmitting(false);
        return;
      }

      window.sessionStorage.setItem("revy_quiz_authed", "1");
      window.location.href = "/quiz";
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  // If env is missing, show a clear message (no hard crash)
  if (!EXPECTED_PASSWORD) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-3 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-black/50">
            Studio Rêvy™
          </p>
          <h1 className="font-[var(--font-playfair)] text-xl">
            Password not configured
          </h1>
          <p className="text-xs text-black/60">
            Set <span className="font-mono">NEXT_PUBLIC_QUIZ_PASSWORD</span> in
            Vercel Environment Variables (Production).
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-black/50">
            Studio Rêvy™
          </p>
          <h1 className="font-[var(--font-playfair)] text-xl">
            Enter style quiz
          </h1>
          <p className="text-xs text-black/60">
            This preview is password-protected.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-black/70"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-black/20 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full rounded-full bg-black text-[#F8F5EE] text-sm py-2 disabled:opacity-40 hover:bg-black/90 transition"
          >
            {isSubmitting ? "Checking..." : "Enter"}
          </button>

          <p className="text-[10px] text-black/40 text-center">
            In private browsing, this login is per-tab and may reset if the tab
            is closed.
          </p>
        </form>
      </div>
    </main>
  );
}
