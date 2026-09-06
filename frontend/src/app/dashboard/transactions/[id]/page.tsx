import { TransactionEditor } from "@/features/planner/transactions";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <TransactionEditor id={id} />; }
