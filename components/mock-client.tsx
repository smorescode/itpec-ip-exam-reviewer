"use client";

import { useState } from "react";
import { QuestionJumpGrid } from "@/components/question-jump-grid";
import { QuestionCard } from "@/components/question-card";
import { recordMockResults } from "@/lib/storage";
import type { ChoiceKey, Exam } from "@/lib/types";

const lengthOptions = [10, 25, 50, 100];

function randomizeQuestions(exam: Exam, length: number) {
  return [...exam.questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(length, exam.questions.length));
}

export function MockClient({ exams }: { exams: Exam[] }) {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [length, setLength] = useState(25);
  const [activeQuestions, setActiveQuestions] = useState<Exam["questions"]>([]);
  const [answers, setAnswers] = useState<Record<string, ChoiceKey>>({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<{ correctCount: number; totalQuestions: number } | null>(
    null,
  );

  const selectedExam = exams.find((exam) => exam.examId === selectedExamId) ?? null;
  const currentQuestion = activeQuestions[index] ?? null;
  const running = activeQuestions.length > 0 && !result;

  function startMock() {
    if (!selectedExam) {
      return;
    }

    setActiveQuestions(randomizeQuestions(selectedExam, length));
    setAnswers({});
    setIndex(0);
    setResult(null);
  }

  function finishMock() {
    if (!selectedExam || activeQuestions.length === 0) {
      return;
    }

    const correctCount = recordMockResults({
      exam: selectedExam,
      questions: activeQuestions,
      answers,
    });

    setResult({
      correctCount,
      totalQuestions: activeQuestions.length,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5 rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Mock Exam Setup
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Exam year and sitting
              <select
                value={selectedExamId}
                onChange={(event) => setSelectedExamId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
              >
                <option value="">Choose an exam</option>
                {exams.map((exam) => (
                  <option key={exam.examId} value={exam.examId}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Exam length
              <select
                value={String(length)}
                onChange={(event) => setLength(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
              >
                {lengthOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} questions
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={startMock}
          disabled={!selectedExam}
          className="w-full rounded-full bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          Start Mock Exam
        </button>

        {result ? (
          <div className="rounded-2xl bg-emerald-500/15 px-4 py-4 text-sm text-emerald-100">
            <p className="font-semibold">
              Score: {result.correctCount} / {result.totalQuestions}
            </p>
            <p className="mt-2">
              {Math.round((result.correctCount / result.totalQuestions) * 100)}%
            </p>
          </div>
        ) : null}

        {running ? (
          <QuestionJumpGrid
            total={activeQuestions.length}
            currentIndex={index}
            isAnswered={(questionIndex) => Boolean(answers[activeQuestions[questionIndex]?.id])}
            onJump={setIndex}
          />
        ) : null}
      </aside>

      <section className="space-y-4">
        {running && currentQuestion && selectedExam ? (
          <>
            <QuestionCard
              question={currentQuestion}
              examTitle={selectedExam.title}
              progressLabel={`Mock ${index + 1} / ${activeQuestions.length}`}
              selectedAnswer={answers[currentQuestion.id]}
              submitted={false}
              onSelect={(choice) =>
                setAnswers((current) => ({
                  ...current,
                  [currentQuestion.id]: choice,
                }))
              }
              extraNote="Mock exams do not reveal the correct answer until you finish."
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
                onClick={() =>
                  setIndex((current) => Math.min(activeQuestions.length - 1, current + 1))
                }
                className="rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
              >
                Next
              </button>
              <button
                type="button"
                onClick={finishMock}
                className="rounded-full bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                Finish Mock Exam
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-700 bg-slate-950/40 p-8 text-slate-400">
            Choose an exam year and a length, then start a randomized mock exam.
          </div>
        )}
      </section>
    </div>
  );
}
