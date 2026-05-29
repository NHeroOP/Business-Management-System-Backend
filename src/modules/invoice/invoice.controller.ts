import type { Request, Response } from 'express';

import {
  createInvoice as createInvoiceService,
  findInvoices,
  findInvoiceById,
  updateInvoice as updateInvoiceService,
  archiveInvoice,
  changeInvoiceStatus,  
  generateInvoicePdf
} from "./invoice.service.js";

import { asyncHandler } from '@/shared/utils/asyncHandler.js';
import { ApiResponse } from '@/shared/utils/ApiResponse.js';

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  await createInvoiceService({
    userId: req.user!._id,
    businessId: req.workspace!.businessId,
    ...req.body
  });

  return res.status(201).json(
    new ApiResponse(201, {}, "Invoice created successfully")
  );
});

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for getting all invoices
});

export const getInvoiceById = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for getting an invoice by ID
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for updating an invoice
});

export const deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for deleting an invoice
});

export const updateInvoiceStatus = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for updating an invoice status
});

export const downloadInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for downloading an invoice as PDF
});