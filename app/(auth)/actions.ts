"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { loginSchema, recoverySchema, passwordSchema } from "@/lib/validations/auth";
import { getPublicEnvironment } from "@/lib/env";

export type AuthActionState = { error?: string; success?: string };

export async function loginAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logger.info("auth.login_failed", { reason: error.code ?? "auth_error" });
    return { error: "Email or password was incorrect." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) logger.error("auth.logout_failed", { code: error.code ?? "unknown" });
  redirect("/login");
}

export async function recoveryAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };

  const supabase = await createClient();
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnvironment();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(NEXT_PUBLIC_SUPABASE_URL).origin}/reset-password`,
  });
  if (error) logger.error("auth.recovery_request_failed", { code: error.code ?? "unknown" });
  return { success: "If an account exists for that email, recovery instructions have been sent." };
}

export async function resetPasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "The recovery link is invalid or expired. Request a new one." };
  redirect("/dashboard");
}
