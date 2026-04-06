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
      <aside className="card-panel space-y-5 rounded-[1.75rem] p-5">
        <div>
          <p className="text-muted text-sm font-semibold uppercase tracking-[0.18em]">
            Mock Exam Setup
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">
              Exam year and sitting
              <select
                value={selectedExamId}
                onChange={(event) => setSelectedExamId(event.target.value)}
                className="field mt-2 rounded-2xl px-4 py-3"
              >
                <option value="">Choose an exam</option>
                {exams.map((exam) => (
                  <option key={exam.examId} value={exam.examId}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Exam length
              <select
                value={String(length)}
                onChange={(event) => setLength(Number(event.target.value))}
                className="field mt-2 rounded-2xl px-4 py-3"
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
          className="btn-primary w-full rounded-full px-4 py-3 text-sm font-semibold"
        >
          Start Mock Exam
        </button>

        {result ? (
          <div className="tone-success rounded-2xl px-4 py-4 text-sm">
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
                className="btn-outline rounded-full px-4 py-3 text-sm font-semibold"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setIndex((current) => Math.min(activeQuestions.length - 1, current + 1))
                }
                className="btn-secondary rounded-full px-4 py-3 text-sm font-semibold"
              >
                Next
              </button>
              <button
                type="button"
                onClick={finishMock}
                className="btn-primary rounded-full px-4 py-3 text-sm font-semibold"
              >
                Finish Mock Exam
              </button>
            </div>
          </>
        ) : (
          <div className="surface-empty rounded-[1.75rem] p-8">
            Choose an exam year and a length, then start a randomized mock exam.
          </div>
        )}
      </section>
    </div>
  );
}
