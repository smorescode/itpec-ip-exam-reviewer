"use client";

function buttonClassName({
  isCurrent,
  isAnswered,
}: {
  isCurrent: boolean;
  isAnswered: boolean;
}) {
  if (isCurrent) {
    return "border-amber-300 bg-amber-300 text-slate-950";
  }

  if (isAnswered) {
    return "border-emerald-400/50 bg-emerald-500/15 text-emerald-100";
  }

  return "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500";
}

export function QuestionJumpGrid({
  total,
  currentIndex,
  isAnswered,
  onJump,
}: {
  total: number;
  currentIndex: number;
  isAnswered: (index: number) => boolean;
  onJump: (index: number) => void;
}) {
  if (!total) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
        <span>Jump To</span>
        <span>Gray = skipped</span>
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
