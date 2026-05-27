import { Business_Roles, type ROLE_ENUM } from "@/consts.js";
import { Schema, model, Types, type HydratedDocument } from "mongoose";

export interface IBusinessMember {
  businessId: Types.ObjectId;
  memberId: Types.ObjectId;
  role: ROLE_ENUM;
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
      enum: Object.values(Business_Roles),
      default: Business_Roles.EMPLOYEE,
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