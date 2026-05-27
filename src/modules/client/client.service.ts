import { ApiError } from "@/shared/utils/ApiError.js";
import { Client, type IClient, type IClientDocument } from "./Client.model.js";
import { Types, type AggregatePaginateResult } from "mongoose";


interface FindClientPayload {
  businessId: Types.ObjectId | string;
  options?: {
    page?: number;
    limit?: number;
  }
}

interface UpdateClientPayload {
  businessId: Types.ObjectId | string;
  clientId: Types.ObjectId | string;
  updateData: Partial<Omit<IClient, "businessId" | "createdBy" | "isArchived">>;
}

interface ArchiveClientPayload {
  businessId: Types.ObjectId | string;
  clientId: Types.ObjectId | string;
}

export const createClient = async (
  payload: Omit<IClient, "metadata" | "isArchived">
): Promise<IClientDocument> => {
  const { businessId, name, email, phone, address, companyName, gstNumber, notes, tags, createdBy } = payload;

  if (!name || tags.length < 1) {
    throw new ApiError(400, "Name and at least one tag are required to create a client");
  }

  const client = await Client.create({
    businessId,
    createdBy,
    name,
    tags,
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
  { businessId, options }: FindClientPayload
): Promise<AggregatePaginateResult<IClientDocument>> => {

  const clientAggregate = Client.aggregate([
    {
      $match: { businessId: new Types.ObjectId(businessId), isArchived: false }
    },
    {
      $project: {
        metadata: 0
      }
    }
  ])

  const clients = await Client.aggregatePaginate(clientAggregate, options)


  if (!clients || clients.docs.length === 0) {
    throw new ApiError(404, "No clients found for this business");
  }

  return clients;
}

export const findClientById = async (
  clientId: Types.ObjectId | string
): Promise<IClientDocument> => {
  const client = await Client.findById(clientId).select("-metadata");

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  return client;
}

export const updateClient = async (
  payload: UpdateClientPayload
) => { 

  const { businessId, clientId, updateData } = payload;

  const client = await Client.findOne({
    _id: clientId,
    businessId: businessId,
    isArchived: false,
  });

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  Object.assign(client, updateData);
  await client.save();

};

export const archiveClient = async (
  { businessId, clientId }: ArchiveClientPayload
): Promise<void> => { 
  if (!clientId) {
    throw new ApiError(400, "Client ID is required");
  }

  const client = await Client.findOne({
    _id: clientId,
    businessId: businessId,
    isArchived: false,
  });

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  client.isArchived = true;
  await client.save();
};