import { BUSINESS_ROLE } from "@/consts.js";
import * as z from "zod";

export const inviteMemberSchema = z.object({
  role: z.enum(Object.values(BUSINESS_ROLE), {
    message: "Invalid role. Must be one of OWNER, ADMIN, or EMPLOYEE",
  }),
  // permissions: z.array(z.string()).optional(),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberSchema = z.object({
  role: z.enum(Object.values(BUSINESS_ROLE), {
    message: "Invalid role. Must be one of OWNER, ADMIN, or EMPLOYEE",
  }),
})

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;