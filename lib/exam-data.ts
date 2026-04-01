import examsData from "@/data/generated/exams.json";
import type { Exam, Question } from "@/lib/types";

const exams = [...(examsData as Exam[])].sort((left, right) => {
  if (left.year !== right.year) {
    return right.year - left.year;
  }

  return right.seasonCode.localeCompare(left.seasonCode);
});

const questionsById = new Map<string, Question>();

for (const exam of exams) {
  for (const question of exam.questions) {
    questionsById.set(question.id, question);
  }
}

export function getAllExams() {
  return exams;
}

export function getExamById(examId: string) {
  return exams.find((exam) => exam.examId === examId) ?? null;
}

export function getAllYears() {
  return [...new Set(exams.map((exam) => exam.year))].sort((left, right) => right - left);
}

export function filterExams(year: string, seasonCode: string) {
  return exams.filter((exam) => {
    if (year !== "all" && String(exam.year) !== year) {
      return false;
    }

    if (seasonCode !== "all" && exam.seasonCode !== seasonCode) {
      return false;
    }

    return true;
  });
}

export function flattenQuestions(selectedExams: Exam[]) {
  return selectedExams.flatMap((exam) =>
    exam.questions.map((question) => ({
      ...question,
      examId: exam.examId,
      examTitle: exam.title,
      year: exam.year,
      seasonCode: exam.seasonCode,
    })),
  );
}

export function getQuestionById(questionId: string) {
  return questionsById.get(questionId) ?? null;
}
