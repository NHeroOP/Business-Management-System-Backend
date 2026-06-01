import * as z from "zod";

export const createBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.url("Invalid URL").optional(),
  description: z.string().optional()
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>

export const updateBusinessDetailsSchema = z.object({
  name: z.string().min(1, "Business name is required").optional(),
  email: z.email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.url("Invalid URL").optional(),
  description: z.string().optional()
});

export type UpdateBusinessDetailsInput = z.infer<typeof updateBusinessDetailsSchema>;

export const updateBusinessLogoSchema = z.object({
  logoUrl: z.string().optional()
});

export type UpdateBusinessLogoInput = z.infer<typeof updateBusinessLogoSchema>;