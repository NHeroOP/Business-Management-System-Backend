import { Types, type AggregatePaginateResult } from "mongoose";

import { Client, type IClientDocument } from "./Client.model.js";
import type { ClientIdInput, CreateClientInput, FindClientsInput, UpdateClientInput } from "./client.validation.js";

import { ApiError } from "@/shared/utils/ApiError.js";


type CreateClientPayload = CreateClientInput & {
  businessId: Types.ObjectId;
  createdBy: Types.ObjectId;
}

type FindClientsPayload = FindClientsInput & {
  businessId: Types.ObjectId;
}

type UpdateClientPayload = ClientIdInput & UpdateClientInput & {
  businessId: Types.ObjectId;
}

export const createClient = async (
  payload: CreateClientPayload
): Promise<IClientDocument> => {
  const { businessId, name, email, phone, address, companyName, gstNumber, notes, tags, createdBy } = payload;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Name is required to create a client");
  }

  const client = await Client.create({
    businessId,
    createdBy,
    name,
    ...(tags && { tags }),
    ...(email && { email }),
    ...(phone && { phone }),
    ...(address && { address }),
    ...(companyName && { companyName }),
    ...(gstNumber && { gstNumber }),
    ...(notes && { notes }),
  });

  if (!client) {
    throw new ApiError(500, "Failed to create client");
  }

  return client;
}

export const findClients = async (
  payload: FindClientsPayload
): Promise<AggregatePaginateResult<IClientDocument>> => {
  const { businessId, page, limit, search, sortBy } = payload;
  
  const clientAggregate = Client.aggregate([
    {
      $match: { businessId: new Types.ObjectId(businessId), isArchived: false }
    }, {
      $sort: sortBy === "name" ? { name: 1 } : { createdAt: -1 }
    }, {
      $match: search ? { name: { $regex: search, $options: "i" } } : {}
    }, {
      $project: {
        metadata: 0
      }
    }
  ])

  const clients = await Client.aggregatePaginate(clientAggregate, { page, limit })


  if (!clients || clients.docs.length === 0) {
    throw new ApiError(404, "No clients found for this business");
  }

  return clients;
}

export const findClientById = async (
  clientId: ClientIdInput["clientId"]
): Promise<IClientDocument> => {
  const client = await Client.findOne({ _id: clientId, isArchived: false }).select("-metadata");

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  return client;
}

export const updateClient = async (
  payload: UpdateClientPayload
) => { 

  const { businessId, clientId, ...updateData } = payload;

  const client = await Client.findOneAndUpdate(
    {
      _id: clientId,
      businessId,
      isArchived: false,
    },
    { ...updateData },
    {"returnDocument": "after"}
  );

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

};

export const archiveClient = async (
  clientId: ClientIdInput["clientId"]
): Promise<void> => { 
  if (!clientId) {
    throw new ApiError(400, "Client ID is required");
  }

  const client = await Client.findOne({
    _id: clientId,
    isArchived: false,
  });

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  client.isArchived = true;
  await client.save();
};