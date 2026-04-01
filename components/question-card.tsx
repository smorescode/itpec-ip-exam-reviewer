"use client";

import type { ChoiceKey, Question } from "@/lib/types";

const choiceKeys: ChoiceKey[] = ["a", "b", "c", "d"];

function choiceClassName({
  choiceKey,
  selectedAnswer,
  submitted,
  correctAnswer,
}: {
  choiceKey: ChoiceKey;
  selectedAnswer?: ChoiceKey;
  submitted: boolean;
  correctAnswer: ChoiceKey;
}) {
  if (submitted && choiceKey === correctAnswer) {
    return "border-emerald-400 bg-emerald-500/15 text-emerald-100";
  }

  if (submitted && choiceKey === selectedAnswer && selectedAnswer !== correctAnswer) {
    return "border-rose-400 bg-rose-500/15 text-rose-100";
  }

  if (choiceKey === selectedAnswer) {
    return "border-sky-400 bg-sky-500/15 text-sky-100";
  }

  return "border-slate-700 bg-slate-900/70 text-slate-100 hover:border-slate-500";
}

export function QuestionCard({
  question,
  examTitle,
  progressLabel,
  selectedAnswer,
  submitted,
  locked = false,
  onSelect,
  extraNote,
}: {
  question: Question;
  examTitle: string;
  progressLabel?: string;
  selectedAnswer?: ChoiceKey;
  submitted: boolean;
  locked?: boolean;
  onSelect: (choice: ChoiceKey) => void;
  extraNote?: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-7">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
          {examTitle}
        </span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Original Exam Q{question.number}
        </span>
        {progressLabel ? (
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
            {progressLabel}
          </span>
        ) : null}
        {question.hasIncompleteText ? (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
            Partial PDF extraction
          </span>
        ) : null}
        {question.likelyRequiresDiagram ? (
          <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200">
            Missing diagram reference
          </span>
        ) : null}
      </div>

      <div className="space-y-4">
        <p className="text-lg leading-8 text-slate-100">{question.prompt}</p>

        {question.likelyRequiresDiagram || question.parseWarning || extraNote ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
            {question.likelyRequiresDiagram
              ? "This question appears to reference a figure, table, or diagram that the app cannot display from the PDF extraction."
              : question.parseWarning ?? extraNote}
          </div>
        ) : null}

        <div className="grid gap-3">
          {choiceKeys.map((choiceKey) => (
            <button
              key={choiceKey}
              type="button"
              disabled={locked}
              onClick={() => onSelect(choiceKey)}
              className={`rounded-2xl border px-4 py-4 text-left text-sm leading-6 transition sm:text-base ${choiceClassName(
                {
                  choiceKey,
                  selectedAnswer,
                  submitted,
                  correctAnswer: question.correctAnswer,
                },
              )} ${locked ? "cursor-default" : ""}`}
            >
              <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold uppercase">
                {choiceKey}
              </span>
              {question.choices[choiceKey]}
            </button>
          ))}
        </div>

        {submitted && selectedAnswer ? (
          <p
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              selectedAnswer === question.correctAnswer
                ? "bg-emerald-500/15 text-emerald-100"
                : "bg-rose-500/15 text-rose-100"
            }`}
          >
            {selectedAnswer === question.correctAnswer
              ? "Correct."
              : `Incorrect. The correct answer is ${question.correctAnswer.toUpperCase()}.`}
          </p>
        ) : null}
      </div>
    </article>
  );
}
