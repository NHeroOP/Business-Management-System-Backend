import { faker } from '@faker-js/faker';
import { User } from "@/modules/user/User.model.js"

export const createUserPayload = () => ({
  username: faker.internet.username(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: "password123"
})

export const createUser = async (overrides = {}) => {
  return await User.create({
    ...createUserPayload(),
    avatar: {
      url: faker.image.avatar(),
      publicId: faker.string.alpha({ length: 8 }),
    },
    ...overrides,
  });
};
