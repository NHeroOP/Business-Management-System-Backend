export const authSecurity = [
  {
    bearerAuth: [],
  },
];

export const workspaceHeader = {
  in: "header",
  name: "x-business-id",
  required: true,
  schema: {
    type: "string",
  },
  description: "Business workspace ID",
  example: "685b8b6f9a6f1e0012345678",
} as const;

export const workspaceProtectedRoute = {
  security: authSecurity,
  parameters: [workspaceHeader],
};

export const descriptions = {
  ownerOnly:
    "Requires OWNER role in the selected workspace.",

  adminOrOwner:
    "Requires OWNER or ADMIN role in the selected workspace.",

  workspaceAccess:
    "Requires access to the selected workspace.",
};