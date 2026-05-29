import { startSession, Types } from "mongoose"

import { Client } from "../client/Client.model.js";
import { Product } from "../product/Product.model.js";
import { Invoice, type IInvoiceDocument } from "./Invoice.model.js"
import { InvoiceCounter } from "../invoiceCounter/InvoiceCounter.model.js";

import { ApiError } from "@/shared/utils/ApiError.js"
import { allowedSortFields } from "./invoice.const.js";


interface InvoiceItemInput {
  productId: Types.ObjectId | string;
  quantity: number;
}

interface createInvoicePayload {
  userId: Types.ObjectId | string;
  businessId: Types.ObjectId | string ;
  clientId: Types.ObjectId | string;
  items: InvoiceItemInput[];
  tax?: number;
  discount?: number;
  dueDate?: Date;
  notes?: string;
}

interface FindInvoicesPayload {
  businessId: Types.ObjectId | string,
  email?: string;
  name?: string;
  options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
}

export const createInvoice = async (
  payload: createInvoicePayload
): Promise<IInvoiceDocument> => {
  const { userId, businessId, clientId, items, discount, tax, dueDate, notes } = payload;

  if (items.length === 0) {
    throw new ApiError(400, "Invoice must have at least one item");
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      throw new ApiError(400, "Item quantity must be greater than zero" );
    }
    if (!item.productId) {
      throw new ApiError(400, "Item productId is required");
    }
  }
  
  if (discount !== undefined) {
    if (discount < 0) {
      throw new ApiError(400, "Discount cannot be negative");
    }
    if (discount > 100) {
      throw new ApiError(400, "Discount cannot be greater than 100");
    }
  }

  if (tax !== undefined) {
    if (tax < 0) {
      throw new ApiError(400, "Tax cannot be negative");
    }
    if (tax > 100) {
      throw new ApiError(400, "Tax cannot be greater than 100");
    }
  }

  if (!clientId) {
    throw new ApiError(400, "clientId is required");
  }

  const clientExist = await Client.exists({
    _id: clientId,
    businessId,
    isArchived: false,
  })

  if (!clientExist) {
    throw new ApiError(404, "Client not found");
  }

  const mergedItems = Object.values(items.reduce((acc, item): Record<string, InvoiceItemInput> => {
    if (acc[item.productId.toString()]) {
      acc[item.productId.toString()]!.quantity += item.quantity;
    } else {
      acc[item.productId.toString()] = { ...item };
    }
    return acc;
  }, {}))

  const products = await Product.find({
    _id: { $in: mergedItems.map(item => item.productId) },
    businessId,
    isArchived: false,
  }).select("_id name price").lean();

  if (products.length !== mergedItems.length) {
    throw new ApiError(400, "One or more products not found");
  }

  const productMap = new Map(
    products.map(product => [
      product._id.toString(),
      product,
    ])
  );
  
  const invoiceItems = mergedItems.map(item => {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw new ApiError(400, `Product with id ${item.productId} not found`);
    }
    return {
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      total: product.price * item.quantity
    }
  })

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const totalAfterDiscount = subtotal - (discount !== undefined ? (subtotal * (discount / 100)) : 0);
  const totalAfterTax = totalAfterDiscount + (tax !== undefined ? (totalAfterDiscount * (tax / 100)) : 0);
  const year = new Date().getFullYear();


  let invoice: IInvoiceDocument | undefined;

  const session = await startSession();
  session.startTransaction();

  try {
    const counter = await InvoiceCounter.findOneAndUpdate(
      {
        businessId,
        year,
      },
      {
        $inc: {
          sequence: 1,
        },
      },
      {
        new: true,
        upsert: true,
      },
    ).session(session);
  
    if (!counter) {
      throw new ApiError(500, "Failed to generate invoice number");
    }
  
    const invoiceNumber = `INV-${year}-${String(counter.sequence).padStart(4, "0")}`;
  
    [invoice] = await Invoice.create([{
      businessId,
      createdBy: userId,
      client: clientId,
      items: invoiceItems,
      subtotal,
      total: totalAfterTax,
      invoiceNumber,
      ...(tax !== undefined && { tax }),
      ...(discount !== undefined && { discount }),
      ...(dueDate && { dueDate }),
      ...(notes && { notes }),
    }], { session });
    
    await session.commitTransaction();
    
  }
  catch (error: any) {
    await session.abortTransaction();
    throw error instanceof ApiError ? error :  new ApiError(500, error.message || "Failed to create invoice", [], error instanceof Error ? error.stack : undefined);
  }
  finally {
    await session.endSession();
  }

  if (!invoice) {
    throw new ApiError(500, "Failed to create invoice");
  }

  return invoice;
}

export const findInvoices = async (
  payload: FindInvoicesPayload
) => {
  const { businessId, email, name, options } = payload;

  const sortBy = allowedSortFields.includes(options.sortBy ?? "") ? options.sortBy! : "issuedDate";
  const sortOrder = options.sortOrder === "asc" ? 1 : -1;

  const invoiceAggregate = Invoice.aggregate([
    {
      $match: {
        businessId: new Types.ObjectId(businessId),
      }
    },
    {
      $lookup: {
        from: "clients",
        localField: "client",
        foreignField: "_id",
        as: "client",
        pipeline: [
          {
            $project: {
              name: 1,
              email: 1,
              phone: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        client: {
          $arrayElemAt: ["$client", 0]
        }
      }
    },
    {
      $match: {
        ...(email && { "client.email": { $regex: email, $options: "i" } }),
        ...(name && { "client.name": { $regex: name, $options: "i" } }),
      },
    },
    {
      $sort: {
        [sortBy]: sortOrder,
      },
    }, 
    {
      $project: {
        metadata: 0,
        __v: 0,
      }
    }
  ])


  const invoices = await Invoice.aggregatePaginate(invoiceAggregate, {
    page: options.page || 1,
    limit: options.limit || 10
  })


  return invoices;
}

export const findInvoiceById = async() => {}

export const updateInvoice = async() => {}

export const archiveInvoice = async() => {}

export const changeInvoiceStatus = async() => {}

export const generateInvoicePdf = async() => {}