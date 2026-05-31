import type { Request, Response } from "express";

import {
  createInvoice as createInvoiceService,
  findInvoices,
  findInvoiceById,
  updateInvoice as updateInvoiceService,
  archiveInvoice,
  changeINVOICE_STATUS,
  generateInvoicePdf,
} from "./invoice.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { Types } from "mongoose";

export const createInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    await createInvoiceService({
      userId: req.user!._id,
      businessId: req.workspace!.businessId,
      ...req.body,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, {}, "Invoice created successfully"));
  },
);

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const {
    email,
    name,
    sortBy = "createdAt",
    sortOrder = -1,
    page = 1,
    limit = 10,
  } = req.query;
  const invoices = await findInvoices({
    businessId: req.workspace!.businessId,
    email: email as string,
    name: name as string,
    options: {
      sortBy: sortBy as string,
      sortOrder: parseInt(sortOrder as string) === 1 ? 1 : -1,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 10,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, invoices, "Invoices fetched successfully"));
});

export const getInvoiceById = asyncHandler(
  async (req: Request, res: Response) => {
    const invoice = await findInvoiceById({
      invoiceId: req.params.invoiceId as string | Types.ObjectId,
      businessId: req.workspace!.businessId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, invoice, "Invoice fetched successfully"));
  },
);

export const updateInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    await updateInvoiceService({
      invoiceId: req.params.invoiceId as string | Types.ObjectId,
      businessId: req.workspace!.businessId,
      ...req.body,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Invoice updated successfully"));
  },
);

export const deleteInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    await archiveInvoice({
      invoiceId: req.params.invoiceId as string | Types.ObjectId,
      businessId: req.workspace!.businessId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Invoice archived successfully"));
  },
);

export const updateINVOICE_STATUS = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.body;
    await changeINVOICE_STATUS({
      invoiceId: req.params.invoiceId as string | Types.ObjectId,
      businessId: req.workspace!.businessId,
      status,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Invoice status updated successfully"));
  },
);

export const downloadInvoicePdf = asyncHandler(
  async (req: Request, res: Response) => {
    const invoice = await generateInvoicePdf({
      invoiceId: req.params.invoiceId as string | Types.ObjectId,
      businessId: req.workspace!.businessId,
    });
  },
);
