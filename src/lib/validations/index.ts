import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CITIZEN", "AUTHORITY", "FIELD_WORKER"]).default("CITIZEN"),
  departmentId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().url("Valid image URL is required"),
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  address: z.string().min(3, "Address is required"),
  wardZone: z.string().min(2, "Ward/Zone is required"),
  categoryId: z.string().min(1, "Category is required"),
});

export const verificationSchema = z.object({
  voteType: z.enum(["CONFIRM", "FLAG_FALSE"]),
  comment: z.string().max(300).optional(),
});

export const workerStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "RESOLVED"]),
  afterProofUrl: z.string().url("Valid repair proof image URL is required").optional(),
  notes: z.string().optional(),
});

export const signoffSchema = z.object({
  decision: z.enum(["ACCEPT", "REOPEN"]),
  satisfactionRating: z.number().min(1).max(5).optional(),
  feedback: z.string().max(500).optional(),
});
