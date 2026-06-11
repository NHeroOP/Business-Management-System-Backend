import { 
  createPaymentSchema,
  getPaymentsSchema,
  paymentIdParamSchema
} from "./payment.validation.js";

import { registry } from "@/docs/registry.js";
import {
  workspaceProtectedRoute,
  descriptions,
} from "@/docs/common.js";


registry.registerPath({
  method: "post",
  path: "/payments",
  tags: ["Payments"],
  summary: "Create Payment",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    body: {
      content: {
        "application/json": {
          schema: createPaymentSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Payment created successfully",
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
  path: "/payments",
  tags: ["Payments"],
  summary: "Get Payments",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    query: getPaymentsSchema,
  },

  responses: {
    200: {
      description: "Payments retrieved successfully",
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
  path: "/payments/{paymentId}",
  tags: ["Payments"],
  summary: "Get Payment",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    params: paymentIdParamSchema,
  },

  responses: {
    200: {
      description: "Payment retrieved successfully",
    },
    400: {
      description: "Invalid request data",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});