import { Schema, type HydratedDocument, Types, model } from "mongoose";

export interface IInvoiceCounter {
  businessId: Types.ObjectId;
  year: number;
  sequence: number;
}

export type IInvoiceCounterDocument = HydratedDocument<IInvoiceCounter>;

const invoiceCounterSchema = new Schema<IInvoiceCounter>({
  businessId: {
    type: Types.ObjectId,
    ref: "Business",
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  sequence: {
    type: Number,
    default: 0,
  },
})

invoiceCounterSchema.index(
  {
    businessId: 1,
    year: 1
  }, { unique: true }
);

export const InvoiceCounter = model<IInvoiceCounter>("InvoiceCounter", invoiceCounterSchema);
