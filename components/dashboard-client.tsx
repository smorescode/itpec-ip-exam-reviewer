"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/storage";
import type { Exam, StoredProgress } from "@/lib/types";

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
        <div className="card-panel rounded-[1.75rem] p-5">
          <p className="text-muted text-sm uppercase tracking-[0.18em]">Exam Sets</p>
          <p className="mt-3 text-4xl font-semibold">{exams.length}</p>
          <p className="text-muted mt-2 text-sm">Spring and Autumn sittings from 2018 to 2025.</p>
        </div>
        <div className="card-panel rounded-[1.75rem] p-5">
          <p className="text-muted text-sm uppercase tracking-[0.18em]">Question Bank</p>
          <p className="mt-3 text-4xl font-semibold">
            {exams.reduce((sum, exam) => sum + exam.questionCount, 0)}
          </p>
          <p className="text-muted mt-2 text-sm">Imported from the PDF archive into JSON.</p>
        </div>
        <div className="card-panel rounded-[1.75rem] p-5">
          <p className="text-muted text-sm uppercase tracking-[0.18em]">Open Mistakes</p>
          <p className="mt-3 text-4xl font-semibold">{unresolvedMistakes.length}</p>
          <p className="text-muted mt-2 text-sm">Wrong answers that still need review.</p>
        </div>
        <div className="card-panel rounded-[1.75rem] p-5">
          <p className="text-muted text-sm uppercase tracking-[0.18em]">Attempts Logged</p>
          <p className="mt-3 text-4xl font-semibold">{progress.attempts.length}</p>
          <p className="text-muted mt-2 text-sm">Practice completions and mock exam results.</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="card-panel rounded-[1.75rem] p-6">
          <p className="text-muted text-sm font-semibold uppercase tracking-[0.2em]">
            Start Here
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Link href="/practice" className="card-panel rounded-[1.5rem] px-5 py-5">
              <p className="text-lg font-semibold">Practice Mode</p>
              <p className="text-muted mt-2 text-sm leading-6">
                Filter by year, answer with instant feedback, and keep your place.
              </p>
            </Link>
            <Link href="/review" className="tone-success rounded-[1.5rem] border px-5 py-5">
              <p className="text-lg font-semibold">Review Mistakes</p>
              <p className="mt-2 text-sm leading-6">
                Retry every missed question until it moves out of the queue.
              </p>
            </Link>
            <Link href="/mock" className="tone-accent rounded-[1.5rem] border px-5 py-5">
              <p className="text-lg font-semibold">Mock Exam</p>
              <p className="mt-2 text-sm leading-6">
                Choose a year, choose a length, and take a randomized test set.
              </p>
            </Link>
          </div>
        </div>

        <div className="card-panel rounded-[1.75rem] p-6">
          <p className="text-muted text-sm font-semibold uppercase tracking-[0.2em]">
            Performance Snapshot
          </p>
          <div className="mt-4 space-y-4">
            <div className="soft-panel rounded-2xl px-4 py-4">
              <p className="text-muted text-sm">Latest attempt</p>
              <p className="mt-1 text-xl font-semibold">
                {latestAttempt
                  ? `${latestAttempt.examTitle ?? latestAttempt.mode} · ${percentage(
                      latestAttempt.correctCount,
                      latestAttempt.totalQuestions,
                    )}`
                  : "No attempts yet"}
              </p>
            </div>
            <div className="soft-panel rounded-2xl px-4 py-4">
              <p className="text-muted text-sm">Best recorded score</p>
              <p className="mt-1 text-xl font-semibold">
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
