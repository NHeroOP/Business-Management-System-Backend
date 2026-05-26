import type { Request, Response } from "express";

import {
  createBusinessMember,
  createBusiness as createBusinessService,
  findBusinessById,
  updateBusinessDetails,
  updateBusinessLogo as updateBusinessLogoService
} from "./business.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";

export const createBusiness = asyncHandler(async (req: Request, res: Response) => { 
  const business = await createBusinessService({
    payload: req.body,
    createdBy: req.user?.id,
    logoUrl: req.file?.path
  });

  await createBusinessMember({businessId: business._id, memberId: req.user?.id});

  return res.status(201).json(
    new ApiResponse(201, business, "Business created successfully")
  );
});

export const getCurrentBusiness = asyncHandler(async (req: Request, res: Response) => {

  const business = await findBusinessById(req.params.businessId as string);

  return res.status(200).json(
    new ApiResponse(200, business, "Business fetched successfully")
  );
});

export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
  await updateBusinessDetails({
    businessId: req.params.businessId as string,
    ...req.body
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Business details updated successfully")
  );
});

export const updateBusinessLogo = asyncHandler(async (req: Request, res: Response) => { 
  await updateBusinessLogoService({
    businessId: req.params.businessId as string,
    logoUrl: req.file?.path,
    ...req.body
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Business logo updated successfully")
  );
});