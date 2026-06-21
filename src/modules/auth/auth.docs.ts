import { registry } from "@/docs/registry.js";
import {
  registerRequestSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyVerificationCodeSchema,
  sendVerificationEmailSchema,
} from "./auth.validation.js";
import { authSecurity } from "@/docs/common.js";


registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  description: "Creates a new user account.",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: registerRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully",
    },
    400: {
      description: "Validation error",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login user",
  description: "Authenticates a user and returns access and refresh tokens.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User logged in successfully",
    },
    401: {
      description: "Invalid credentials",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout user",
  security: authSecurity,
  responses: {
    200: {
      description: "User logged out successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh-token",
  tags: ["Auth"],
  summary: "Refresh access token",
  description: "Uses a refresh token cookie or request body token to issue new tokens.",
  responses: {
    200: {
      description: "Access token refreshed successfully",
    },
    401: {
      description: "Invalid refresh token",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/verification-code/send",
  tags: ["Auth"],
  summary: "Send verification code",
  description: "Sends a verification code to the user's email or phone number.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: sendVerificationEmailSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "If email exists, verification code will be sent",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/verification-code/verify",
  tags: ["Auth"],
  summary: "Verify verification code",
  description: "Verifies the verification code sent to the user's email or phone number.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: verifyVerificationCodeSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Verification code verified successfully",
    },
    400: {
      description: "Invalid verification code or email",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/forgot-password",
  tags: ["Auth"],
  summary: "Send password reset email",
  request: {
    body: {
      content: {
        "application/json": {
          schema: forgotPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset email sent successfully",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/reset-password",
  tags: ["Auth"],
  summary: "Reset user password",
  request: {
    body: {
      content: {
        "application/json": {
          schema: resetPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset successfully",
    },
    400: {
      description: "Invalid or expired reset token",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Get current user",
  security: authSecurity,
  responses: {
    200: {
      description: "Current user fetched successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/google",
  tags: ["Auth"],
  summary: "Start Google OAuth flow",
  responses: {
    302: {
      description: "Redirects to Google OAuth",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/google/callback",
  tags: ["Auth"],
  summary: "Google OAuth callback",
  responses: {
    200: {
      description: "Google login successful",
    },
  },
});