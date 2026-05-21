import {  Schema, model, Types, type HydratedDocument } from "mongoose";

export interface IPayment {
  businessId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  amount: number;
  method:
    | "cash"
    | "upi"
    | "bank"
    | "card";

  status:
    | "success"
    | "pending"
    | "failed";

  transactionId?: string;
  notes?: string;
  paidAt: Date;
  createdBy: Types.ObjectId;
  metadata?: Record<string, unknown>;
}

export type IPaymentDocument = HydratedDocument<IPayment>;

const paymentSchema = new Schema<IPayment>(
  {
    businessId: {
      type: Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    invoiceId: {
      type: Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      enum: ["cash", "upi", "bank", "card"],
      default: "cash",
    },

    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "success",
    },

    transactionId: String,

    notes: String,

    paidAt: {
      type: Date,
      default: Date.now,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
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

export const Payment = model<IPayment>("Payment", paymentSchema);