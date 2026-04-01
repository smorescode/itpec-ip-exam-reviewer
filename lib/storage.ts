"use client";

import type {
  AttemptSummary,
  ChoiceKey,
  Exam,
  MistakeRecord,
  PracticeSession,
  Question,
  StoredProgress,
} from "@/lib/types";

const STORAGE_KEY = "itpec-reviewer:v1:progress";

const defaultProgress: StoredProgress = {
  attempts: [],
  mistakes: {},
  practiceSession: null,
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadProgress(): StoredProgress {
  if (!isBrowser()) {
    return defaultProgress;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProgress;
    }

    const parsed = JSON.parse(raw) as Partial<StoredProgress>;

    return {
      attempts: parsed.attempts ?? [],
      mistakes: parsed.mistakes ?? {},
      practiceSession: parsed.practiceSession ?? null,
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: StoredProgress) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function persistPracticeSession(session: PracticeSession | null) {
  const progress = loadProgress();
  saveProgress({
    ...progress,
    practiceSession: session,
  });
}

function upsertMistake(
  mistakes: Record<string, MistakeRecord>,
  question: Question,
  exam: Exam,
  chosenAnswer: ChoiceKey,
  correctAnswer: ChoiceKey,
  now: string,
) {
  const existing = mistakes[question.id];

  mistakes[question.id] = {
    questionId: question.id,
    examId: exam.examId,
    examTitle: exam.title,
    year: exam.year,
    seasonCode: exam.seasonCode,
    chosenAnswer,
    correctAnswer,
    lastUpdatedAt: now,
    wrongCount: (existing?.wrongCount ?? 0) + 1,
    resolved: false,
  };
}

function resolveMistake(
  mistakes: Record<string, MistakeRecord>,
  questionId: string,
  now: string,
) {
  const existing = mistakes[questionId];

  if (!existing) {
    return;
  }

  mistakes[questionId] = {
    ...existing,
    resolved: true,
    lastUpdatedAt: now,
  };
}

export function recordPracticeAnswer({
  exam,
  question,
  chosenAnswer,
}: {
  exam: Exam;
  question: Question;
  chosenAnswer: ChoiceKey;
}) {
  const now = new Date().toISOString();
  const progress = loadProgress();
  const mistakes = { ...progress.mistakes };

  if (chosenAnswer === question.correctAnswer) {
    resolveMistake(mistakes, question.id, now);
  } else {
    upsertMistake(mistakes, question, exam, chosenAnswer, question.correctAnswer, now);
  }

  saveProgress({
    ...progress,
    mistakes,
  });
}

export function recordAttempt(attempt: AttemptSummary) {
  const progress = loadProgress();
  saveProgress({
    ...progress,
    attempts: [attempt, ...progress.attempts].slice(0, 40),
  });
}

export function recordMockResults({
  exam,
  questions,
  answers,
}: {
  exam: Exam;
  questions: Question[];
  answers: Record<string, ChoiceKey>;
}) {
  const now = new Date().toISOString();
  const progress = loadProgress();
  const mistakes = { ...progress.mistakes };
  let correctCount = 0;

  for (const question of questions) {
    const chosenAnswer = answers[question.id];
    if (!chosenAnswer) {
      continue;
    }

    if (chosenAnswer === question.correctAnswer) {
      correctCount += 1;
      resolveMistake(mistakes, question.id, now);
    } else {
      upsertMistake(mistakes, question, exam, chosenAnswer, question.correctAnswer, now);
    }
  }

  saveProgress({
    ...progress,
    mistakes,
  });

  recordAttempt({
    id: `mock-${now}`,
    mode: "mock",
    examId: exam.examId,
    examTitle: exam.title,
    totalQuestions: questions.length,
    correctCount,
    completedAt: now,
  });

  return correctCount;
}
