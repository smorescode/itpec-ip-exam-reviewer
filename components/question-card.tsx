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
    return "tone-success";
  }

  if (submitted && choiceKey === selectedAnswer && selectedAnswer !== correctAnswer) {
    return "tone-danger";
  }

  if (choiceKey === selectedAnswer) {
    return "tone-primary";
  }

  return "btn-secondary border";
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
    <article className="card-panel rounded-[1.75rem] p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="badge-warning rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
          {examTitle}
        </span>
        <span className="badge-neutral rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
          Original Exam Q{question.number}
        </span>
        {progressLabel ? (
          <span className="badge-primary rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            {progressLabel}
          </span>
        ) : null}
        {question.hasIncompleteText ? (
          <span className="badge-warning rounded-full px-3 py-1 text-xs font-semibold">
            Partial PDF extraction
          </span>
        ) : null}
        {question.likelyRequiresDiagram ? (
          <span className="badge-danger rounded-full px-3 py-1 text-xs font-semibold">
            Missing diagram reference
          </span>
        ) : null}
      </div>

      <div className="space-y-4">
        <p className="text-lg leading-8">{question.prompt}</p>

        {question.likelyRequiresDiagram || question.parseWarning || extraNote ? (
          <div className="tone-warning rounded-2xl border px-4 py-3 text-sm leading-6">
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
              <span className="ghost-panel mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold uppercase">
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
                ? "tone-success"
                : "tone-danger"
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
