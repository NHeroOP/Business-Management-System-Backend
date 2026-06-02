import { Router } from "express";

import {
  changePassword,
  getMyProfile,
  getUserById,
  updateAvatar,
  updateMyProfile, 
} from "./user.controller.js";

import { upload } from "@/shared/middlewares/multer.middleware.js";
import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT)

router.route("/me")
  .get(getMyProfile)
  .patch(updateMyProfile);

router.route("/change-password")
  .patch(changePassword);

router.route("/update-avatar")
  .patch(upload.single("avatarUrl"), updateAvatar);

router.route("/:userId").get(getUserById);

export default router;
