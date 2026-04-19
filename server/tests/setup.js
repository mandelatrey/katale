// Shared test setup: spin up an in-memory Mongo, connect mongoose once,
// wipe collections between tests.
//
// mongodb-memory-server downloads a mongod binary on first run. In some
// sandboxes that download is blocked, so we catch the failure and let
// DB-backed tests skip instead of failing the whole suite. Pure-unit
// tests (e.g. the whatsapp stubs) still run. See `hasMongo()`.
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

let mongod;
globalThis.__MONGO_READY = false;

beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create({
      binary: { version: process.env.MONGOMS_VERSION || "7.0.14" },
    });
    await mongoose.connect(mongod.getUri());
    globalThis.__MONGO_READY = true;
  } catch (err) {
    console.warn(
      "[tests] mongodb-memory-server unavailable; DB-backed tests will be skipped.\n" +
        "        Reason:",
      err.message,
    );
  }
});

afterEach(async () => {
  if (!globalThis.__MONGO_READY) return;
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
});

afterAll(async () => {
  if (globalThis.__MONGO_READY) await mongoose.disconnect();
  await mongod?.stop();
});

export function hasMongo() {
  return globalThis.__MONGO_READY === true;
}
