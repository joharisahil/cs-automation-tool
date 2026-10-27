import { ArrowUpRight, BriefcaseBusiness, CalendarClock, CheckSquare, CircleDollarSign, Clock3, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const metrics = [
  { label: "Active assignments", value: "—", note: "Assignment tracking is not yet configured", icon: BriefcaseBusiness },
  { label: "Tasks due this week", value: "—", note: "Task management is coming soon", icon: CheckSquare },
  { label: "Upcoming deadlines", value: "—", note: "Deadline tracking is coming soon", icon: CalendarClock },
  { label: "Pending invoices", value: "—", note: "Billing is coming soon", icon: CircleDollarSign },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-muted-foreground">Tuesday, 27 October 2026</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Good to see you</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Your practice operations at a glance. The cards below are ready for live assignment and billing data.</p></div>
        <Button disabled className="w-fit gap-2"><Plus className="size-4" />New assignment <span className="text-xs opacity-70">Coming soon</span></Button>
      </div>

      <section aria-label="Practice metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon }) => <article key={label} className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="size-4 text-muted-foreground" /></div><p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></article>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-xs text-muted-foreground">A live audit feed will appear here.</p></div><Clock3 className="size-4 text-muted-foreground" /></div>
          <div className="grid min-h-52 place-items-center px-5 py-8 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-full bg-muted"><Clock3 className="size-5 text-muted-foreground" /></span><p className="mt-4 text-sm font-medium">No activity to show yet</p><p className="mt-1 text-sm text-muted-foreground">Activity will be recorded as your team uses the workspace.</p></div></div>
        </article>
        <article className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Workspace setup</h2><p className="mt-1 text-xs text-muted-foreground">Your secure foundation is ready.</p></div>
          <div className="space-y-5 p-5">
            <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><ShieldCheck className="size-4" /></span><div><p className="text-sm font-medium">Secure access enabled</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Your account is protected by server-side authentication and database access policies.</p></div></div>
            <div className="border-t border-border pt-4"><p className="text-sm font-medium">Explore the workspace</p><p className="mt-1 text-xs text-muted-foreground">Assignments, tasks, clients and billing are ready for the next implementation phase.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/dashboard/assignments" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Assignments <ArrowUpRight className="size-3" /></Link><Link href="/dashboard/tasks" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Tasks <ArrowUpRight className="size-3" /></Link></div></div>
          </div>
        </article>
      </section>
      <p className="text-center text-xs text-muted-foreground">Ajay Khandelwal &amp; Associates · Bareilly, India</p>
    </div>
  );
}
