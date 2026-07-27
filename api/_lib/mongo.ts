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
    // Fail fast (well under the function's execution limit) instead of hanging
    // until the platform kills the invocation — e.g. when Atlas's Network
    // Access list doesn't allow Vercel's IPs, the TCP handshake never
    // completes. A short timeout turns that into a normal JSON error.
    const p = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect();
    g._mongoClientPromise = p.catch((err) => {
      // Don't cache a failed connection attempt — let the next request retry.
      g._mongoClientPromise = undefined;
      throw err;
    });
  }
  return g._mongoClientPromise;
}

/** Get the shared Db handle (connecting lazily on first use). */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
