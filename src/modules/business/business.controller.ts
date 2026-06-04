import type { Request, Response } from "express";

import {
  createBusiness as createBusinessService,
  findBusinessById,
  updateBusinessDetails,
  updateBusinessLogo as updateBusinessLogoService
} from "./business.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { createBusinessSchema, updateBusinessDetailsSchema, updateBusinessLogoSchema } from "./business.validation.js";

export const createBusiness = asyncHandler(async (req: Request, res: Response) => { 
  const data = createBusinessSchema.parse(req.body)
  const business = await createBusinessService({
    createdBy: req.user!._id,
    ...(req.file?.path && { logoUrl: req.file.path }),
    ...data
  });

  return res.status(201).json(
    new ApiResponse(201, business, "Business created successfully")
  );
});

export const getCurrentBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await findBusinessById(req.workspace!.businessId);

  return res.status(200).json(
    new ApiResponse(200, business, "Business fetched successfully")
  );
});

export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
  const body = updateBusinessDetailsSchema.parse(req.body);
  await updateBusinessDetails({
    businessId: req.workspace!.businessId,
    ...body
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Business details updated successfully")
  );
});

export const updateBusinessLogo = asyncHandler(async (req: Request, res: Response) => { 
  const body = updateBusinessLogoSchema.parse(req.body);
  await updateBusinessLogoService({
    businessId: req.workspace!.businessId,
    logoUrl: req.file?.path,
    ...body
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Business logo updated successfully")
  );
});