import { faker } from '@faker-js/faker';
import { createUser } from './user.factory.js';
import { createBusiness } from './business.factory.js';
import { Client, type IClientDocument } from '@/modules/client/Client.model.js';

export const createClientPayload = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  address: faker.location.streetAddress(),
  companyName: faker.company.name(),
  gstNumber: faker.string.alphanumeric({ length: 15 }),
  notes: faker.lorem.sentence(),
  tags: [faker.commerce.department(), faker.commerce.productAdjective()],
})

export const createClient = async (overrides: Partial<IClientDocument> = {}) => {
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

  return await Client.create({
    businessId,
    createdBy,
    ...createClientPayload(),
    ...overrides,
  });
}