"use client";

import dynamic from "next/dynamic";

const Overview = dynamic(
  () => import("@/features/overview").then((m) => m.Overview),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[#5E55C9] border-t-transparent" />
      </div>
    ),
  }
);

export default function Page() {
  return <Overview />;
}

