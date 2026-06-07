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
  const createdBy = overrides.createdBy || (await createUser())._id;
  const businessId = overrides.businessId || (await createBusiness())._id;
  return await Product.create({
    ...createProductPayload(),
    ...overrides,
    createdBy,
    businessId,
  });
}