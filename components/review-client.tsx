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
      <aside className="card-panel space-y-5 rounded-[1.75rem] p-5">
        <div>
          <p className="text-muted text-sm font-semibold uppercase tracking-[0.18em]">
            Review Queue
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">
              Year
              <select
                value={yearFilter}
                onChange={(event) => {
                  setYearFilter(event.target.value);
                  setIndex(0);
                }}
                className="field mt-2 rounded-2xl px-4 py-3"
              >
                <option value="all">All years</option>
                {years.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Sitting
              <select
                value={seasonFilter}
                onChange={(event) => {
                  setSeasonFilter(event.target.value);
                  setIndex(0);
                }}
                className="field mt-2 rounded-2xl px-4 py-3"
              >
                <option value="all">All sittings</option>
                <option value="S">Spring</option>
                <option value="A">Autumn</option>
              </select>
            </label>
          </div>
        </div>

        <div className="soft-panel text-muted rounded-2xl px-4 py-4 text-sm">
          <p className="font-semibold text-inherit">{reviewQuestions.length} mistakes open</p>
          <p className="mt-2">Resolve them by answering each one correctly.</p>
        </div>

        <QuestionJumpGrid
          total={reviewQuestions.length}
          currentIndex={safeIndex}
          isAnswered={(questionIndex) => Boolean(answers[reviewQuestions[questionIndex]?.id])}
          isIncorrect={(questionIndex) => {
            const question = reviewQuestions[questionIndex];
            if (!question || !submitted[question.id]) {
              return false;
            }

            return answers[question.id] !== question.correctAnswer;
          }}
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
                className="btn-outline rounded-full px-4 py-3 text-sm font-semibold"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-primary rounded-full px-4 py-3 text-sm font-semibold"
              >
                Submit Review Answer
              </button>
              <button
                type="button"
                onClick={() =>
                  setIndex((current) => Math.min(reviewQuestions.length - 1, current + 1))
                }
                className="btn-secondary rounded-full px-4 py-3 text-sm font-semibold"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="surface-empty rounded-[1.75rem] p-8">
            No unresolved mistakes matched the current filters.
          </div>
        )}
      </section>
    </div>
  );
}
