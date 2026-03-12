import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email noto'g'ri ko'rinishda."),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lsin."),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Ism-familiya kiriting."),
  workspaceName: z.string().min(2, "Workspace nomini kiriting."),
  email: z.string().email("Email noto'g'ri ko'rinishda."),
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lsin."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email noto'g'ri ko'rinishda."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lsin."),
    confirmPassword: z
      .string()
      .min(8, "Parol kamida 8 ta belgidan iborat bo'lsin."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Parollar bir xil bo'lishi kerak.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
