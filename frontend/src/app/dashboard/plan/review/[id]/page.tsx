import { DriftReview } from "@/features/planner/history-drift";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DriftReview id={id} />;
}
