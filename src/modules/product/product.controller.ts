import type { Request, Response } from "express";
import type { Types } from "mongoose";

import {
  createProduct as createProductService,
  findProducts,
  findProductById,
  updateProduct as updateProductService,
  archiveProduct
} from "./product.service.js";

import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";


export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await createProductService({
    businessId: req.workspace!.businessId,
    createdBy: req.user!._id,
    imageUrl: req.file ? req.file.path : undefined,
    ...req.body
  });

  return res.status(201).json(
    new ApiResponse(201, product, "Product created successfully")
  );
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, sortBy } = req.query;

  const products = await findProducts({
    businessId: req.workspace!.businessId,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
  });

  return res.status(200).json(
    new ApiResponse(200, products, "Products retrieved successfully")
  );
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await findProductById(
    req.params.productId as string
  );

  return res.status(200).json(
    new ApiResponse(200, product, "Product retrieved successfully")
  );
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, type, price, stockQuantity, sku, category } = req.body;

  const updatePayload = {
    productId: req.params.productId as Types.ObjectId | string,
    updateData: {name, description, type, price, stockQuantity, sku, category }
  }

  await updateProductService(updatePayload);

  return res.status(200).json(
    new ApiResponse(200, {}, "Product updated successfully")
  );
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await archiveProduct({
    businessId: req.workspace!.businessId,
    productId: req.params.productId as string,
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Product archived successfully")
  );
});