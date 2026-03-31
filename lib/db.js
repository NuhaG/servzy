import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "servzy";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI not defined");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const activeDbName = cached.conn?.connection?.db?.databaseName;
  if (cached.conn && activeDbName === MONGODB_DB_NAME) return cached.conn;
  if (cached.conn && activeDbName && activeDbName !== MONGODB_DB_NAME) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        dbName: MONGODB_DB_NAME,
      })
      .catch((error) => {
        // Allow retries on subsequent requests instead of keeping a rejected promise forever.
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
