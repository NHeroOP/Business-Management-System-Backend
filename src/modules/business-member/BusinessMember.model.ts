
import { BUSINESS_ROLE, type BusinessRole } from "@/consts.js";
import { Schema, model, Types, type HydratedDocument } from "mongoose";

export interface IBusinessMember {
  businessId: Types.ObjectId;
  memberId: Types.ObjectId;
  role: BusinessRole;
  permissions: string[];
  isArchived: boolean;
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

    memberId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(BUSINESS_ROLE),
      default: BUSINESS_ROLE.EMPLOYEE,
    },

    permissions: {
      type: [String],
      default: [],
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