// One-way migration of the legacy "everything inline" APG document to the split
// shape (slim document + one document per picture in `blobs`).
//
// It runs lazily: /api/state migrates a few documents per request, and any write
// migrates the document it is about to touch. Nothing has to be done by hand and
// no picture is ever dropped — the inline data is only removed from the APG
// document AFTER the blob documents have been written.

import type { Collection } from "mongodb";
import { blobId, splitApg } from "./blobs.js";

/** How many legacy documents a single /api/state call converts. */
export const MIGRATE_BUDGET = 8;

/** Marker set on every document already stored in the split shape. */
export const SPLIT_FLAG = "blobsSplit";

/**
 * Convert one legacy document. Returns the migrated (slim) document, or the
 * document unchanged when it was already split or the conversion failed — the
 * caller then simply serves what it has, and the next request tries again.
 */
export async function splitDoc(
  apgs: Collection<any>,
  blobs: Collection<any>,
  doc: any
): Promise<any> {
  if (!doc || doc[SPLIT_FLAG] === true) return doc;
  const { doc: slim, blobs: extracted } = splitApg(doc);
  const apgId = String(doc._id);

  if (extracted.length) {
    const now = Date.now();
    await blobs.bulkWrite(
      extracted.map((b) => ({
        updateOne: {
          filter: { _id: blobId(apgId, b.key) },
          update: {
            $set: {
              apgId,
              key: b.key,
              rev: b.rev,
              dataUrl: b.dataUrl,
              bytes: b.dataUrl.length,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  const { _id, ...rest } = slim;
  await apgs.updateOne({ _id: doc._id }, { $set: { ...rest, [SPLIT_FLAG]: true } });
  return { ...slim, [SPLIT_FLAG]: true };
}

/** Migrate the document with this id if it is still in the legacy shape. */
export async function ensureSplit(
  apgs: Collection<any>,
  blobs: Collection<any>,
  id: string
): Promise<any | null> {
  const doc = await apgs.findOne({ _id: id as any });
  if (!doc) return null;
  if (doc[SPLIT_FLAG] === true) return doc;
  return splitDoc(apgs, blobs, doc);
}
