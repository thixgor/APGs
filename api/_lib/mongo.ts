// Shared MongoDB connection for the Vercel serverless functions.
//
// Serverless invocations are short-lived and can run concurrently, so we cache
// the MongoClient (as a connecting Promise) on the Node global. This keeps a
// single connection pool warm across invocations instead of opening a new
// connection — and exhausting Atlas's connection limit — on every request.

import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
// Database name: taken from MONGODB_DB, else the db in the URI, else a default.
const dbName = process.env.MONGODB_DB || "domineaqui";

// Reuse across hot invocations (and survive HMR in dev) via the global object.
const g = globalThis as unknown as { _mongoClientPromise?: Promise<MongoClient> };

function clientPromise(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI não está configurada no servidor.");
  if (!g._mongoClientPromise) {
    g._mongoClientPromise = new MongoClient(uri).connect();
  }
  return g._mongoClientPromise;
}

/** Get the shared Db handle (connecting lazily on first use). */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
