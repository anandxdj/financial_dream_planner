"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PageTitle, secondary } from "./ui";

type Priority = "Action required" | "Important" | "Info";
type Filter = "All" | "Unread" | Priority;
type DemoNotification = {
  id: string;
  priority: Priority;
  title: string;
  description: string;
  time: string;
  href: string;
  action: string;
  read: boolean;
};

const samples: readonly DemoNotification[] = [
  { id: "review-plan", priority: "Action required", title: "Your plan is ready for review", description: "Review the latest saved assumptions before using them for your next decision.", time: "Today, 9:30 AM", href: "/dashboard/plan", action: "Review plan", read: false },
  { id: "transactions", priority: "Important", title: "Transactions need attention", description: "Open the transaction list to review sample categorisation and recent activity.", time: "Yesterday", href: "/dashboard/transactions", action: "Review transactions", read: false },
  { id: "goal", priority: "Important", title: "Check your goal timeline", description: "A sample goal may benefit from a contribution or timing review.", time: "3 days ago", href: "/dashboard/goals", action: "View goals", read: true },
  { id: "monthly-review", priority: "Info", title: "Monthly review preview is ready", description: "Explore a read-only sample report tied to a saved plan version.", time: "5 days ago", href: "/dashboard/reports", action: "Open reports", read: true },
] as const;

const filters: readonly Filter[] = ["All", "Unread", "Action required", "Important", "Info"];
const priorityTone: Record<Priority, BadgeTone> = { "Action required": "danger", Important: "warning", Info: "blue" };

export function Notifications() {
  const [items, setItems] = useState<DemoNotification[]>(() => samples.map((item) => ({ ...item })));
  const [filter, setFilter] = useState<Filter>("All");
  const unreadCount = items.filter((item) => !item.read).length;
  const visibleItems = useMemo(() => items.filter((item) => filter === "All" || (filter === "Unread" ? !item.read : item.priority === filter)), [filter, items]);

  function setRead(id: string, read: boolean) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, read } : item));
  }

  function restoreDemo() {
    setItems(samples.map((item) => ({ ...item })));
    setFilter("All");
  }

  return (
    <>
      <PageTitle title="Notifications" description="Review planning updates and follow their demo deep links.">
        {unreadCount > 0 ? <button type="button" className={secondary} onClick={() => setItems((current) => current.map((item) => ({ ...item, read: true })))}>Mark all as read</button> : null}
      </PageTitle>

      <div role="note" className="mb-6 rounded-xl border border-[#B8AFE8] bg-[#F3F0FF] p-4 text-sm text-[#344054]">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="neutral" size="sm">Demo preview</Badge><strong className="text-[#1F2A44]">Local state only</strong></div>
        <p className="mt-2">These are sample notifications. Read changes last only until refresh; no server, email, or push service is contacted.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[#344054]" role="status" aria-live="polite">{unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}</p>
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter notifications">
          {filters.map((option) => <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9] ${filter === option ? "border-[#5E55C9] bg-[#5E55C9] text-white" : "border-[#E8E1D6] bg-[#FFFCF8] text-[#344054] hover:bg-[#FFF9F0]"}`}>{option}</button>)}
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <ul className="space-y-4" aria-label="Demo notifications">
          {visibleItems.map((item) => (
            <li key={item.id} className={`rounded-2xl border bg-[#FFFCF8] p-5 shadow-xs sm:p-6 ${item.read ? "border-[#E8E1D6]" : "border-[#B8AFE8] border-l-4"}`}>
              <article aria-labelledby={`${item.id}-title`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Badge tone={priorityTone[item.priority]} size="sm" dot>{item.priority}</Badge>{!item.read ? <Badge tone="purple" size="sm">Unread</Badge> : <span className="text-xs font-semibold text-[#475467]">Read</span>}</div>
                    <h2 id={`${item.id}-title`} className="mt-3 text-xl font-serif text-[#1F2A44]">{item.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#475467]">{item.description}</p>
                    <p className="mt-2 text-xs text-[#475467]">{item.time}</p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
                    <Link href={item.href} className={`${secondary} w-full`} onClick={() => setRead(item.id, true)} aria-describedby={`${item.id}-title`}>{item.action}</Link>
                    <button type="button" aria-describedby={`${item.id}-title`} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#475467] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]" onClick={() => setRead(item.id, !item.read)}>{item.read ? "Mark as unread" : "Mark as read"}</button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <section className="rounded-2xl border border-dashed border-[#B8AFE8] bg-[#FFFCF8] px-5 py-10 text-center" aria-labelledby="empty-notifications-title">
          <h2 id="empty-notifications-title" className="text-2xl font-serif text-[#1F2A44]">{items.length === 0 ? "Demo inbox cleared" : "No notifications match this filter"}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#475467]">{items.length === 0 ? "Restore the sample set to keep exploring priority, read state, and deep-link behavior." : "Choose another filter or clear the demo inbox to preview its empty state."}</p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            {items.length === 0 ? <button type="button" className={secondary} onClick={restoreDemo}>Restore demo notifications</button> : <button type="button" className={secondary} onClick={() => setFilter("All")}>Show all notifications</button>}
          </div>
        </section>
      )}

      {items.length > 0 ? <div className="mt-6 border-t border-[#E8E1D6] pt-5"><button type="button" className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#475467] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]" onClick={() => { setItems([]); setFilter("All"); }}>Clear demo inbox</button></div> : null}
    </>
  );
}
