import { Router } from "express";
import { googleAuth, loginUser, logoutUser, registerUser, sendEmail } from "../controllers/auth.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import passport from "passport";


const router = Router();

router.route("/register")
  .post(upload.single("avatarUrl"), registerUser);

router.route("/login")
  .post(loginUser);

router.route("/logout")
  .post(verifyJWT, logoutUser);

router.route("/send-email")
  .post(sendEmail);

router.route("/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.route("/google/callback").get(
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
    failureMessage: "Failed to login with Google",
  }),
  googleAuth
);

  
export default router;