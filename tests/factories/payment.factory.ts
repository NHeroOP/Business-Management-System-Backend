import { Payment } from "@/modules/payment/Payment.model.js";
import { createInvoice } from "./invoice.factory.js";
import type { IInvoiceDocument } from "@/modules/invoice/Invoice.model.js";


export const createPayment = async (
  invoiceOverride: IInvoiceDocument
) => {
  const invoice = invoiceOverride ||  (await createInvoice());

  return await Payment.create({
    businessId: invoice.businessId,
    invoiceId: invoice._id,
    createdBy: invoice.createdBy,
    amount: invoice.total
  })

}