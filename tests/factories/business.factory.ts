import crypto from "crypto";
import slugify from "slugify";
import { faker } from '@faker-js/faker';
import { Business, type IBusinessDocument } from "@/modules/business/Business.model.js"
import { createUser } from "./user.factory.js";
import { createBusinessMember } from "./business-member.factory.js";
import { BUSINESS_ROLE } from "@/consts.js";


const createSlug = (name: string) => {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });
  const suffix = crypto.randomBytes(2).toString("hex");

  return `${baseSlug}-${suffix}`;
}

export const createBusinessPayload = () => ({
  name: faker.company.name(),
  description: faker.company.catchPhrase(),
  address: faker.location.streetAddress(),
  phone: faker.phone.number(),
  email: faker.internet.email(),
})

export const createBusiness = async (
  overrides: Partial<IBusinessDocument> = {}
) => {
  const { createdBy: overriddenCreatedBy, ...restOverrides } = overrides;
  const createdBy = overriddenCreatedBy || (await createUser())._id;
  const payload = createBusinessPayload();
  const slug = createSlug(payload.name);
  const business = await Business.create({
    slug,
    createdBy,
    ...payload,
    ...restOverrides,
  });

  await createBusinessMember({
    userId: createdBy,
    businessId: business._id,
    role: BUSINESS_ROLE.OWNER,
  })

  return business;
} 

