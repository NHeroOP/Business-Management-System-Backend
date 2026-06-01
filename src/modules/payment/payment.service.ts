import { ApiError } from "@/shared/utils/ApiError.js"
import { startSession, Types } from "mongoose"
import { Payment, type IPayment, type IPaymentDocument } from "./Payment.model.js"
import { INVOICE_STATUS, PAYMENT_STATUS, type PaymentMethod, type PaymentStatus } from "@/consts.js"
import { Invoice } from "../invoice/Invoice.model.js"


interface IdParams {
  businessId: string | Types.ObjectId,
  paymentId: string | Types.ObjectId
}

interface CreatePaymentParams {
  businessId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  amount: number;
  method?: PaymentMethod
  status?: PaymentStatus;
  transactionId?: string;
  notes?: string;
  paidAt?: Date;
  createdBy: Types.ObjectId;
}

interface FindPaymentsPayload {
  businessId: Types.ObjectId;
  invoiceId?: Types.ObjectId | string;
  status?: PaymentStatus | undefined;
  method?: PaymentMethod | undefined;
  fromDate?: Date | undefined;
  toDate?: Date | undefined;
  sortBy?: string;
  sortOrder?: 1 | -1;
  page?: number;
  limit?: number;
}

export const createPayment = async (
  payload: CreatePaymentParams
) => {

  

  const { businessId, invoiceId, amount, method, status, transactionId, notes, paidAt, createdBy } = payload;
  if (!invoiceId || !amount || !createdBy) { 
    throw new ApiError(400, "Invoice ID, amount and createdBy are required");
  }


  const existingPayment = await Payment.exists({
    invoiceId,
    status: PAYMENT_STATUS.SUCCESS,
  });

  if (existingPayment) {
    throw new ApiError(400, "Invoice has already been paid");
  }
  let payment: IPaymentDocument | undefined;

  const session = await startSession();
  session.startTransaction();

  try {

    if ((status && status === PAYMENT_STATUS.SUCCESS) || status === undefined) {
      const invoice = await Invoice.findOne(
        { _id: invoiceId, businessId, isArchived: false },
      ).session(session);

      if (!invoice) {
        throw new ApiError(404, "Invoice not found");
      }

      if (amount >= invoice.total) {
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
  {businessId, paymentId}: IdParams
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
