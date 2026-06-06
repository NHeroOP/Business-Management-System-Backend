import type { Types } from "mongoose";
import type { IInvoiceItem } from "./Invoice.model.js";

type calculateInvoiceTotalsParams = {
  items: IInvoiceItem[];
  discount?: number;
  tax?: number;
}

type InvoiceItemInput = {
  productId: Types.ObjectId | string;
  quantity: number;
}

export const calculateInvoiceTotals = (
  { items, discount = 0, tax = 0, }: calculateInvoiceTotalsParams
) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const afterDiscount = subtotal - (subtotal * discount) / 100;
  const total = afterDiscount + (afterDiscount * tax) / 100;
  return { subtotal, total };
};


export const mergeItems = (items: InvoiceItemInput[]) => Object.values(
  items.reduce((acc, item): Record<string, InvoiceItemInput> => {
    if (acc[item.productId.toString()]) {
      acc[item.productId.toString()]!.quantity += item.quantity;
    } else {
      acc[item.productId.toString()] = { ...item };
    }
    return acc;
  }, {}),
);