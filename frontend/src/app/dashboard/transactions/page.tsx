import { Suspense } from "react";
import { Transactions } from "@/features/planner/transactions";
export default function Page() { return <Suspense fallback={<p>Loading transactions…</p>}><Transactions /></Suspense>; }
