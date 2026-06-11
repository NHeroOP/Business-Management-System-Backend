import { registry } from "@/docs/registry.js";
import { authSecurity } from "@/docs/common.js";
import { changePasswordSchema, updateAvatarSchema, updateProfileSchema, userIdParamSchema } from "./user.validation.js";

registry.registerPath({
  method: "get",
  path: "/users/me",
  tags: ["Users"],
  summary: "Get my profile",
  security: authSecurity,
  responses: {
    200: {
      description: "User profile fetched successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/users/me",
  tags: ["Users"],
  summary: "Update my profile",
  security: authSecurity,

  request: {
    body: {
      content: {
        "application/json": {
          schema: updateProfileSchema
        }
      }
    }
  },

  responses: {
    200: {
      description: "User profile updated successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/users/change-password",
  tags: ["Users"],
  summary: "Change password",
  security: authSecurity,

  request: {
    body: {
      content: {
        "application/json": {
          schema: changePasswordSchema
        }
      }
    }
  },

  responses: {
    200: {
      description: "Password changed successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/users/update-avatar",
  tags: ["Users"],
  summary: "Update my avatar",
  security: authSecurity,

  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: updateAvatarSchema
        }
      }
    }
  },

  responses: {
    200: {
      description: "Avatar updated successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/users/{userId}",
  tags: ["Users"],
  summary: "Get user profile",
  security: authSecurity,

  request: {
    params: userIdParamSchema
  },

  responses: {
    200: {
      description: "User profile fetched successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});