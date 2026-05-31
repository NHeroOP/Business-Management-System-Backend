import { PAYMENT_METHOD, PAYMENT_STATUS, type PaymentMethod, type PaymentStatus } from "@/consts.js";
import {  Schema, model, Types, type HydratedDocument, type AggregatePaginateModel } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IPayment {
  businessId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  amount: number;
  method: PaymentMethod
  status: PaymentStatus;
  transactionId?: string;
  notes?: string;
  paidAt: Date;
  createdBy: Types.ObjectId;
  isArchived: boolean;
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
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.CASH,
    },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.SUCCESS,
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
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  businessId: 1,
  paidAt: -1,
});

paymentSchema.index({
  businessId: 1,
  invoiceId: 1,
});

paymentSchema.index({
  businessId: 1,
  status: 1,
});

paymentSchema.plugin(mongooseAggregatePaginate);

export const Payment = model<IPayment, AggregatePaginateModel<IPayment>>("Payment", paymentSchema);