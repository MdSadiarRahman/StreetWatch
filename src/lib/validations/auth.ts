import { z } from "zod";
import { strongPasswordSchema } from "@/lib/auth/password-policy";

const SAFE_AVATAR_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i;
export const MAX_AVATAR_DATA_URL_LENGTH = 700_000; // ~512KB image binary encoded in base64

export const avatarUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      if (val.startsWith("data:image/")) {
        return SAFE_AVATAR_DATA_URL_REGEX.test(val) && val.length <= MAX_AVATAR_DATA_URL_LENGTH;
      }
      try {
        const parsed = new URL(val);
        return (parsed.protocol === "https:" || parsed.protocol === "http:") && val.length <= 500;
      } catch {
        return false;
      }
    },
    { message: "Avatar must be a PNG, JPEG, or WebP image (max 512KB) or valid image URL." }
  );

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name cannot exceed 60 characters"),
  email: z.string().trim().email("Invalid email address").max(120),
  password: strongPasswordSchema,
  role: z.enum(["CITIZEN", "AUTHORITY", "FIELD_WORKER"]).optional().default("CITIZEN"),
  departmentId: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(60, "Full name cannot exceed 60 characters"),
  phone: z
    .string()
    .trim()
    .max(24, "Phone number is too long")
    .refine(
      (val) => !val || /^[+]?[0-9\s\-().]{7,20}$/.test(val),
      "Enter a valid phone number (e.g. +880 1711-000000)"
    )
    .optional()
    .nullable(),
  ward: z.string().trim().max(40, "Ward value is too long").optional().nullable(),
  location: z.string().trim().max(80, "Location cannot exceed 80 characters").optional().nullable(),
  address: z.string().trim().max(160, "Address cannot exceed 160 characters").optional().nullable(),
  avatarUrl: avatarUrlSchema.optional().nullable(),
});

export const updatePreferencesSchema = z.object({
  notifyStatusUpdates: z.boolean().optional(),
  notifyAssignments: z.boolean().optional(),
  notifyResolutions: z.boolean().optional(),
  notifySystem: z.boolean().optional(),
  prefCompactTables: z.boolean().optional(),
  prefDefaultWard: z.string().trim().max(40).optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(120),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .trim()
      .regex(/^[a-f0-9]{64}$/i, "Invalid reset token format"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  });

export const verifyEmailTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i, "Invalid verification token format"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
