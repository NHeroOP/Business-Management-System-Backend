import type { IBusinessMemberDocument } from "@/modules/businessMember/BusinessMember.model.ts";
import type { IUserDocument } from "@/modules/user/User.model.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: Pick<IUserDocument, "_id" | "email" | "name" | "username">;
    workspace?: Pick<IBusinessMemberDocument, "_id" | "businessId" | "role" | "memberId">;
  }
}

export {};
