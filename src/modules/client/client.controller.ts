import type { Request, Response } from "express";

import {
  createClient as createClientService,
  findClientById,
  findClients,
  updateClient as updateClientService,
  archiveClient
} from "./client.service.js";

import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import type { Types } from "mongoose";


export const createClient = asyncHandler(async (req: Request, res: Response) => { 
  const payload = {
    businessId: req.workspace!.businessId,
    createdBy: req.user!._id,
    ...req.body,
  }

  const client = await createClientService(payload);
  return res.status(201).json(
    new ApiResponse(201, client, "Client created successfully")
  );
});

export const getClients = asyncHandler(async (req: Request, res: Response) => { 
  const { page = 1, limit = 10, search, sortBy } = req.query;

  const clients = await findClients({
    businessId: req.workspace!.businessId,
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 10,
    search: search as string,
    sortBy: sortBy as string
  });

  return res.status(200).json(
    new ApiResponse(200, clients, "Clients retrieved successfully")
  );
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => { 
  const client = await findClientById(
    req.params.clientId as Types.ObjectId | string
  );

  return res.status(200).json(
    new ApiResponse(200, client, "Client retrieved successfully")
  );
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => { 
  const { name, tags, email, phone, address, companyName, gstNumber, notes } = req.body;
  const updatePayload = {
    clientId: req.params.clientId as Types.ObjectId | string,
    updateData: { name, tags, email, phone, address, companyName, gstNumber, notes }
  }
  
  await updateClientService(updatePayload);
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => { 
  await archiveClient(
    req.params.clientId as Types.ObjectId | string
  );

  return res.status(200).json(
    new ApiResponse(200, {}, "Client archived successfully")
  );
});