import { Router } from "express";
import passport from "passport";

import {
  forgotPassword,
  getCurrentUser,
  googleAuth,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  sendVerificationCode,
  verifyVerificationCode,
} from "./auth.controller.js";

import { upload } from "@/shared/middlewares/multer.middleware.js";
import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { forgotPasswordLimiter, resetPasswordLimiter, loginLimiter } from "@/shared/middlewares/rateLimit.middleware.js";

const router = Router();

router.route("/register").post(upload.single("avatarUrl"), registerUser);
router.route("/login").post(loginLimiter, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/verification-code/send").post(sendVerificationCode)
router.route("/verification-code/verify").post(verifyVerificationCode)


router.route("/forgot-password")
  .post(forgotPasswordLimiter, forgotPassword);
router.route("/reset-password")
  .post(resetPasswordLimiter,resetPassword);

router.route("/me").get(verifyJWT, getCurrentUser);

router.route("/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.route("/google/callback").get(
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
    failureMessage: "Failed to login with Google",
  }),
  googleAuth,
);

export default router;
