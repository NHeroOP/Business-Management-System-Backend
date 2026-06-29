import { PAYMENT_METHOD, PAYMENT_STATUS } from "@/consts.js";
import * as z from "zod";

export const createPaymentSchema = z.object({
  invoiceId: z.string().length(24, "Invalid invoice ID"),
  amount: z.number().positive(),
  method: z.enum(Object.values(PAYMENT_METHOD)).optional(),
  status: z.enum(Object.values(PAYMENT_STATUS)).optional(),
  transactionId: z.string().optional(),
  paidAt: z.date().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const getPaymentsSchema = z.object({
  invoiceId: z.string().length(24, "Invalid invoice ID").optional(),
  status: z.enum(Object.values(PAYMENT_STATUS)).optional(),
  method: z.enum(Object.values(PAYMENT_METHOD)).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.union([z.literal(1), z.literal(-1)]).optional(),
  page: z.coerce.number().int().positive("Page must be a positive integer").optional(),
  limit: z.coerce.number().int().positive("Limit must be a positive integer").optional(),
});

export type FindPaymentsInput = z.infer<typeof getPaymentsSchema>;

export const paymentIdParamSchema = z.object({
  paymentId: z.string().length(24, "Invalid payment ID"),
});

export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;