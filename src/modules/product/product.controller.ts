import type { Request, Response } from "express";

import {
  createProduct as createProductService,
  findProducts,
  findProductById,
  updateProduct as updateProductService,
  archiveProduct
} from "./product.service.js";
import {
  createProductSchema,
  FindProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema
} from "./product.validation.js";  

import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";


export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = createProductSchema.parse(req.body);

  const product = await createProductService({
    businessId: req.workspace!.businessId,
    createdBy: req.user!._id,
    ...(req.file && { imageUrl: req.file.path }),
    ...body
  });

  return res.status(201).json(
    new ApiResponse(201, product, "Product created successfully")
  );
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, sortBy } = FindProductsQuerySchema.parse(req.query);

  const products = await findProducts({
    businessId: req.workspace!.businessId,
    page,
    limit,
    search,
    sortBy,
  });

  return res.status(200).json(
    new ApiResponse(200, products, "Products retrieved successfully")
  );
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = productIdParamSchema.parse(req.params);

  const product = await findProductById({
    businessId: req.workspace!.businessId,
    productId
  });

  return res.status(200).json(
    new ApiResponse(200, product, "Product retrieved successfully")
  );
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = updateProductSchema.parse(req.body);
  const { productId } = productIdParamSchema.parse(req.params);

  const updatePayload = {
    businessId: req.workspace!.businessId,
    productId,
    ...body,
  }

  await updateProductService(updatePayload);

  return res.status(200).json(
    new ApiResponse(200, {}, "Product updated successfully")
  );
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = productIdParamSchema.parse(req.params);

  await archiveProduct({
    businessId: req.workspace!.businessId,
    productId
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Product archived successfully")
  );
});