import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import { app } from "@/app.js";
import { INVOICE_STATUS } from "@/consts.js";
import type { IUserDocument } from "@/modules/user/User.model.js";
import type { IClientDocument } from "@/modules/client/Client.model.js";
import type { IBusinessDocument } from "@/modules/business/Business.model.js";
import { Invoice, type IInvoiceDocument } from "@/modules/invoice/Invoice.model.js";
import {
  createBusiness,
  createClient,
  createInvoice,
  createUser,
} from "@tests/factories/index.js";

describe("PATCH /invoices/:id/status", () => {
  let agent: ReturnType<typeof request.agent>;
  let user: IUserDocument; 
  let business: IBusinessDocument;
  let client: IClientDocument;
  let invoice: IInvoiceDocument;
  let beforeUpdateDate: number;
1
  beforeEach(async () => {
    user = await createUser();
    business = await createBusiness({
      createdBy: user._id,
    })
    client = await createClient({
      businessId: business._id,
      createdBy: user._id,
    });
    beforeUpdateDate = Date.now();
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

  it("should update status to paid and change paidAt timestamp", async () => {
    const res = await agent.patch(`/api/v1/invoices/${invoice._id.toString()}/status`)
      .set({ "x-business-id": business._id.toString() })
      .send({ status: INVOICE_STATUS.PAID });
    
    expect(res.status).toBe(200);

    const updatedInvoice = await Invoice.findById(invoice._id);
    expect(updatedInvoice?.status).toBe(INVOICE_STATUS.PAID);
    expect(updatedInvoice?.paidAt?.getTime())
      .toBeGreaterThanOrEqual(beforeUpdateDate);
    
  })

  it("should not change status on cross-business access", async () => {
    const anotherBusiness = await createBusiness({
      createdBy: user._id,
    });

    const res = await agent.patch(`/api/v1/invoices/${invoice._id.toString()}/status`)
      .set({ "x-business-id": anotherBusiness._id.toString() })
      .send({ status: INVOICE_STATUS.PAID });
    
    expect(res.status).toBe(404);

    const updatedInvoice = await Invoice.findById(invoice._id);
    expect(updatedInvoice?.status).toBe(INVOICE_STATUS.DRAFT);
  })

  it("should not allow invalid status", async () => {
    const res = await agent.patch(`/api/v1/invoices/${invoice._id.toString()}/status`)
      .set({ "x-business-id": business._id.toString() })
      .send({ status: "INVALID_STATUS" });
    
    expect(res.status).toBe(400);

    const updatedInvoice = await Invoice.findById(invoice._id);
    expect(updatedInvoice?.status).toBe(INVOICE_STATUS.DRAFT);
  })
    
  it("should not allow status change from PAID to SENT", async () => {
    await agent.patch(`/api/v1/invoices/${invoice._id.toString()}/status`)
      .set({ "x-business-id": business._id.toString() })
      .send({ status: INVOICE_STATUS.PAID });
    
    const res = await agent.patch(`/api/v1/invoices/${invoice._id.toString()}/status`)
      .set({ "x-business-id": business._id.toString() })
      .send({ status: INVOICE_STATUS.SENT });
    
    expect(res.status).toBe(400);

    const updatedInvoice = await Invoice.findById(invoice._id);
    expect(updatedInvoice?.status).toBe(INVOICE_STATUS.PAID);
  })
  
})