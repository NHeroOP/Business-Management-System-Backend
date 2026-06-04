import * as z from "zod";
import { BUSINESS_ROLE } from "@/consts.js";

export const inviteMemberSchema = z.object({
  userId: z.string().length(24, "Invalid user ID format"),
  role: z.enum(Object.values(BUSINESS_ROLE), {
    message: "Invalid role. Must be one of OWNER, ADMIN, or EMPLOYEE",
  }),
  // permissions: z.array(z.string()).optional(),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const userIdParamSchema = z.object({
  userId: z.string().length(24, "Invalid user ID format"),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

export const updateMemberSchema = z.object({
  role: z.enum(Object.values(BUSINESS_ROLE), {
    message: "Invalid role. Must be one of OWNER, ADMIN, or EMPLOYEE",
  }),
})

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;