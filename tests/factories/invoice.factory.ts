import { Invoice, type IInvoice } from "@/modules/invoice/Invoice.model.js";
import { createBusiness } from "./business.factory.js";
import { createClient } from "./client.factory.js";
import { createProduct } from "./product.factory.js";
import { createUser } from "./user.factory.js";
import { createBusinessMember } from "./business-member.factory.js";
import { BUSINESS_ROLE } from "@/consts.js";

export const createInvoicePayload = async () => {
  const user = await createUser();
  const business = await createBusiness({
    createdBy: user._id,
  });
  await createBusinessMember({
    userId: user._id,
    businessId: business._id,
    role: BUSINESS_ROLE.OWNER
  })
  const product1 = await createProduct({
    businessId: business._id,
    createdBy: user._id,
  });
  const product2 = await createProduct({
    businessId: business._id,
    createdBy: user._id,
  });

  const items = [
    {
      productId: product1._id,
      quantity: 3,
    }, {
      productId: product2._id,
      quantity: 2,
    }
  ]

  const client = await createClient({
    businessId: business._id,
    createdBy: user._id,
  });

  return {
    user,
    business,
    client,
    payload: {
      clientId: client._id,
      items,
    }
  }
}


export const createInvoice = async (
  overrides: Partial<IInvoice> = {}
) => {
  const createdBy = overrides.createdBy || (await createUser())._id;
  const businessId = overrides.businessId || (await createBusiness({
    createdBy,
  }))._id;
  const product1 = await createProduct({
    businessId,
    createdBy,
  });
  const product2 = await createProduct({
    businessId,
    createdBy,
  });

  const items = [
    {
      productId: product1._id,
      name: product1.name,
      price: product1.price,
      quantity: 3,
      total: product1.price * 3,
    }, {
      productId: product2._id,
      name: product2.name,
      price: product2.price,
      quantity: 2,
      total: product2.price * 2,
    }
  ]

  const client = await createClient({
    businessId,
    createdBy,
  });

  return await Invoice.create({
    ...overrides,
    businessId,
    createdBy,
    client: client._id,
    items,
    invoiceNumber: "INV-0001",
    subtotal: items.reduce((acc, item) => acc + item.total, 0),
    total: items.reduce((acc, item) => acc + item.total, 0),
  })
}