import { ScenarioDetail } from "@/features/scenarios";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScenarioDetail id={id} />;
}
