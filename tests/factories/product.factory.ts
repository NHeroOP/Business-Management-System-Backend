import { faker } from '@faker-js/faker';
import { createUser } from './user.factory.js';
import { createBusiness } from './business.factory.js';

import { PRODUCT_TYPE } from '@/consts.js';
import { Product, type IProduct } from '@/modules/product/Product.model.js';


export const createProductPayload = () => ({
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price()),
  type: PRODUCT_TYPE.PRODUCT,
  stockQuantity: faker.number.int({ min: 0, max: 100 }),
  sku: faker.string.alphanumeric({ length: 8 }),
  tags: [faker.commerce.department(), faker.commerce.productAdjective()],
})

export const createProduct = async(
  overrides: Partial<IProduct> = {}
) => {
  let createdBy = overrides.createdBy;
  let businessId = overrides.businessId;

  if (!createdBy && !businessId) {
    const user = await createUser();
    const business = await createBusiness({ createdBy: user._id });
    createdBy = user._id;
    businessId = business._id;
  } else {
    createdBy = createdBy || (await createUser())._id;
    businessId = businessId || (await createBusiness({ createdBy }))._id;
  }

  return await Product.create({
    ...createProductPayload(),
    ...overrides,
    createdBy,
    businessId,
  });
}