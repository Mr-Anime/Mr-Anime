import * as z from "zod";
import { LIST_STATUSES } from "@/lib/list-shared";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, {
    error: "Username must be 3-20 characters: lowercase letters, numbers, underscores.",
  });

export const emailSchema = z.email({ error: "Enter a valid email address." });

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(72, { error: "Password must be at most 72 characters." }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Password is required." }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(72, { error: "Password must be at most 72 characters." }),
});

export const updateProfileSchema = z.object({
  username: usernameSchema,
  avatar_url: z
    .string()
    .trim()
    .max(500, { error: "Avatar URL is too long." })
    .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), {
      error: "Avatar URL must be a valid http(s) URL.",
    }),
});

export const changePasswordSchema = z.object({
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(72, { error: "Password must be at most 72 characters." }),
});

export const apiTokenNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Token name is required." })
  .max(60, { error: "Token name must be at most 60 characters." });

export const reportSchema = z.object({
  anilistId: z.coerce.number().int().positive(),
  episode: z.coerce.number().int().min(1).max(10000),
  provider: z.string().trim().min(1).max(64),
  message: z.string().trim().max(1000).optional().default(""),
});

export const commentSchema = z.object({
  anilistId: z.coerce.number().int().positive(),
  episode: z.coerce.number().int().min(1).max(10000).nullable().default(null),
  content: z
    .string()
    .trim()
    .min(1, { error: "Comment cannot be empty." })
    .max(1000, { error: "Comment must be 1000 characters or fewer." }),
});

export const listAnilistIdSchema = z.coerce.number().int().positive();

export const listStatusSchema = z.enum(LIST_STATUSES, {
  error: "Pick a valid list status.",
});

export const listProgressSchema = z.object({
  anilistId: listAnilistIdSchema,
  episodesWatched: z.coerce.number().int().min(0).max(10000),
});

export const markWatchedSchema = z.object({
  anilistId: listAnilistIdSchema,
  episode: z.coerce.number().int().min(1).max(10000),
  total: z.coerce.number().int().min(0).max(10000),
});

export type FieldErrors<T extends Record<string, unknown>> = Partial<
  Record<keyof T, string[]>
>;

export type AuthFormState = {
  errors?: FieldErrors<Record<string, string>>;
  values?: Record<string, string>;
  message?: string;
  success?: string;
} | undefined;

export function flattenErrors(error: z.ZodError): FieldErrors<Record<string, string>> {
  const out: FieldErrors<Record<string, string>> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
