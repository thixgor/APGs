// Minimal IndexedDB wrapper (no dependencies). Two stores:
//
//   kv     — small values: the local snapshot of the acervo, the backup folder
//            handle, sync bookkeeping.
//   blobs  — the pictures, one record per image, keyed by CONTENT revision.
//            Content-addressed means two APGs using the same picture share one
//            record, and a picture already on this machine is never downloaded
//            again.
//
// This is the local safety net: whatever the network does, the work is on disk
// here. localStorage was never an option — its ~5 MB quota is what silently
// dropped images in the first place.

const DB_NAME = "domineaqui";
const DB_VERSION = 2;
const KV = "kv";
const BLOBS = "blobs";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
    };
    req.onsuccess = () => {
      const db = req.result;
      // A version change from another tab invalidates this handle; drop the
      // cached promise so the next call reopens instead of throwing forever.
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => {
      /* another tab holds an older version open; it will resolve when it closes */
    };
  });
  return dbPromise;
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  body: (s: IDBObjectStore) => IDBRequest | null
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let req: IDBRequest | null = null;
        const tx = db.transaction(store, mode);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
        tx.oncomplete = () => resolve((req ? req.result : undefined) as T);
        try {
          req = body(tx.objectStore(store));
        } catch (e) {
          reject(e);
        }
      })
  );
}

export function idbGet<T = unknown>(key: string): Promise<T | undefined> {
  return run<T | undefined>(KV, "readonly", (s) => s.get(key));
}

export function idbSet(key: string, value: unknown): Promise<void> {
  return run<void>(KV, "readwrite", (s) => s.put(value, key));
}

export function idbDelete(key: string): Promise<void> {
  return run<void>(KV, "readwrite", (s) => s.delete(key));
}

// ---- picture cache (content-addressed) -----------------------------------

export function blobGet(rev: string): Promise<string | undefined> {
  return run<string | undefined>(BLOBS, "readonly", (s) => s.get(rev));
}

export function blobPut(rev: string, dataUrl: string): Promise<void> {
  return run<void>(BLOBS, "readwrite", (s) => s.put(dataUrl, rev));
}

/** Read many pictures at once (one transaction). Missing revs are skipped. */
export async function blobGetMany(revs: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (revs.length === 0) return out;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS, "readonly");
    const store = tx.objectStore(BLOBS);
    for (const rev of revs) {
      const req = store.get(rev);
      req.onsuccess = () => {
        if (typeof req.result === "string") out.set(rev, req.result);
      };
    }
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Write many pictures at once (one transaction). */
export async function blobPutMany(entries: [string, string][]): Promise<void> {
  if (entries.length === 0) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS, "readwrite");
    const store = tx.objectStore(BLOBS);
    for (const [rev, dataUrl] of entries) store.put(dataUrl, rev);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Drop cached pictures no APG references any more (keeps the cache bounded). */
export async function blobPrune(keep: Set<string>): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    let removed = 0;
    const tx = db.transaction(BLOBS, "readwrite");
    const store = tx.objectStore(BLOBS);
    const req = store.openKeyCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (!cur) return;
      const key = String(cur.key);
      if (!keep.has(key)) {
        store.delete(cur.key);
        removed += 1;
      }
      cur.continue();
    };
    tx.oncomplete = () => resolve(removed);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
