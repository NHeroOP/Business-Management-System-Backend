import * as z from "zod";

export const registerSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const registerRequestSchema = registerSchema.extend({
  avatarUrl: z.any().openapi({
    type: "string",
    format: "binary",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export type RegisterPayload = RegisterInput & {
  avatarLocalPath?: string;
}

export const loginSchema = z.object({
  identifier: z.union([
    z.string().min(4, "Username must be at least 4 characters").optional(),
    z.email("Invalid email address").optional()
  ]),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.string("Invalid refresh token")

export const sendVerificationEmailSchema = z.email("Invalid email address")
export type SendVerificationEmailInput = z.infer<typeof sendVerificationEmailSchema>

export const verifyVerificationCodeSchema = z.object({
  email: z.email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 characters")
})
export type VerifyVerificationCodeInput = z.infer<typeof verifyVerificationCodeSchema>

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  userId: z.string().length(24, "User ID is required"),
  token: z.string().length(64, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;