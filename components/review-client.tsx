"use client";

import { useEffect, useState } from "react";
import { QuestionJumpGrid } from "@/components/question-jump-grid";
import { QuestionCard } from "@/components/question-card";
import { loadProgress, recordPracticeAnswer } from "@/lib/storage";
import type { ChoiceKey, Exam, MistakeRecord } from "@/lib/types";

type ReviewQuestion = Exam["questions"][number] & {
  exam: Exam;
};

function getReviewQuestions(exams: Exam[], mistakes: Record<string, MistakeRecord>) {
  const unresolvedIds = Object.values(mistakes)
    .filter((mistake) => !mistake.resolved)
    .map((mistake) => mistake.questionId);

  return unresolvedIds
    .map((questionId) => {
      for (const exam of exams) {
        const question = exam.questions.find((item) => item.id === questionId);
        if (question) {
          return {
            ...question,
            exam,
          };
        }
      }

      return null;
    })
    .filter((value): value is ReviewQuestion => value !== null);
}

export function ReviewClient({
  exams,
  years,
}: {
  exams: Exam[];
  years: number[];
}) {
  const [yearFilter, setYearFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [mistakes, setMistakes] = useState<Record<string, MistakeRecord>>({});
  const [answers, setAnswers] = useState<Record<string, ChoiceKey>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMistakes(loadProgress().mistakes);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const reviewQuestions = getReviewQuestions(exams, mistakes).filter((question) => {
    if (yearFilter !== "all" && String(question.exam.year) !== yearFilter) {
      return false;
    }

    if (seasonFilter !== "all" && question.exam.seasonCode !== seasonFilter) {
      return false;
    }

    return true;
  });

  const safeIndex = Math.min(index, Math.max(0, reviewQuestions.length - 1));
  const currentQuestion = reviewQuestions[safeIndex] ?? null;

  function refreshProgress() {
    setMistakes(loadProgress().mistakes);
  }

  function handleSubmit() {
    if (!currentQuestion) {
      return;
    }

    const selectedAnswer = answers[currentQuestion.id];
    if (!selectedAnswer || submitted[currentQuestion.id]) {
      return;
    }

    setSubmitted((current) => ({
      ...current,
      [currentQuestion.id]: true,
    }));

    recordPracticeAnswer({
      exam: currentQuestion.exam,
      question: currentQuestion,
      chosenAnswer: selectedAnswer,
    });

    refreshProgress();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5 rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Review Queue
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Year
              <select
                value={yearFilter}
                onChange={(event) => {
                  setYearFilter(event.target.value);
                  setIndex(0);
                }}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
              >
                <option value="all">All years</option>
                {years.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Sitting
              <select
                value={seasonFilter}
                onChange={(event) => {
                  setSeasonFilter(event.target.value);
                  setIndex(0);
                }}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
              >
                <option value="all">All sittings</option>
                <option value="S">Spring</option>
                <option value="A">Autumn</option>
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 px-4 py-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">{reviewQuestions.length} mistakes open</p>
          <p className="mt-2">Resolve them by answering each one correctly.</p>
        </div>

        <QuestionJumpGrid
          total={reviewQuestions.length}
          currentIndex={safeIndex}
          isAnswered={(questionIndex) => Boolean(answers[reviewQuestions[questionIndex]?.id])}
          onJump={setIndex}
        />
      </aside>

      <section className="space-y-4">
        {currentQuestion ? (
          <>
            <QuestionCard
              question={currentQuestion}
              examTitle={currentQuestion.exam.title}
              progressLabel={`Review ${safeIndex + 1} / ${reviewQuestions.length}`}
              selectedAnswer={answers[currentQuestion.id]}
              submitted={Boolean(submitted[currentQuestion.id])}
              locked={Boolean(submitted[currentQuestion.id])}
              onSelect={(choice) =>
                setAnswers((current) => ({
                  ...current,
                  [currentQuestion.id]: choice,
                }))
              }
              extraNote="Correct answers automatically clear the mistake from your review queue."
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                className="rounded-full border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-full bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                Submit Review Answer
              </button>
              <button
                type="button"
                onClick={() =>
                  setIndex((current) => Math.min(reviewQuestions.length - 1, current + 1))
                }
                className="rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-700 bg-slate-950/40 p-8 text-slate-400">
            No unresolved mistakes matched the current filters.
          </div>
        )}
      </section>
    </div>
  );
}
