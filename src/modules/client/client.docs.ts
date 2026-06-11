import {
  clientIdSchema,
  createClientSchema,
  getClientsSchema,
  updateClientSchema
} from "./client.validation.js";

import { registry } from "@/docs/registry.js";
import {
  workspaceProtectedRoute,
  descriptions,
} from "@/docs/common.js";


registry.registerPath({
  method: "post",
  path: "/clients",
  tags: ["Clients"],
  summary: "Create Client",
  ...workspaceProtectedRoute,
  description: descriptions.workspaceAccess,

  request: {
    body: {
      content: {
        "application/json": {
          schema: createClientSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Client created successfully",
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
  path: "/clients",
  tags: ["Clients"],
  ...workspaceProtectedRoute,
  summary: "Get Clients",
  description: descriptions.workspaceAccess,

  request: {
    query: getClientsSchema,
  },

  responses: {
    200: {
      description: "Clients fetched successfully",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/clients/{clientId}",
  tags: ["Clients"],
  ...workspaceProtectedRoute,
  summary: "Get Client",
  description: descriptions.workspaceAccess,

  request: {
    params: clientIdSchema,
  },

  responses: {
    200: {
      description: "Client fetched successfully",
    },
    404: {
      description: "Client not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/clients/{clientId}",
  tags: ["Clients"],
  ...workspaceProtectedRoute,
  summary: "Update Client",
  description: descriptions.workspaceAccess,

  request: {
    params: clientIdSchema,
    body: {
      content: {
        "application/json": {
          schema: updateClientSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Client updated successfully",
    },
    404: {
      description: "Client not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/clients/{clientId}",
  tags: ["Clients"],
  ...workspaceProtectedRoute,
  summary: "Delete Client",
  description: descriptions.workspaceAccess,

  request: {
    params: clientIdSchema,
  },

  responses: {
    200: {
      description: "Client deleted successfully",
    },
    404: {
      description: "Client not found",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});