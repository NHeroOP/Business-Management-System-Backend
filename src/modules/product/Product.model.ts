import { PRODUCT_TYPE, type ProductType } from "@/consts.js";
import {
  Schema,
  model,
  Types,
  type HydratedDocument,
  type AggregatePaginateModel,
} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IProduct {
  businessId: Types.ObjectId;
  name: string;
  description?: string;
  type: ProductType;
  price: number;
  stockQuantity: number;
  sku?: string;
  category?: string;
  image?: {
    url?: string;
    publicId?: string;
  };
  isArchived: boolean;
  createdBy: Types.ObjectId;
  metadata?: Record<string, unknown>;
}

export type IProductDocument = HydratedDocument<IProduct>;

const imageSchema = new Schema(
  {
    url: String,
    publicId: String,
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
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

    description: String,

    type: {
      type: String,
      enum: Object.values(PRODUCT_TYPE),
      default: PRODUCT_TYPE.PRODUCT,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    stockQuantity: {
      type: Number,
      default: 0,
    },

    sku: String,
    category: String,

    image: imageSchema,

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
  },
);

productSchema.index({
  name: "text",
  businessId: 1,
  createdAt: -1,
});

productSchema.index(
  { sku: 1, businessId: 1 },
  { unique: true, sparse: true },
);

productSchema.plugin(mongooseAggregatePaginate);

export const Product = model<IProduct, AggregatePaginateModel<IProduct>>(
  "Product",
  productSchema,
);
