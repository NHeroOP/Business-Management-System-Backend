import { InvoiceStatus, type INVOICE_STATUS_ENUM } from "@/consts.js";
import { Schema, model, Types, type HydratedDocument } from "mongoose";

export interface IInvoiceItem {
  productId?: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IInvoice {
  businessId: Types.ObjectId;
  clientId: Types.ObjectId;
  invoiceNumber: string;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: INVOICE_STATUS_ENUM;
  dueDate?: Date;
  issuedDate: Date;
  notes?: string;
  createdBy: Types.ObjectId;
  paidAt?: Date;
  isArchived: boolean;
  metadata?: Record<string, unknown>;
}

export type IInvoiceDocument = HydratedDocument<IInvoice>;

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    productId: {
      type: Types.ObjectId,
      ref: "Product",
    },

    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    businessId: {
      type: Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    clientId: {
      type: Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [invoiceItemSchema],
      required: true,
      default: [],
    },

    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
      index: true,
    },

    dueDate: Date,
    issuedDate: {
      type: Date,
      required: true,
      default: () => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return today;
      }
    },

    notes: String,

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    paidAt: Date,

    isArchived: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Invoice = model<IInvoice>("Invoice", invoiceSchema);