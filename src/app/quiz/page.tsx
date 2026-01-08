// src/app/quiz/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { QUESTIONS, Question, Option } from "@/questions";
import { scoreQuiz, Answers as ScoringAnswers } from "@/app/scoring";
import { generateResultText, GeneratedResultText } from "@/app/resultText";

type QuizAnswers = Record<string, string[]>;

function pruneInvalidAnswers(allAnswers: QuizAnswers): QuizAnswers {
  let changed = false;
  const next: QuizAnswers = { ...allAnswers };

  for (const q of QUESTIONS) {
    const current = allAnswers[q.id];
    if (!current || current.length === 0) continue;

    // If the entire question is hidden, clear its answers.
    if (q.showIf && !q.showIf(allAnswers)) {
      next[q.id] = [];
      changed = true;
      continue;
    }

    const visibleOptionIds = new Set(
      q.options
        .filter((opt) => (opt.showIf ? opt.showIf(allAnswers) : true))
        .map((opt) => opt.id)
    );

    const pruned = current.filter((id) => visibleOptionIds.has(id));
    if (pruned.length !== current.length) {
      next[q.id] = pruned;
      changed = true;
    }
  }

  return changed ? next : allAnswers;
}

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [completed, setCompleted] = useState(false);

  const total = QUESTIONS.length;
  const question = QUESTIONS[step];

  // Defensive guard
  const safeProgress = total > 0 ? ((step + 1) / total) * 100 : 0;
  const isLast = step === total - 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function toggleOption(q: Question, optionId: string) {
    setAnswers((prev) => {
      const current = prev[q.id] ?? [];
      let updated: QuizAnswers;

      if (q.allowMultiple) {
        const exists = current.includes(optionId);
        const nextSelected = exists
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        updated = { ...prev, [q.id]: nextSelected };
      } else {
        updated = { ...prev, [q.id]: [optionId] };
      }

      if (q.id === "home_exterior_style") {
        return pruneInvalidAnswers(updated);
      }

      return updated;
    });
  }

  function handleNext() {
    if (!question) return;
    if (!isLast) setStep((s) => s + 1);
    else setCompleted(true);
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  const canGoNext = useMemo(() => {
    if (!question) return false;
    const current = answers[question.id] ?? [];
    return question.required ? current.length > 0 : true;
  }, [answers, question]);

  if (!question && !completed) {
    return (
      <main className="min-h-screen flex justify-center items-center px-4 py-10">
        <div className="w-full max-w-md text-center space-y-3">
          <p className="text-xs tracking-[0.2em] uppercase text-black/50">
            Studio Rêvy™
          </p>
          <h1 className="font-[var(--font-playfair)] text-xl">
            Something went wrong
          </h1>
          <p className="text-sm text-black/70">
            Please refresh the page to restart your style quiz.
          </p>
        </div>
      </main>
    );
  }

  if (completed) {
    const scoringAnswers = answers as ScoringAnswers;
    const styleResult = scoreQuiz(scoringAnswers);
    const resultText: GeneratedResultText = generateResultText(
      styleResult,
      scoringAnswers
    );

    const { roomDesign, title, description } = resultText;

    return (
      <main className="min-h-screen flex justify-center px-4 pt-6 pb-24 md:py-10">
        <div className="w-full max-w-xl flex flex-col gap-6">
          <p className="text-xs tracking-[0.2em] uppercase text-black/50">
            Studio Rêvy
          </p>

          <h1 className="font-[var(--font-playfair)] text-xl md:text-2xl leading-snug">
            What&apos;s your Style?
          </h1>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-black/50">
              Room Design
            </h2>
            <div className="text-sm text-black/80 space-y-1">
              {roomDesign.primaryUserLabel && (
                <div>{roomDesign.primaryUserLabel}</div>
              )}
              {roomDesign.vanityLabel && <div>{roomDesign.vanityLabel}</div>}
              {roomDesign.bathingLabel && <div>{roomDesign.bathingLabel}</div>}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-black/50">
              Title
            </h2>
            <p className="text-lg text-black">{title}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-black/50">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-black/80">
              {description}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex justify-center px-4 py-4 md:py-10">
      <div className="w-full max-w-md md:max-w-xl flex flex-col gap-6">
        <header className="space-y-2">
          <div className="h-1 w-full bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-black/60">
            <span>
              Question {step + 1} of {total}
            </span>
            <span>Studio RêvyTM</span>
          </div>
        </header>

        <section className="space-y-2">
          <h1 className="font-[var(--font-playfair)] text-2xl leading-snug">
            {question!.title}
          </h1>
          {question!.subtitle && (
            <p className="text-xs md:text-sm text-black/70">
              {question!.subtitle}
            </p>
          )}
        </section>

        <section className="mt-2">
          <QuestionOptions
            question={question!}
            selected={answers[question!.id] ?? []}
            onSelect={toggleOption}
            answers={answers}
          />
        </section>

        <footer className="mt-auto pt-4">
          <div
            className="
              fixed inset-x-0 bottom-0 z-20 bg-[#F8F5EE]/95 border-t border-black/10 px-4 py-3
              md:static md:bg-transparent md:border-t-0 md:px-0 md:py-0
              md:flex md:items-center md:justify-between
            "
          >
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="w-full md:w-auto text-xs md:text-sm px-4 py-2 rounded-full border border-black/20 disabled:opacity-40 bg-transparent hover:bg-black/5 transition"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="mt-2 md:mt-0 w-full md:w-auto text-xs md:text-sm px-6 py-2 rounded-full bg-black text-[#F8F5EE] disabled:opacity-40 hover:bg-black/90 transition"
            >
              {isLast ? "See my style" : "Next"}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
function QuestionOptions({
  question,
  selected,
  onSelect,
  answers,
}: {
  question: Question;
  selected: string[];
  onSelect: (q: Question, optionId: string) => void;
  answers: QuizAnswers;
}) {
  const isExterior = question.id === "home_exterior_style";

  const visibleOptions = useMemo(() => {
    return question.options.filter((opt) =>
      opt.showIf ? opt.showIf(answers) : true
    );
  }, [question.options, answers]);

  // If a question has at least one image, force a consistent tile grid (except exterior uses its own grid).
  const hasImages = visibleOptions.some((opt) => !!opt.imageUrl);
  const useTileGrid = hasImages && !isExterior;

  /**
   * Layout:
   * - Exterior: small landscape tiles, 3-up
   * - All other image questions: consistent portrait tiles, 2-up mobile / 3-up desktop
   * - Text-only questions: stack (fallback)
   */
  const layoutClasses = isExterior
    ? "grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3"
    : useTileGrid
      ? "grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3"
      : "flex flex-col gap-3 md:gap-4";

  return (
    <div className={layoutClasses}>
      {visibleOptions.map((opt: Option) => {
        const isActive = selected.includes(opt.id);

        // Aspect ratios:
        // - Exterior images are 1536x1024 => 3:2
        // - All other image questions: consistent portrait tiles (2:3)
        const aspectClass = isExterior ? "aspect-[3/2]" : opt.imageUrl ? "aspect-[2/3]" : "";

        return (
          <button
            key={opt.id}
            onClick={() => onSelect(question, opt.id)}
            className={`relative overflow-hidden rounded-xl bg-white shadow-sm text-left transition ${
              isActive ? "ring-2 ring-black" : "hover:shadow-md"
            }`}
          >
            {opt.imageUrl && (
              <div className={`relative w-full ${aspectClass}`}>
                <Image
                  src={opt.imageUrl}
                  alt={opt.label}
                  fill
                  sizes={
                    isExterior
                      ? "(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
                      : "(max-width: 768px) 50vw, 33vw"
                  }
                  className="object-cover"
                  // Only prioritize the first question for perf.
                  priority={isExterior}
                />
              </div>
            )}

            <div className={opt.imageUrl ? "p-2" : "p-3"}>
              <p className="text-xs md:text-sm font-[var(--font-playfair)] text-black">
                {opt.label}
              </p>
              {opt.subtitle && (
                <p className="mt-0.5 text-[11px] md:text-xs text-black/60">
                  {opt.subtitle}
                </p>
              )}
            </div>

            {question.allowMultiple &&
              question.id !== "spaces_appeal" &&
              isActive && (
                <span className="absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-[9px] text-[#F8F5EE]">
                  ✓
                </span>
              )}
          </button>
        );
      })}
    </div>
  );
}
