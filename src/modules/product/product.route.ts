import { Router } from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
 } from "./product.controller.js";

import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";
import { upload } from "@/shared/middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT, resolveWorkspace);

router.route("/")
  .get(getProducts)
  .post(upload.single("imageUrl"), createProduct);

router.route("/:productId")
  .get(getProductById)
  .patch(updateProduct)
  .delete(deleteProduct);

export default router;