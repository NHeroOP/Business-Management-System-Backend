import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import { app } from "@/app.js";
import type { IUserDocument } from "@/modules/user/User.model.js";
import type { IClientDocument } from "@/modules/client/Client.model.js";
import type { IInvoiceDocument } from "@/modules/invoice/Invoice.model.js";
import type { IBusinessDocument } from "@/modules/business/Business.model.js";
import {
  createBusiness,
  createClient,
  createInvoice,
  createUser,
} from "@tests/factories/index.js";

describe("GET /invoices/:id", () => {
  let agent: ReturnType<typeof request.agent>;
  let user: IUserDocument; 
  let business: IBusinessDocument;
  let client: IClientDocument;
  let invoice: IInvoiceDocument;

  beforeEach(async () => {
    user = await createUser();
    business = await createBusiness({
      createdBy: user._id,
    })
    client = await createClient({
      businessId: business._id,
      createdBy: user._id,
    });
    invoice = await createInvoice({
      businessId: business._id,
      createdBy: user._id,
      client: client._id,
    })
    
    agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({
      identifier: user.email,
      password: "password123",
    });
  })

  it("should return invoice", async () => {
    const res = await agent.get(`/api/v1/invoices/${invoice._id.toString()}`)
      .set({"x-business-id": business._id.toString()});
    
    expect(res.status).toBe(200);
  })
  it("should reject cross-business access", async () => {
    const anotherBusiness = await createBusiness({
      createdBy: user._id,
    });

    const res = await agent.get(`/api/v1/invoices/${invoice._id.toString()}`)
      .set({"x-business-id": anotherBusiness._id.toString()});
    expect(res.status).toBe(404);
  })
 
})