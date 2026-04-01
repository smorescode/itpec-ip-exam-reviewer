export type ChoiceKey = "a" | "b" | "c" | "d";

export type Question = {
  id: string;
  number: number;
  prompt: string;
  choices: Record<ChoiceKey, string>;
  correctAnswer: ChoiceKey;
  hasIncompleteText: boolean;
  likelyRequiresDiagram: boolean;
  parseWarning: string | null;
};

export type Exam = {
  examId: string;
  title: string;
  year: number;
  season: string;
  seasonCode: string;
  questionCount: number;
  incompleteQuestionCount: number;
  sourceFiles: {
    questions: string;
    answers: string;
  };
  questions: Question[];
};

export type PracticeSession = {
  id: string;
  mode: "practice" | "review";
  yearFilter?: string;
  seasonFilter?: string;
  questionIds: string[];
  answers: Record<string, ChoiceKey>;
  submitted: Record<string, boolean>;
  startedAt: string;
  updatedAt: string;
};

export type AttemptSummary = {
  id: string;
  mode: "practice" | "mock";
  examId?: string;
  examTitle?: string;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
};

export type MistakeRecord = {
  questionId: string;
  examId: string;
  examTitle: string;
  year: number;
  seasonCode: string;
  chosenAnswer: ChoiceKey;
  correctAnswer: ChoiceKey;
  lastUpdatedAt: string;
  wrongCount: number;
  resolved: boolean;
};

export type StoredProgress = {
  attempts: AttemptSummary[];
  mistakes: Record<string, MistakeRecord>;
  practiceSession: PracticeSession | null;
};
