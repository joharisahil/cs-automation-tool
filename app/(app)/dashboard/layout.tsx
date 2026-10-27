import { redirect } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, CheckSquare, ChevronDown, CircleDollarSign, Files, LayoutDashboard, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";
import { roleLabels, type PracticeRole } from "@/lib/auth/roles";

export const instant = false;

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, status: "Active" },
  { label: "Assignments", href: "/dashboard/assignments", icon: BriefcaseBusiness, status: "Coming soon" },
  { label: "Tasks & deadlines", href: "/dashboard/tasks", icon: CheckSquare, status: "Coming soon" },
  { label: "Clients", href: "/dashboard/clients", icon: Users, status: "Coming soon" },
  { label: "Documents", href: "/dashboard/documents", icon: Files, status: "Coming soon" },
  { label: "Billing", href: "/dashboard/billing", icon: CircleDollarSign, status: "Coming soon" },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, status: "Coming soon" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const { data: roleRecord } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("active", true).maybeSingle();
  const role = (roleRecord?.role ?? "reviewer") as PracticeRole;
  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Team member";

  return (
    <div className="min-h-screen bg-muted/30 md:flex">
      <aside className="flex w-full flex-col border-b border-border bg-card md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">AK</span>
          <div><p className="text-sm font-semibold">AK &amp; Associates</p><p className="text-xs text-muted-foreground">Practice workspace</p></div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-3 md:flex-col md:overflow-visible md:py-5">
          {navigation.map(({ label, href, icon: Icon, status }) => (
            <Link key={href} href={href} title={status} aria-disabled={status !== "Active"} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${status === "Active" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="size-4" />{label}{status !== "Active" && <span className="ml-auto hidden text-[10px] md:inline">Soon</span>}
            </Link>
          ))}
        </div>
        <div className="mt-auto hidden border-t border-border p-3 md:block">
          <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><Settings2 className="size-4" />Workspace settings<span className="ml-auto text-[10px]">Soon</span></Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="hidden sm:inline">Practice workspace</span><span className="hidden sm:inline">/</span><span className="font-medium text-foreground">Overview</span></div>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg p-1.5 hover:bg-muted"><span className="grid size-9 place-items-center rounded-full bg-muted text-xs font-semibold">{displayName.slice(0, 2).toUpperCase()}</span><span className="hidden text-left sm:block"><span className="block text-sm font-medium">{displayName}</span><span className="block text-xs text-muted-foreground">{roleLabels[role] ?? roleLabels.reviewer}</span></span><ChevronDown className="size-4 text-muted-foreground" /></summary>
            <div className="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-border bg-card p-2 shadow-lg"><p className="px-2 py-2 text-xs text-muted-foreground">{user.email}</p><form action={logoutAction}><Button type="submit" variant="ghost" className="w-full justify-start">Sign out</Button></form></div>
          </details>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
