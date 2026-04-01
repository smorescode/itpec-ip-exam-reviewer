"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Exam, StoredProgress } from "@/lib/types";
import { loadProgress } from "@/lib/storage";

function percentage(correctCount: number, totalQuestions: number) {
  if (!totalQuestions) {
    return "0%";
  }

  return `${Math.round((correctCount / totalQuestions) * 100)}%`;
}

export function DashboardClient({ exams }: { exams: Exam[] }) {
  const [progress, setProgress] = useState<StoredProgress>({
    attempts: [],
    mistakes: {},
    practiceSession: null,
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress(loadProgress());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const unresolvedMistakes = Object.values(progress.mistakes).filter(
    (mistake) => !mistake.resolved,
  );
  const latestAttempt = progress.attempts[0] ?? null;
  const bestAttempt =
    progress.attempts.length > 0
      ? [...progress.attempts].sort(
          (left, right) =>
            right.correctCount / right.totalQuestions - left.correctCount / left.totalQuestions,
        )[0]
      : null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Exam Sets</p>
          <p className="mt-3 text-4xl font-semibold text-slate-100">{exams.length}</p>
          <p className="mt-2 text-sm text-slate-400">Spring and Autumn sittings from 2018 to 2025.</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Question Bank</p>
          <p className="mt-3 text-4xl font-semibold text-slate-100">
            {exams.reduce((sum, exam) => sum + exam.questionCount, 0)}
          </p>
          <p className="mt-2 text-sm text-slate-400">Imported from the PDF archive into JSON.</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Open Mistakes</p>
          <p className="mt-3 text-4xl font-semibold text-slate-100">{unresolvedMistakes.length}</p>
          <p className="mt-2 text-sm text-slate-400">Wrong answers that still need review.</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Attempts Logged</p>
          <p className="mt-3 text-4xl font-semibold text-slate-100">{progress.attempts.length}</p>
          <p className="mt-2 text-sm text-slate-400">Practice completions and mock exam results.</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Start Here
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Link
              href="/practice"
              className="rounded-[1.5rem] border border-slate-700 bg-slate-900 px-5 py-5 text-white transition hover:border-slate-500 hover:bg-slate-800"
            >
              <p className="text-lg font-semibold">Practice Mode</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Filter by year, answer with instant feedback, and keep your place.
              </p>
            </Link>
            <Link
              href="/review"
              className="rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/12 px-5 py-5 text-emerald-100 transition hover:bg-emerald-500/18"
            >
              <p className="text-lg font-semibold">Review Mistakes</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                Retry every missed question until it moves out of the queue.
              </p>
            </Link>
            <Link
              href="/mock"
              className="rounded-[1.5rem] border border-amber-400/30 bg-amber-500/14 px-5 py-5 text-amber-100 transition hover:bg-amber-500/20"
            >
              <p className="text-lg font-semibold">Mock Exam</p>
              <p className="mt-2 text-sm leading-6 text-amber-50/80">
                Choose a year, choose a length, and take a randomized test set.
              </p>
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Performance Snapshot
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-slate-900 px-4 py-4">
              <p className="text-sm text-slate-400">Latest attempt</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">
                {latestAttempt
                  ? `${latestAttempt.examTitle ?? latestAttempt.mode} · ${percentage(
                      latestAttempt.correctCount,
                      latestAttempt.totalQuestions,
                    )}`
                  : "No attempts yet"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-4">
              <p className="text-sm text-slate-400">Best recorded score</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">
                {bestAttempt
                  ? `${percentage(bestAttempt.correctCount, bestAttempt.totalQuestions)}`
                  : "No attempts yet"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
