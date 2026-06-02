import type { Request, Response } from "express";

import {
  createInvoice as createInvoiceService,
  findInvoices,
  findInvoiceById,
  updateInvoice as updateInvoiceService,
  archiveInvoice,
  changeInvoiceStatus,
  generateInvoicePdf,
} from "./invoice.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { Types } from "mongoose";
import { createInvoiceSchema, getInvoicesSchema, invoiceIdParamSchema, updateInvoiceSchema, updateInvoiceStatusSchema } from "./invoice.validation.js";

export const createInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createInvoiceSchema.parse(req.body);
    
    await createInvoiceService({
      userId: req.user!._id,
      businessId: req.workspace!.businessId,
      ...body,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, {}, "Invoice created successfully"));
  },
);

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const query = getInvoicesSchema.parse(req.query);
  const invoices = await findInvoices({
    businessId: req.workspace!.businessId,
    ...query,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, invoices, "Invoices fetched successfully"));
});

export const getInvoiceById = asyncHandler(
  async (req: Request, res: Response) => {
    const { invoiceId } = invoiceIdParamSchema.parse(req.params);
    const invoice = await findInvoiceById({
      businessId: req.workspace!.businessId,
      invoiceId
    });

    return res
      .status(200)
      .json(new ApiResponse(200, invoice, "Invoice fetched successfully"));
  },
);

export const updateInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const { invoiceId } = invoiceIdParamSchema.parse(req.params);
    const body = updateInvoiceSchema.parse(req.body);
    await updateInvoiceService({
      businessId: req.workspace!.businessId,
      invoiceId,
      ...body,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Invoice updated successfully"));
  },
);

export const deleteInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const { invoiceId } = invoiceIdParamSchema.parse(req.params);
    await archiveInvoice({
      businessId: req.workspace!.businessId,
      invoiceId
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Invoice archived successfully"));
  },
);

export const updateInvoiceStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = updateInvoiceStatusSchema.parse(req.body);
    const { invoiceId } = invoiceIdParamSchema.parse(req.params);
    await changeInvoiceStatus({
      businessId: req.workspace!.businessId,
      invoiceId,
      status,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Invoice status updated successfully"));
  },
);

export const downloadInvoicePdf = asyncHandler(
  async (req: Request, res: Response) => {
    const { invoiceId } = invoiceIdParamSchema.parse(req.params);
    const pdf = await generateInvoicePdf({
      businessId: req.workspace!.businessId,
      invoiceId
    });

    return res
    .contentType("application/pdf")
    .attachment("invoice.pdf")
    .send(pdf);
  },
);
