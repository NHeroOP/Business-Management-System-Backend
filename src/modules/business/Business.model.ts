import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface IBusiness {
  name: string;
  slug: string;
  createdBy: Types.ObjectId;

  logo?: {
    url?: string | undefined;
    publicId?: string | undefined;
  };

  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;

  settings: {
    currency: string;
    invoicePrefix: string;
    enableTaxes: boolean;
    taxPercentage: number;
  };
  plan: "free" | "pro";
  isArchived: boolean;
  metadata?: Record<string, unknown>;
}

export type IBusinessDocument = HydratedDocument<IBusiness>;

const logoSchema = new Schema(
  {
    url: String,
    publicId: String,
  },
  { _id: false }
);

const businessSchema = new Schema<IBusiness>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    logo: logoSchema,

    email: String,

    phone: String,

    address: String,

    website: String,

    description: String,

    settings: {
      currency: {
        type: String,
        default: "INR",
      },

      invoicePrefix: {
        type: String,
        default: "INV",
      },

      enableTaxes: {
        type: Boolean,
        default: true,
      },

      taxPercentage: {
        type: Number,
        default: 18,
      },
    },

    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

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

export const Business = model<IBusiness>("Business", businessSchema);