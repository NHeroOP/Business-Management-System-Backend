import { Router } from "express";
import {
  forgotPassword,
  getCurrentUser,
  googleAuth,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
} from "./auth.controller.js";

import { upload } from "@/shared/middlewares/multer.middleware.js";
import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import passport from "passport";

const router = Router();

router.route("/register").post(upload.single("avatarUrl"), registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

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
