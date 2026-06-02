import * as z from "zod";

export const userIdParamSchema = z.object({
  userId: z.string().trim().length(24, "User ID is required")
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(4, "Full name is required")
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(6, "Current password is required"),
  newPassword: z.string().trim().min(6, "New password must be at least 6 characters long")
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;