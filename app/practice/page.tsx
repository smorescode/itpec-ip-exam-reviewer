import { AppShell } from "@/components/app-shell";
import { PracticeClient } from "@/components/practice-client";
import { getAllExams, getAllYears } from "@/lib/exam-data";

export default function PracticePage() {
  return (
    <AppShell
      title="Practice Mode"
      description="Filter the question bank by year and sitting, answer one question at a time, and check answers immediately."
    >
      <PracticeClient exams={getAllExams()} years={getAllYears()} />
    </AppShell>
  );
}
