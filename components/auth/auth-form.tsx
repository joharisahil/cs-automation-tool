"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, recoveryAction, resetPasswordAction, type AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

type Mode = "login" | "recovery" | "reset";

const actions: Record<Mode, (state: AuthActionState, data: FormData) => Promise<AuthActionState>> = {
  login: loginAction,
  recovery: recoveryAction,
  reset: resetPasswordAction,
};

export function AuthForm({ mode }: { mode: Mode }) {
  const [state, action, pending] = useActionState(actions[mode], {});
  const titles: Record<Mode, string> = {
    login: "Welcome back",
    recovery: "Reset your password",
    reset: "Choose a new password",
  };
  const descriptions: Record<Mode, string> = {
    login: "Sign in to continue to your practice workspace.",
    recovery: "We’ll send a secure recovery link if an account exists.",
    reset: "Use at least 12 characters for your new password.",
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
      <Link href="/" className="mb-8 flex items-center gap-3 text-sm font-semibold tracking-tight">
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">AK</span>
        Ajay Khandelwal &amp; Associates
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{titles[mode]}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{descriptions[mode]}</p>
      <form action={action} className="mt-7 space-y-5">
        {mode !== "reset" ? (
          <label className="block space-y-2 text-sm font-medium">
            Email address
            <input name="email" type="email" autoComplete="email" required className="h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
        ) : (
          <>
            <label className="block space-y-2 text-sm font-medium">New password<input name="password" type="password" autoComplete="new-password" minLength={12} required className="h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="block space-y-2 text-sm font-medium">Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required className="h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          </>
        )}
        {mode === "login" && <label className="block space-y-2 text-sm font-medium">Password<input name="password" type="password" autoComplete="current-password" required className="h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>}
        {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
        {state.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}
        <Button type="submit" disabled={pending} className="h-11 w-full">{pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "recovery" ? "Send recovery link" : "Update password"}</Button>
      </form>
      {mode === "login" ? <Link href="/forgot-password" className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground">Forgot password?</Link> : mode === "recovery" ? <Link href="/login" className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground">Return to sign in</Link> : null}
    </div>
  );
}
