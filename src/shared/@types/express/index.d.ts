import type { IBusinessMemberDocument } from "@/modules/businessMember/BusinessMember.model.js";
import type { IUserDocument } from "@/modules/user/User.model.js";

type WorkspaceContext = {
  membershipId: IBusinessMemberDocument["_id"];
  businessId: IBusinessMemberDocument["businessId"];
  role: IBusinessMemberDocument["role"];
};


declare module "express-serve-static-core" {
  interface Request {
    user?: Pick<IUserDocument, "_id" | "email" | "name" | "username">;
    workspace?: WorkspaceContext;
  }
}

export {};
