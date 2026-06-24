import { registry } from "@/docs/registry.js";
import {
  createBusinessRequestSchema,
  updateBusinessDetailsSchema,
} from "./business.validation.js";

import {
  authSecurity,
  workspaceProtectedRoute,
  descriptions,
} from "@/docs/common.js";


registry.registerPath({
  method: "post",
  path: "/businesses",
  tags: ["Businesses"],
  summary: "Create business",
  security: authSecurity,

  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: createBusinessRequestSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Business created successfully",
    },
    400: {
      description: "Bad request - validation errors",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/businesses/",
  tags: ["Businesses"],
  security: authSecurity,
  summary: "Get user's businesses",

  responses: {
    200: {
      description: "Businesses fetched successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/businesses/current",
  tags: ["Businesses"],
  ...workspaceProtectedRoute,
  summary: "Get current business",
  description: descriptions.workspaceAccess,

  responses: {
    200: {
      description: "Business fetched successfully",
    },
    404: {
      description: "Business not found",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/businesses/current",
  tags: ["Businesses"],
  ...workspaceProtectedRoute,
  summary: "Update business details",
  description: descriptions.ownerOnly,

  request: {
    body: {
      content: {
        "application/json": {
          schema: updateBusinessDetailsSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Business details updated successfully",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/businesses/current/logo",
  tags: ["Businesses"],
  ...workspaceProtectedRoute,
  summary: "Update business logo",
  description: descriptions.ownerOnly,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["logoUrl"],
            properties: {
              logoUrl: {
                type: "string",
                format: "binary",
                description: "Business logo image",
              },
            },
          },
        },
      },
    },
  },

  responses: {
    200: {
      description: "Business logo updated successfully",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});
