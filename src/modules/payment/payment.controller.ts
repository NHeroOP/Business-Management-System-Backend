import type { Request, Response } from "express"

import {
  createPayment as createPaymentService,
  findPaymentById,
  findPayments,
} from "./payment.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js"
import type { Types } from "mongoose";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import type { PaymentMethod, PaymentStatus } from "@/consts.js";

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  await createPaymentService({
    businessId: req.workspace!.businessId,
    createdBy: req.user!._id,
    ...req.body
  })

  return res.status(201).json(
    new ApiResponse(201, {}, "Payment created successfully")
  );
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await findPayments({
    businessId: req.workspace!.businessId,
    invoiceId: req.query.invoiceId as string | Types.ObjectId,
    status: req.query.status as PaymentStatus,
    method: req.query.method as PaymentMethod,
    fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
    toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    sortBy: req.query.sortBy as string || "createdAt",
    sortOrder: req.query.sortOrder === "asc" ? 1 : -1,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
  });

  return res.status(200).json(
    new ApiResponse(200, payments, "Payments retrieved successfully")
  );
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const payment = await findPaymentById({
    businessId: req.workspace!.businessId,
    paymentId: req.params.paymentId as string | Types.ObjectId,
  })

  return res.status(200).json(
    new ApiResponse(200, payment, "Payment retrieved successfully")
  );
});