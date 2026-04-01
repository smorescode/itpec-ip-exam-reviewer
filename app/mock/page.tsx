import { AppShell } from "@/components/app-shell";
import { MockClient } from "@/components/mock-client";
import { getAllExams } from "@/lib/exam-data";

export default function MockPage() {
  return (
    <AppShell
      title="Randomized Mock Exams"
      description="Choose a specific year and sitting, pick a test length, and run a randomized exam from that paper only."
    >
      <MockClient exams={getAllExams()} />
    </AppShell>
  );
}
