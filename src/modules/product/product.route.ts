import { Router } from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductImage
 } from "./product.controller.js";

import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";
import { upload } from "@/shared/middlewares/multer.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { BUSINESS_ROLE } from "@/consts.js";

const router = Router();

router.use(
  verifyJWT,
  resolveWorkspace,
  requireRole(Object.values(BUSINESS_ROLE))
);

router.route("/")
  .get(getProducts)
  .post(upload.single("imageUrl"), createProduct);

router.route("/:productId")
  .get(getProductById)
  .patch(updateProduct)
  .delete(deleteProduct);

router.route("/:productId/image")
  .patch(upload.single("imageUrl"), updateProductImage);

export default router;