import * as z from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const getClientsSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  search: z.string().optional().describe("Search term to filter clients by name or email")  ,
  sortBy: z.enum(["name", "createdAt"]).optional()
});

export type FindClientsInput = z.infer<typeof getClientsSchema>;

export const clientIdSchema = z.object({
  clientId: z.string().length(24, "Client ID is required")
});

export type ClientIdInput = z.infer<typeof clientIdSchema>;

export const updateClientSchema = z.object({
  name: z.string().optional(),
  email: z.email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;