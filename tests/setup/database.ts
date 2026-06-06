import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet: MongoMemoryReplSet;

export const connectTestDatabase = async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });

  await mongoose.connect(replSet.getUri());
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key]!.deleteMany({});
  }
};

export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  await replSet.stop();
};
