import path from "node:path";
import Handlebars from "handlebars";
import fs from "node:fs/promises";
import puppeteer from "puppeteer";
import { startSession, Types } from "mongoose";

import { Client } from "../client/Client.model.js";
import { Product } from "../product/Product.model.js";
import { Business } from "../business/Business.model.js";
import { Invoice, type IInvoiceDocument, type IInvoiceItem } from "./Invoice.model.js";
import { InvoiceCounter } from "../invoiceCounter/InvoiceCounter.model.js";
import type {
  CreateInvoiceInput,
  FindInvoicesInput,
  InvoiceIdParam,
  UpdateInvoiceInput
} from "./invoice.validation.js";

import resend from "@/shared/config/resend.js";
import { ApiError } from "@/shared/utils/ApiError.js";
import {
  allowedInvoiceSortFields,
  INVOICE_SENT_EMAIL_TEMPLATE_ID,
  type InvoiceStatus
} from "@/consts.js";


interface InvoiceItemInput {
  productId: Types.ObjectId | string;
  quantity: number;
}

type createInvoicePayload = CreateInvoiceInput & {
  userId: Types.ObjectId;
  businessId: Types.ObjectId;
}

type FindInvoicesPayload = FindInvoicesInput &{
  businessId: Types.ObjectId;
}

type InvoiceContext = InvoiceIdParam & {
  businessId: Types.ObjectId;
}

type PopulatedClient = {
  name: string | undefined;
  email: string | undefined;
  phone: string | undefined;
};

type UpdateInvoicePayload = UpdateInvoiceInput & InvoiceContext;

type calculateInvoiceTotalsParams = {
  items: IInvoiceItem[];
  discount?: number;
  tax?: number;
}

export const calculateInvoiceTotals = (
  { items, discount = 0, tax = 0, }: calculateInvoiceTotalsParams
) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const afterDiscount = subtotal - (subtotal * discount) / 100;
  const total = afterDiscount + (afterDiscount * tax) / 100;
  return { subtotal, total };
};

export const createInvoice = async (
  payload: createInvoicePayload
): Promise<IInvoiceDocument> => {
  const { userId, businessId, clientId, items, discount, tax, dueDate, notes } =
    payload;

  if (!clientId) {
    throw new ApiError(400, "clientId is required");
  }

  const business = await Business.findOne({
    _id: businessId, isArchived: false
  }).select("settings");

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  const clientExist = await Client.exists({
    _id: clientId,
    businessId,
    isArchived: false,
  });

  if (!clientExist) {
    throw new ApiError(404, "Client not found");
  }

  const mergedItems = Object.values(
    items.reduce((acc, item): Record<string, InvoiceItemInput> => {
      if (acc[item.productId.toString()]) {
        acc[item.productId.toString()]!.quantity += item.quantity;
      } else {
        acc[item.productId.toString()] = { ...item };
      }
      return acc;
    }, {}),
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

  const { subtotal, total } = calculateInvoiceTotals({
    items: invoiceItems,
    ...(discount && {discount: discount}),
    ...(tax && {tax: tax})
  })
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

    const invoiceNumber = `${business.settings.invoicePrefix ?? "INV"}-${year}-${String(counter.sequence).padStart(4, "0")}`;

    [invoice] = await Invoice.create(
      [
        {
          businessId,
          createdBy: userId,
          client: clientId,
          items: invoiceItems,
          subtotal,
          total,
          invoiceNumber,
          ...(tax !== undefined && { tax }),
          ...(discount !== undefined && { discount }),
          ...(dueDate && { dueDate }),
          ...(notes && { notes }),
        },
      ],
      { session },
    );

    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error.message || "Failed to create invoice",
          [],
          error instanceof Error ? error.stack : undefined,
        );
  } finally {
    await session.endSession();
  }

  if (!invoice) {
    throw new ApiError(500, "Failed to create invoice");
  }

  return invoice;
};

export const findInvoices = async (payload: FindInvoicesPayload) => {
  const { businessId, email, name, ...options } = payload;

  const sortBy = allowedInvoiceSortFields.includes(options.sortBy ?? "")
    ? options.sortBy!
    : "issuedDate";
  const sortOrder = options.sortOrder ?? -1;

  const invoiceAggregate = Invoice.aggregate([
    {
      $match: {
        businessId: new Types.ObjectId(businessId),
        isArchived: false,
      },
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
          $arrayElemAt: ["$client", 0],
        },
      },
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
      },
    },
  ]);

  const invoices = await Invoice.aggregatePaginate(invoiceAggregate, {
    page: options.page || 1,
    limit: options.limit || 10,
  });

  return invoices;
};

