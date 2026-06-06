import type { Types } from "mongoose";

import { Product } from "../product/Product.model.js";
import type { IInvoiceItem } from "./Invoice.model.js";

import { ApiError } from "@/shared/utils/ApiError.js";


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
  const total = afterDiscount + (subtotal * tax) / 100;
  return { subtotal, total };
};


export const buildInvoiceItems = async (
  businessId: string | Types.ObjectId,
  items: InvoiceItemInput[],
): Promise<IInvoiceItem[]> => {
  const mergedItems = Object.values(
    items.reduce((acc, item): Record<string, InvoiceItemInput> => {
      if (acc[item.productId.toString()]) {
        acc[item.productId.toString()]!.quantity += item.quantity;
      } else {
        acc[item.productId.toString()] = { ...item };
      }
      return acc;
    }, {})
  );

  const products = await Product.find({
    _id: { $in: mergedItems.map((item) => item.productId) },
    businessId,
    isArchived: false,
  })
    .select("_id name price")
    .lean();

  if (products.length !== mergedItems.length) {
    throw new ApiError(400, "One or more products not found");
  }

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  const invoiceItems = mergedItems.map((item) => {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw new ApiError(400, `Product with id ${item.productId} not found`);
    }
    return {
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      total: product.price * item.quantity,
    };
  });

  return invoiceItems;
};