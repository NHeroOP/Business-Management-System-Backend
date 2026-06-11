import { 
  createInvoiceSchema,
  getInvoicesSchema,
  invoiceIdParamSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema
 } from "./invoice.validation.js";

import { registry } from "@/docs/registry.js";
import {
  workspaceProtectedRoute,
  descriptions,
} from "@/docs/common.js";


registry.registerPath({
  method: "post",
  path: "/invoices",
  tags: ["Invoices"],
  summary: "Create Invoice",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    body: {
      content: {
        "application/json": {
          schema: createInvoiceSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Invoice created successfully",
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
  path: "/invoices",
  tags: ["Invoices"],
  summary: "Get Invoices",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    body: {
      content: {
        "application/json": {
          schema: getInvoicesSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Invoices retrieved successfully",
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
  path: "/invoices/{invoiceId}",
  tags: ["Invoices"],
  summary: "Get Invoice",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    params: invoiceIdParamSchema
  },

  responses: {
    200: {
      description: "Invoice retrieved successfully",
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
  method: "patch",
  path: "/invoices/{invoiceId}",
  tags: ["Invoices"],
  summary: "Update Invoice",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    params: invoiceIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateInvoiceSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Invoice updated successfully",
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
  method: "delete",
  path: "/invoices/{invoiceId}",
  tags: ["Invoices"],
  summary: "Delete Invoice",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    params: invoiceIdParamSchema,
  },

  responses: {
    200: {
      description: "Invoice deleted successfully",
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
  method: "patch",
  path: "/invoices/{invoiceId}/status",
  tags: ["Invoices"],
  summary: "Update Invoice Status",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    params: invoiceIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateInvoiceStatusSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Invoice status updated successfully",
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
  path: "/invoices/{invoiceId}/pdf",
  tags: ["Invoices"],
  summary: "Get Invoice PDF",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    params: invoiceIdParamSchema,
  },

  responses: {
    200: {
      description: "Invoice PDF retrieved successfully",
    },
    400: {
      description: "Invalid request data",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});