import { registry } from "@/docs/registry.js";
import { inviteMemberSchema } from "./businessMember.validation.js";

import {
  authSecurity,
  workspaceProtectedRoute,
  descriptions,
  roleParam,
} from "@/docs/common.js";


registry.registerPath({
  method: "post",
  path: "/business-members",
  tags: ["Business Members"],
  summary: "Invite business member",
  ...workspaceProtectedRoute,
  description: descriptions.adminOrOwner,

  request: {
    body: {
      content: {
        "application/json": {
          schema: inviteMemberSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Member invited successfully",
    },
    400: {
      description: "Invalid request data",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/business-members",
  tags: ["Business Members"],
  ...workspaceProtectedRoute,
  summary: "Get business members",
  description: descriptions.workspaceAccess,

  responses: {
    200: {
      description: "Business members fetched successfully",
    },
    404: {
      description: "Business members not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/business-members/{userId}/role",
  tags: ["Business Members"],
  ...workspaceProtectedRoute,
  summary: "Update business member role",
  description: descriptions.adminOrOwner,
  parameters: roleParam,

  responses: {
    200: {
      description: "Business member role updated successfully",
    },
    404: {
      description: "Business member not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/business-members/{userId}",
  tags: ["Business Members"],
  ...workspaceProtectedRoute,
  summary: "Remove business member",
  description: descriptions.adminOrOwner,
  parameters: roleParam,

  responses: {
    200: {
      description: "Business member removed successfully",
    },
    404: {
      description: "Business member not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});