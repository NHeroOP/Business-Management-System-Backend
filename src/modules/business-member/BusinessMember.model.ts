import { Schema, model, Types, type HydratedDocument } from "mongoose";

export interface IBusinessMember {
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "owner" | "admin" | "employee";
  permissions: string[];
  joinedAt: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IBusinessMemberDocument = HydratedDocument<IBusinessMember>;

const businessMemberSchema = new Schema<IBusinessMember>(
  {
    businessId: {
      type: Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "employee"],
      default: "employee",
    },

    permissions: {
      type: [String],
      default: [],
    },

    joinedAt: {
      type: Date,
      default: Date.now,
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

export const BusinessMember = model<IBusinessMember>(
  "BusinessMember",
  businessMemberSchema
);