import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard-client";
import { getAllExams } from "@/lib/exam-data";

export default function Home() {
  return (
    <AppShell
      title="Exam Practice Without The PDF Friction"
      description="Use the imported IP exam archive for focused practice, review the questions you miss, and run randomized mock exams anchored to a specific year."
    >
      <DashboardClient exams={getAllExams()} />
    </AppShell>
  );
}
