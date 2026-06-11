import { registry } from "@/docs/registry.js";
import { descriptions, workspaceProtectedRoute } from "@/docs/common.js";

registry.registerPath({
  method: "get",
  path: "/analytics",
  tags: ["Analytics"],
  summary: "Get Analytics",
  ...workspaceProtectedRoute,
  description: descriptions.adminOrOwner,

  responses: {
    200: {
      description: "Analytics retrieved successfully",
    },
    403: {
      description: "Insufficient permissions",
    },
  },
});