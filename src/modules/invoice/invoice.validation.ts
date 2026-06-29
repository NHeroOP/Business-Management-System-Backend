import * as z from "zod";
import { allowedInvoiceSortFields, INVOICE_STATUS } from "@/consts.js";

export const createInvoiceSchema = z.object({
  clientId: z.string().length(24, "Invalid client ID format"),
  items: z.array(
    z.object({
      productId: z.string().length(24, "Invalid product ID format"),
      quantity: z.number().int().positive("Quantity must be a positive integer"),
    }),
  ).min(1, "At least one invoice item is required"),
  discount: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot be greater than 100")
    .optional(),
  tax: z
    .number()
    .min(0, "Tax cannot be negative")
    .max(100, "Tax cannot be greater than 100")
    .optional(),
  notes: z.string().optional(),
  dueDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const getInvoicesSchema = z.object({
  email: z.email().optional(),
  name: z.string().optional(),
  sortBy: z.enum(allowedInvoiceSortFields).optional(),
  sortOrder: z.union([z.literal(1), z.literal(-1)]).optional(),
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().optional(),
});

export type FindInvoicesInput = z.infer<typeof getInvoicesSchema>;

export const invoiceIdParamSchema = z.object({
  invoiceId: z.string().length(24, "Invalid invoice ID format"),
});

export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>;

export const updateInvoiceSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().length(24, "Invalid product ID format"),
      quantity: z.number().int().positive("Quantity must be a positive integer"),
    }),
  ).optional(),
  discount: z.number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot be greater than 100")
    .optional(),
  tax: z.number()
    .min(0, "Tax cannot be negative")
    .max(100, "Tax cannot be greater than 100")
    .optional(),
  notes: z.string().optional(),
  dueDate:z.date().optional(),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(Object.values(INVOICE_STATUS)),
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
