import { AppShell } from "@/components/app-shell";
import { ReviewClient } from "@/components/review-client";
import { getAllExams, getAllYears } from "@/lib/exam-data";

export default function ReviewPage() {
  return (
    <AppShell
      title="Mistake Review"
      description="Retry previously missed questions and remove them from the review queue by answering correctly."
    >
      <ReviewClient exams={getAllExams()} years={getAllYears()} />
    </AppShell>
  );
}
