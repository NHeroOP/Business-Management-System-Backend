import { createProductRequestSchema, FindProductsQuerySchema, productIdParamSchema, productImageUpdateSchema, updateProductSchema } from "./product.validation.js";

import { registry } from "@/docs/registry.js";
import {
  workspaceProtectedRoute,
  descriptions,
} from "@/docs/common.js";


registry.registerPath({
  method: "post",
  path: "/products",
  tags: ["Products"],
  summary: "Create Product",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: createProductRequestSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Product created successfully",
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
  path: "/products",
  tags: ["Products"],
  ...workspaceProtectedRoute,
  summary: "Get Products",
  description: descriptions.workspaceAccess,

  request: {
    query: FindProductsQuerySchema,
  },

  responses: {
    200: {
      description: "Products fetched successfully",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/products/{productId}",
  tags: ["Products"],
  ...workspaceProtectedRoute,
  summary: "Get Product",
  description: descriptions.workspaceAccess,

  request: {
    params: productIdParamSchema,
  },

  responses: {
    200: {
      description: "Product fetched successfully",
    },
    404: {
      description: "Product not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/products/{productId}",
  tags: ["Products"],
  ...workspaceProtectedRoute,
  summary: "Update Product",
  description: descriptions.workspaceAccess,

  request: {
    params: productIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateProductSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Product updated successfully",
    },
    404: {
      description: "Product not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/products/{productId}/image",
  tags: ["Products"],
  ...workspaceProtectedRoute,
  summary: "Update Product Image",
  description: descriptions.workspaceAccess,

  request: {
    params: productIdParamSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: productImageUpdateSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Product image updated successfully",
    },
    404: {
      description: "Product not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/products/{productId}",
  tags: ["Products"],
  ...workspaceProtectedRoute,
  summary: "Delete Product",
  description: descriptions.workspaceAccess,

  request: {
    params: productIdParamSchema,
  },

  responses: {
    200: {
      description: "Product deleted successfully",
    },
    404: {
      description: "Product not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});