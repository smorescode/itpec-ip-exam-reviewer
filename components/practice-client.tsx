"use client";

import { useEffect, useState } from "react";
import { QuestionJumpGrid } from "@/components/question-jump-grid";
import { QuestionCard } from "@/components/question-card";
import {
  loadProgress,
  persistPracticeSession,
  recordAttempt,
  recordPracticeAnswer,
} from "@/lib/storage";
import type { ChoiceKey, Exam, PracticeSession } from "@/lib/types";

type PracticeQuestion = Exam["questions"][number] & {
  examId: string;
  examTitle: string;
  year: number;
  seasonCode: string;
};

function flattenQuestions(exams: Exam[], year: string, season: string): PracticeQuestion[] {
  return exams
    .filter((exam) => {
      if (year !== "all" && String(exam.year) !== year) {
        return false;
      }

      if (season !== "all" && exam.seasonCode !== season) {
        return false;
      }

      return true;
    })
    .flatMap((exam) =>
      exam.questions.map((question) => ({
        ...question,
        examId: exam.examId,
        examTitle: exam.title,
        year: exam.year,
        seasonCode: exam.seasonCode,
      })),
    );
}

function calculateScore(questionIds: string[], answers: Record<string, ChoiceKey>, exams: Exam[]) {
  const questionMap = new Map(
    exams.flatMap((exam) => exam.questions.map((question) => [question.id, question] as const)),
  );

  return questionIds.reduce((total, questionId) => {
    const question = questionMap.get(questionId);
    if (!question) {
      return total;
    }

    return answers[questionId] === question.correctAnswer ? total + 1 : total;
  }, 0);
}

export function PracticeClient({
  exams,
  years,
}: {
  exams: Exam[];
  years: number[];
}) {
  const [yearFilter, setYearFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, ChoiceKey>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const allQuestions = exams.flatMap((exam) =>
    exam.questions.map((question) => ({
      ...question,
      examId: exam.examId,
      examTitle: exam.title,
      year: exam.year,
      seasonCode: exam.seasonCode,
    })),
  );
  const currentQuestion =
    allQuestions.find((question) => question.id === questionIds[index]) ?? null;

  function resetPractice(nextYear: string, nextSeason: string) {
    const nextQuestions = flattenQuestions(exams, nextYear, nextSeason);
    setYearFilter(nextYear);
    setSeasonFilter(nextSeason);
    setQuestionIds(nextQuestions.map((question) => question.id));
    setAnswers({});
    setSubmitted({});
    setIndex(0);
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedSession = loadProgress().practiceSession;

      if (storedSession?.mode === "practice" && storedSession.questionIds.length > 0) {
        setYearFilter(storedSession.yearFilter ?? "all");
        setSeasonFilter(storedSession.seasonFilter ?? "all");
        setQuestionIds(storedSession.questionIds);
        setAnswers(storedSession.answers);
        setSubmitted(storedSession.submitted);
        setReady(true);
        return;
      }

      const initialQuestions = flattenQuestions(exams, "all", "all");
      setYearFilter("all");
      setSeasonFilter("all");
      setQuestionIds(initialQuestions.map((question) => question.id));
      setAnswers({});
      setSubmitted({});
      setIndex(0);
      setReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [exams]);

  useEffect(() => {
    if (!ready || questionIds.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const session: PracticeSession = {
      id: "practice-current",
      mode: "practice",
      yearFilter,
      seasonFilter,
      questionIds,
      answers,
      submitted,
      startedAt: now,
      updatedAt: now,
    };

    persistPracticeSession(session);
  }, [answers, questionIds, ready, seasonFilter, submitted, yearFilter]);

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

    const exam = exams.find((item) => item.examId === currentQuestion.examId);
    if (!exam) {
      return;
    }

    const question = exam.questions.find((item) => item.id === currentQuestion.id);
    if (!question) {
      return;
    }

    recordPracticeAnswer({
      exam,
      question,
      chosenAnswer: selectedAnswer,
    });
  }

  function finishSession() {
    const answeredQuestions = questionIds.filter((questionId) => submitted[questionId]);
    const now = new Date().toISOString();

    recordAttempt({
      id: `practice-${now}`,
      mode: "practice",
      totalQuestions: answeredQuestions.length,
      correctCount: calculateScore(answeredQuestions, answers, exams),
      completedAt: now,
    });

    persistPracticeSession(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5 rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Practice Setup
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Year
              <select
                value={yearFilter}
                onChange={(event) => resetPractice(event.target.value, seasonFilter)}
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
                onChange={(event) => resetPractice(yearFilter, event.target.value)}
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
          <p className="font-semibold text-slate-100">{questionIds.length} questions loaded</p>
          <p className="mt-2">Answered: {Object.keys(submitted).length}</p>
          <p className="mt-1">Correct: {calculateScore(questionIds, answers, exams)}</p>
        </div>

        <QuestionJumpGrid
          total={questionIds.length}
          currentIndex={index}
          isAnswered={(questionIndex) => Boolean(answers[questionIds[questionIndex]])}
          onJump={setIndex}
        />

        <button
          type="button"
          onClick={finishSession}
          className="w-full rounded-full bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Save Practice Result
        </button>
      </aside>

      <section className="space-y-4">
        {currentQuestion ? (
          <>
            <QuestionCard
              question={currentQuestion}
              examTitle={currentQuestion.examTitle}
              progressLabel={`Practice ${index + 1} / ${questionIds.length}`}
              selectedAnswer={answers[currentQuestion.id]}
              submitted={Boolean(submitted[currentQuestion.id])}
              locked={Boolean(submitted[currentQuestion.id])}
              onSelect={(choice) =>
                setAnswers((current) => ({
                  ...current,
                  [currentQuestion.id]: choice,
                }))
              }
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
                Check Answer
              </button>
              <button
                type="button"
                onClick={() =>
                  setIndex((current) => Math.min(questionIds.length - 1, current + 1))
                }
                className="rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-700 bg-slate-950/40 p-8 text-slate-400">
            No questions matched the current filters.
          </div>
        )}
      </section>
    </div>
  );
}
