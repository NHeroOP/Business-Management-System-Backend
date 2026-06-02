import { PRODUCT_TYPE } from "@/consts.js";
import * as z from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be a positive number"),
  type: z.enum(Object.values(PRODUCT_TYPE), "Type must be either 'PRODUCT' or 'SERVICE'"),
  description: z.string().optional(),
  stockQuantity: z.number().int().nonnegative("Stock quantity must be a non-negative integer"),
  sku: z.string().optional(),
  category: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const FindProductsQuerySchema = z.object({
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
});

export type FindProductsQuery = z.infer<typeof FindProductsQuerySchema>;

export const productIdParamSchema = z.object({
  productId: z.string().min(24, "Product ID is required"),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  price: z.number().positive("Price must be a positive number").optional(),
  type: z.enum(Object.values(PRODUCT_TYPE), "Type must be either 'PRODUCT' or 'SERVICE'").optional(),
  description: z.string().optional(),
  stockQuantity: z.number().int().nonnegative("Stock quantity must be a non-negative integer").optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;