import type { Request, Response } from "express"

import {
  createPayment as createPaymentService,
  findPaymentById,
  findPayments,
} from "./payment.service.js";
import { createPaymentSchema, getPaymentsSchema, paymentIdParamSchema } from "./payment.validation.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js"
import type { Types } from "mongoose";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const body = createPaymentSchema.parse(req.body);
  await createPaymentService({
    businessId: req.workspace!.businessId,
    createdBy: req.user!._id,
    ...body
  })

  return res.status(201).json(
    new ApiResponse(201, {}, "Payment created successfully")
  );
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const query = getPaymentsSchema.parse(req.query);
  const payments = await findPayments({
    businessId: req.workspace!.businessId,
    ...query
  });

  return res.status(200).json(
    new ApiResponse(200, payments, "Payments retrieved successfully")
  );
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = paymentIdParamSchema.parse(req.params);
  const payment = await findPaymentById({
    businessId: req.workspace!.businessId,
    paymentId,
  })

  return res.status(200).json(
    new ApiResponse(200, payment, "Payment retrieved successfully")
  );
});