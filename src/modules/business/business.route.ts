import { Router } from "express";

import {
  createBusiness,
  getCurrentBusiness,
  updateBusiness,
  updateBusinessLogo
} from "./business.controller.js";

import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { upload } from "@/shared/middlewares/multer.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { Business_Roles } from "@/consts.js";


const router = Router();

router.use(verifyJWT)

router.route("/")
  .post(upload.single("logoUrl"), createBusiness)
  
router.route("/:businessId")
  .get(getCurrentBusiness)
  .patch(requireRole(Business_Roles.OWNER), updateBusiness)

router.route("/:businessId/logo")
  .patch(
    requireRole(Business_Roles.OWNER),
    upload.single("logoUrl"),
    updateBusinessLogo
  );

export default router;
