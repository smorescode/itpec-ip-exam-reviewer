"use client";

function buttonClassName({
  isCurrent,
  isAnswered,
  isIncorrect,
}: {
  isCurrent: boolean;
  isAnswered: boolean;
  isIncorrect: boolean;
}) {
  if (isCurrent && isIncorrect) {
    return "tone-danger";
  }

  if (isCurrent) {
    return "btn-primary";
  }

  if (isIncorrect) {
    return "tone-danger";
  }

  if (isAnswered) {
    return "tone-success";
  }

  return "btn-secondary";
}

export function QuestionJumpGrid({
  total,
  currentIndex,
  isAnswered,
  isIncorrect,
  onJump,
}: {
  total: number;
  currentIndex: number;
  isAnswered: (index: number) => boolean;
  isIncorrect?: (index: number) => boolean;
  onJump: (index: number) => void;
}) {
  if (!total) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-muted flex items-center justify-between text-xs uppercase tracking-[0.18em]">
        <span>Jump To</span>
        <span>Neutral = skipped, red = wrong</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onJump(index)}
            className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${buttonClassName(
              {
                isCurrent: currentIndex === index,
                isAnswered: isAnswered(index),
                isIncorrect: isIncorrect?.(index) ?? false,
              },
            )}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
