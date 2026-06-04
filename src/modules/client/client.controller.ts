import type { Request, Response } from "express";

import {
  createClient as createClientService,
  findClientById,
  findClients,
  updateClient as updateClientService,
  archiveClient
} from "./client.service.js";
import {
  clientIdSchema,
  createClientSchema,
  getClientsSchema,
  updateClientSchema
} from "./client.validation.js";

import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";


export const createClient = asyncHandler(async (req: Request, res: Response) => { 
  const body = createClientSchema.parse(req.body);

  const client = await createClientService({
    businessId: req.workspace!.businessId,
    createdBy: req.user!._id,
    ...body,
  });
  
  return res.status(201).json(
    new ApiResponse(201, client, "Client created successfully")
  );
});

export const getClients = asyncHandler(async (req: Request, res: Response) => { 
  const { page = 1, limit = 10, search, sortBy } = getClientsSchema.parse(req.query);

  const clients = await findClients({
    businessId: req.workspace!.businessId,
    page,
    limit,
    search,
    sortBy
  });

  return res.status(200).json(
    new ApiResponse(200, clients, "Clients retrieved successfully")
  );
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => { 
  const { clientId } = clientIdSchema.parse(req.params);

  const client = await findClientById({
    businessId: req.workspace!.businessId,
    clientId
  });

  return res.status(200).json(
    new ApiResponse(200, client, "Client retrieved successfully")
  );
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => { 
  const body = updateClientSchema.parse(req.body);
  const { clientId } = clientIdSchema.parse(req.params);
  
  await updateClientService({
    businessId: req.workspace!.businessId,
    clientId,
    ...body
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Client updated successfully")
  );
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => { 
  const { clientId } = clientIdSchema.parse(req.params);

  await archiveClient({
    businessId: req.workspace!.businessId,
    clientId
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Client archived successfully")
  );
});