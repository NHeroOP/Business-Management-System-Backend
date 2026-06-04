import ENV from "@/env.js";

export const cookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const PASSWORD_RESET_EMAIL_TEMPLATE_ID = "ea7ca73e-e2aa-4be1-9f85-1fc57e6c6898"