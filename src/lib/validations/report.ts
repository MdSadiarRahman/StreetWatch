import { z } from "zod";

export const createReportSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(15, "Description must be at least 15 characters to explain the issue properly")
    .max(2000, "Description cannot exceed 2000 characters"),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  address: z.string().min(3, "Specific street address or landmark is required"),
  wardZone: z.string().min(2, "Ward or Zone name is required"),
  categoryId: z.string().min(1, "Please select an issue category"),
  imageUrl: z.string().optional().default("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
