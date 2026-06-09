import { ApiError } from "@/shared/utils/ApiError.js"
import { startSession, Types } from "mongoose"
import { Payment, type IPaymentDocument } from "./Payment.model.js"
import { INVOICE_STATUS, PAYMENT_STATUS } from "@/consts.js"
import { Invoice } from "../invoice/Invoice.model.js"
import type { CreatePaymentInput, FindPaymentsInput, PaymentIdParam } from "./payment.validation.js"


type PaymentContext = PaymentIdParam & {
  businessId: string | Types.ObjectId,
}

type CreatePaymentPayload = CreatePaymentInput & {
  businessId: Types.ObjectId;
  createdBy: Types.ObjectId;
}

type FindPaymentsPayload = FindPaymentsInput & {
  businessId: Types.ObjectId;
}

export const createPayment = async (
  payload: CreatePaymentPayload
) => {
  const { businessId, createdBy, invoiceId, amount, method, status, transactionId, notes, paidAt } = payload;
  if (!invoiceId || !amount || !createdBy) { 
    throw new ApiError(400, "Invoice ID, amount and createdBy are required");
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    businessId,
    isArchived: false,
  })

  if (!invoice) {
    throw new ApiError(404, "Invoice not found ");
  }

  if (invoice.status === INVOICE_STATUS.PAID) {
    throw new ApiError(400, "Invoice has already been paid");
  }

  let payment: IPaymentDocument | undefined;

  const session = await startSession();
  session.startTransaction();

  try {
    const existingPayment = await Payment.exists({
      invoiceId,
      isArchived: false,
      businessId,
      status: PAYMENT_STATUS.SUCCESS,
    }).session(session);

    if (existingPayment) {
      throw new ApiError(400, "Invoice has already been paid");
    }

    if ((status && status === PAYMENT_STATUS.SUCCESS) || status === undefined) {
      const invoice = await Invoice.findOne(
        { _id: invoiceId, businessId, isArchived: false },
      ).session(session);

      if (!invoice) {
        throw new ApiError(404, "Invoice not found");
      }

      if (Math.round(amount * 100) === Math.round(invoice.total * 100)) {
        invoice.status = INVOICE_STATUS.PAID;
        await invoice.save({ session });
      }
    };
    
    [payment] = await Payment.create([{
      businessId: businessId!,
      invoiceId,
      amount,
      createdBy,
      ...(method && { method }),
      ...(status && { status }),
      ...(transactionId && { transactionId }),
      ...(notes && { notes }),
      ...(paidAt && { paidAt }),
    }], { session });
    
    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error.message || "Failed to create invoice",
          [],
          error instanceof Error ? error.stack : undefined,
        );
  } finally {
    await session.endSession();
  }
  if (!payment) {
    throw new ApiError(500, "Failed to create payment");
  }

  
  return payment;
}

export const findPayments = async (
  payload: FindPaymentsPayload
) => {

  const { businessId, invoiceId, status, method, fromDate, toDate, sortBy = "paidAt", sortOrder = -1, page=1, limit=10 } = payload;

  const paymentAggregate = Payment.aggregate([
    {
      $match: {
        businessId: businessId,
        isArchived: false,
        ...(invoiceId && { invoiceId: new Types.ObjectId(invoiceId) }),
        ...(status && { status: status }),
        ...(method && { method: method }),
        ...((fromDate || toDate) && {
          paidAt: {
            ...(fromDate && { $gte: fromDate }),
            ...(toDate && { $lte: toDate }),
          }
        })
      }
    }, {
      $sort: {
        [sortBy]: sortOrder
      }
    } 
  ]);

  const payments = await Payment.aggregatePaginate(paymentAggregate, {
    page,
    limit,
  });

  return payments;

}

export const findPaymentById = async (
  {businessId, paymentId}: PaymentContext
): Promise<IPaymentDocument> => {
  if (!paymentId) {
    throw new ApiError(400, "Payment ID is required");
  }

  const payment = await Payment.findOne({
    _id: paymentId,
    businessId,
    isArchived: false,
  })

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return payment;
}
