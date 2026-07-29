// Shared MongoDB connection for the Vercel serverless functions.
//
// Serverless invocations are short-lived and can run concurrently, so we cache
// the MongoClient (as a connecting Promise) on the Node global. This keeps a
// single connection pool warm across invocations instead of opening a new
// connection — and exhausting Atlas's connection limit — on every request.

import { MongoClient, Db, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;
// Database name: taken from MONGODB_DB, else the db in the URI, else a default.
const dbName = process.env.MONGODB_DB || "domineaqui";

const options: MongoClientOptions = {
  // Fail fast (well under the function's execution limit) instead of hanging
  // until the platform kills the invocation — e.g. when Atlas's Network Access
  // list doesn't allow Vercel's IPs, the TCP handshake never completes. A short
  // timeout turns that into a normal JSON error.
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  socketTimeoutMS: 20_000,
  // Every concurrent lambda keeps its own pool, and the default cap (100) lets a
  // handful of instances exhaust a shared-tier connection limit — which shows up
  // as sporadic 500s under polling. A few sockets per instance is plenty here.
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,
  retryReads: true,
  retryWrites: true,
};

// Reuse across hot invocations (and survive HMR in dev) via the global object.
const g = globalThis as unknown as { _mongoClientPromise?: Promise<MongoClient> };

function clientPromise(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI não está configurada no servidor.");
  if (!g._mongoClientPromise) {
    const p = new MongoClient(uri, options).connect();
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

/** Drop the cached client so the next call dials a fresh connection. */
async function resetClient(): Promise<void> {
  const pending = g._mongoClientPromise;
  g._mongoClientPromise = undefined;
  if (!pending) return;
  try {
    await (await pending).close(true);
  } catch {
    /* already broken — nothing to clean up */
  }
}

/** A cached client can go stale while the lambda is frozen: the sockets die and
 *  the next invocation reuses a topology that is already closed. Those failures
 *  are transient — reconnecting once fixes them. */
function isTransient(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null;
  const name = e?.name ?? "";
  const msg = String(e?.message ?? "");
  return (
    name === "MongoNotConnectedError" ||
    name === "MongoTopologyClosedError" ||
    name === "MongoNetworkError" ||
    name === "MongoExpiredSessionError" ||
    /topology (?:was destroyed|is closed)/i.test(msg) ||
    /connection .*closed/i.test(msg) ||
    /pool .*cleared/i.test(msg)
  );
}

/** Run a database operation, retrying once on a stale cached connection. */
export async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  try {
    return await fn(await getDb());
  } catch (err) {
    if (!isTransient(err)) throw err;
    await resetClient();
    return fn(await getDb());
  }
}
