import { Schema, model, Types, type HydratedDocument } from "mongoose";

export interface IClient {
  businessId: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  gstNumber?: string;
  notes?: string;
  tags: string[];
  isArchived: boolean;
  createdBy: Types.ObjectId;
  metadata?: Record<string, unknown>;
}

export type IClientDocument = HydratedDocument<IClient>;

const clientSchema = new Schema<IClient>(
  {
    businessId: {
      type: Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: String,

    phone: String,

    address: String,

    companyName: String,

    gstNumber: String,

    notes: String,

    tags: {
      type: [String],
      default: [],
    },

    isArchived: {
      type: Boolean,
      default: false,
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

clientSchema.index({
  name: "text",
});

export const Client = model<IClient>("Client", clientSchema);