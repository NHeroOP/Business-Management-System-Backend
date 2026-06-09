import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import { app } from "@/app.js";
import type { IBusinessDocument } from "@/modules/business/Business.model.js";
import type { IUserDocument } from "@/modules/user/User.model.js";
import { Invoice, type IInvoiceDocument } from "@/modules/invoice/Invoice.model.js";
import {
  createUser,
  createBusiness,
  createInvoice
} from "@tests/factories/index.js";
import { INVOICE_STATUS } from "@/consts.js";

describe("POST /payments", () => {

  let agent: ReturnType<typeof request.agent>;
  let user: IUserDocument;
  let business: IBusinessDocument;
  let invoice: IInvoiceDocument;

  beforeEach(async () => {
    user = await createUser();
    business = await createBusiness({
      createdBy: user._id
    });
    invoice = await createInvoice({
      businessId: business._id,
      createdBy: user._id
    })

    agent = request.agent(app)
    await agent.post("/api/v1/auth/login").send({
      identifier: user.email,
      password: "password123"
    });

  });

  it("should create payment and mark invoice as paid", async () => {
    const res = await agent.post("/api/v1/payments")
      .set({"x-business-id": business._id.toString()})
      .send({
        invoiceId: invoice._id,
        amount: invoice.total
      });
    
    expect(res.status).toBe(201);

    const updatedInvoice = await Invoice.findById(invoice._id);
    expect(updatedInvoice?.status).toBe(INVOICE_STATUS.PAID);
  })

  it("should not allow creating payment for already paid invoice", async () => {
    await Invoice.updateOne({ _id: invoice._id }, { status: INVOICE_STATUS.PAID });
    const res = await agent.post("/api/v1/payments")
      .set({"x-business-id": business._id.toString()})
      .send({
        invoiceId: invoice._id,
        amount: invoice.total
      });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invoice has already been paid");
  })

  it ("should not allow creating payment for invoice of another business", async () => {
    const anotherBusiness = await createBusiness({
      createdBy: user._id
    });

    const res = await agent.post("/api/v1/payments")
      .set({"x-business-id": anotherBusiness._id.toString()})
      .send({
        invoiceId: invoice._id,
        amount: invoice.total
      });
    
    expect(res.status).toBe(404);
  })
})