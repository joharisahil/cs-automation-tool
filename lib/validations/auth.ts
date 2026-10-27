import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export const recoverySchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const passwordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
