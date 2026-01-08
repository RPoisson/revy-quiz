// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <p className="text-xs tracking-[0.2em] uppercase text-black/50">
          Studio Rêvy™
        </p>

        <h1 className="font-[var(--font-playfair)] text-3xl leading-tight">
          Discover Your StyleDNA
        </h1>

        <p className="text-sm text-black/70 leading-relaxed">
          A short design quiz to reveal your French-California interior style.
        </p>

        <Link
          href="/quiz"
          className="
            inline-flex items-center justify-center
            px-6 py-3 rounded-full
            bg-black text-[#F8F5EE]
            text-sm tracking-wide
            hover:bg-black/90 transition
          "
        >
          Start the quiz
        </Link>
      </div>
    </main>
  );
}
