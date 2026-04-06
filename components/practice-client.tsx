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
      <aside className="card-panel space-y-5 rounded-[1.75rem] p-5">
        <div>
          <p className="text-muted text-sm font-semibold uppercase tracking-[0.18em]">
            Practice Setup
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">
              Year
              <select
                value={yearFilter}
                onChange={(event) => resetPractice(event.target.value, seasonFilter)}
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
                onChange={(event) => resetPractice(yearFilter, event.target.value)}
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
          <p className="font-semibold text-inherit">{questionIds.length} questions loaded</p>
          <p className="mt-2">Answered: {Object.keys(submitted).length}</p>
          <p className="mt-1">Correct: {calculateScore(questionIds, answers, exams)}</p>
        </div>

        <QuestionJumpGrid
          total={questionIds.length}
          currentIndex={index}
          isAnswered={(questionIndex) => Boolean(answers[questionIds[questionIndex]])}
          isIncorrect={(questionIndex) => {
            const questionId = questionIds[questionIndex];
            if (!questionId || !submitted[questionId]) {
              return false;
            }

            const question = allQuestions.find((item) => item.id === questionId);
            return Boolean(question && answers[questionId] !== question.correctAnswer);
          }}
          onJump={setIndex}
        />

        <button
          type="button"
          onClick={finishSession}
          className="btn-primary w-full rounded-full px-4 py-3 text-sm font-semibold"
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
                className="btn-outline rounded-full px-4 py-3 text-sm font-semibold"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-primary rounded-full px-4 py-3 text-sm font-semibold"
              >
                Check Answer
              </button>
              <button
                type="button"
                onClick={() =>
                  setIndex((current) => Math.min(questionIds.length - 1, current + 1))
                }
                className="btn-secondary rounded-full px-4 py-3 text-sm font-semibold"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="surface-empty rounded-[1.75rem] p-8">
            No questions matched the current filters.
          </div>
        )}
      </section>
    </div>
  );
}