export const findInvoiceById = async ({ businessId, invoiceId }: InvoiceContext) => {
  if (!invoiceId) {
    throw new ApiError(400, "invoiceId is required");
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    businessId,
    isArchived: false,
  })
    .populate("client", "name email phone")
    .lean()
    .select("-metadata -__v");

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  return invoice;
};

export const updateInvoice = async (payload: UpdateInvoicePayload) => {
  const { businessId, invoiceId, discount, notes, dueDate, tax, items } = payload;
  if (!invoiceId) {
    throw new ApiError(400, "invoiceId is required");
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    businessId,
    isArchived: false,
  });

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  if (["PAID", "CANCELLED"].includes(invoice.status)) {
    throw new ApiError(400, "Cannot update a paid or cancelled invoice");
  }

  if (discount !== undefined) {
    invoice.discount = discount;
  }

  if (notes !== undefined) {
    invoice.notes = notes;
  }

  if (dueDate !== undefined) {
    invoice.dueDate = dueDate;
  }

  if (tax !== undefined) {
    invoice.tax = tax;
  }

  let invoiceItems: IInvoiceItem[] = invoice.items;
  
  if (items && items.length > 0) { 
    const mergedItems = Object.values(
      items.reduce((acc, item): Record<string, InvoiceItemInput> => {
        if (acc[item.productId.toString()]) {
          acc[item.productId.toString()]!.quantity += item.quantity;
        } else {
          acc[item.productId.toString()] = { ...item };
        }
        return acc;
      }, {}),
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

    invoiceItems = mergedItems.map((item) => {
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
    invoice.items = invoiceItems;
  }

  const { subtotal, total } = calculateInvoiceTotals({
    items: invoice.items,
    discount: invoice.discount,
    tax: invoice.tax
  })
  
  invoice.subtotal = subtotal;
  invoice.total = total;

  await invoice.save();

  return invoice;
};

export const archiveInvoice = async ({ invoiceId, businessId }: InvoiceContext) => {
  if (!invoiceId) {
    throw new ApiError(400, "invoiceId is required");
  }

  const invoice = await Invoice.findOneAndUpdate(
    {
      _id: invoiceId,
      businessId,
      isArchived: false,
    },
    { isArchived: true },
    { returnDocument: "after" },
  );

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  return invoice;
};

export const changeInvoiceStatus = async ({
  invoiceId,
  businessId,
  status,
}: InvoiceContext & { status: InvoiceStatus }) => {
  if (!invoiceId) {
    throw new ApiError(400, "invoiceId is required");
  }

  if (!status) {
    throw new ApiError(400, "status is required");
  }

  if (!["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].includes(status)) {
    throw new ApiError(400, "Invalid invoice status");
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    businessId,
    isArchived: false,
  }).populate<{ client: PopulatedClient }>("client", "name email phone");

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  if (["CANCELLED", "PAID"].includes(invoice.status)) {
    throw new ApiError(400, "Cannot change status of a paid or cancelled invoice");
  }

  if (invoice.status === status) {
    throw new ApiError(400, `Invoice is already in ${status} status`);
  }

  invoice.status = status;
  await invoice.save();

  if ( status === "SENT" && invoice.client?.email) {
    const business = await Business.findOne({
      _id: businessId, isArchived: false
    }).select("name").lean();

    await resend.emails.send({
      from: `${business?.name || "Your Company"} <send@no-reply.nhero.me>`,
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${business?.name || "Your Company"}`,
      template: {
        id: INVOICE_SENT_EMAIL_TEMPLATE_ID,
        variables: {
          BUSINESS_NAME: business?.name || "Your Company",
          CUSTOMER_NAME: invoice.client.name || "Valued Customer",
          INVOICE_NUMBER: invoice.invoiceNumber,
          AMOUNT_DUE: `${invoice.total} ${invoice.currency}`,
          DUE_DATE: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A",
        }
      },
    });
  }

  return invoice;
};


export const generateInvoicePdf = async ({
  invoiceId,
  businessId,
}: InvoiceContext)  => {
  if (!invoiceId) {
    throw new ApiError(400, "invoiceId is required");
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    businessId,
    isArchived: false,
  })
    .populate("client", "name email phone")
    .populate("items.productId", "name description price image")
    .lean();
  

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }


  const templatePath = path.join(
    process.cwd(),
    "src/modules/invoice/templates/invoice.hbs",
  );

  const source = await fs.readFile(
    templatePath,
    "utf-8",
  );
  const template = Handlebars.compile(source);

  const html = template(invoice);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "load",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return pdf;
  } finally {
    await browser.close();
  }
};
