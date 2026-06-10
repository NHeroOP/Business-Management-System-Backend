import type { Request, Response } from "express";

import { getAnalytics as getAnalyticsService } from "./analytics.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";


export const getAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const businessId = req.workspace!.businessId;

    const analytics = await getAnalyticsService(businessId);
    
    return res.status(200).json(new ApiResponse(
      200,
      analytics,
      "Analytics fetched successfully"
    ));

  }
)