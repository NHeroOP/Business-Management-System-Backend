import { Types } from "mongoose"
import { Client } from "../client/Client.model.js"
import { INVOICE_STATUS, PRODUCT_TYPE } from "@/consts.js"
import { Product } from "../product/Product.model.js"
import { Invoice } from "../invoice/Invoice.model.js"
import { Payment } from "../payment/Payment.model.js"

export const getAnalytics = async (
  businessId: string | Types.ObjectId
) => { 

  const [
    totalClients,
    totalProducts,
    totalServices,
    totalInvoices,
    totalPayments,
    paidInvoices,
    revenue
  ] = await Promise.all([
    Client.countDocuments({
      businessId,
      isArchived: false,
    }),
    Product.countDocuments({
      businessId,
      type: PRODUCT_TYPE.PRODUCT,
      isArchived: false,
    }),
    Product.countDocuments({
      businessId,
      type: PRODUCT_TYPE.SERVICE,
      isArchived: false,
    }),
    Invoice.countDocuments({
      businessId,
      isArchived: false,
    }),
    Payment.countDocuments({
      businessId,
      isArchived: false,
    }),
    Invoice.countDocuments({
      businessId,
      isArchived: false,
      status: INVOICE_STATUS.PAID,
    }),
    Payment.aggregate([
      {
        $match: {
          businessId: new Types.ObjectId(businessId),
          isArchived: false,
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" }
        }
      },
      {
        $addFields: {
          totalRevenue: {
            $arrayElemAt: ["$totalRevenue", 0]
          }
        }
      }
    ])

  ])

  return {
    totalClients,
    totalProducts,
    totalServices,
    totalInvoices,
    totalPayments,
    paidInvoices,
    revenue: revenue[0]?.totalRevenue || 0
  };

}