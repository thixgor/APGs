// Maps between the Mongo document shape and the client APG shape, and defines
// how the heavy part of an APG — the base64 images — is kept OUT of the normal
// request/response path.
//
// Why: a Vercel function may not return (or receive) more than ~4.5 MB. An APG
// carries its images inline as data URLs (`images[].dataUrl`, and
// `exercises[].imageDataUrl`), so a handful of photos used to push /api/state
// past that ceiling and every request started failing with a 500.
//
// So images live in their own `assets` collection, one document per image, and
// the APG document only keeps a `sig` (a content signature) per image. The
// client fetches/uploads assets one at a time and caches them by `sig`, so:
//   - no single response is ever more than a few hundred KB,
//   - the 7 s poll no longer re-downloads the whole acervo,
//   - an APG can never outgrow Mongo's 16 MB document limit.
//
// Documents written before this split still hold their data URLs inline; they
// are read transparently (see `legacyAssetPipeline`) and get migrated to the
// `assets` collection the next time the APG is saved.

/** Asset key inside an APG: an image (`img:<imageId>`) or an exercise image
 *  (`ex:<exerciseId>`). */
export type AssetKey = string;

/** `_id` of an asset document: apg id + key. */
export function assetId(apgId: string, key: AssetKey): string {
  return `${apgId}::${key}`;
}

/** Signature used for legacy inline images (no stored `sig`): the data URL's
 *  length, computed server-side. Distinct from client signatures by its "L"
 *  prefix, and stable as long as the image doesn't change. */
export function legacySigExpr(field: string) {
  return {
    $concat: ["L", { $toString: { $strLenCP: { $ifNull: [field, ""] } } }],
  };
}

/** Aggregation stage that returns APG documents WITHOUT any data URL: each
 *  image keeps only its metadata plus the `sig` the client resolves against its
 *  asset cache. Unknown/extra fields on an exercise are preserved. */
export function liteApgStage() {
  return {
    $addFields: {
      images: {
        $map: {
          input: { $ifNull: ["$images", []] },
          as: "im",
          in: {
            id: "$$im.id",
            caption: "$$im.caption",
            width: "$$im.width",
            height: "$$im.height",
            sig: { $ifNull: ["$$im.sig", legacySigExpr("$$im.dataUrl")] },
          },
        },
      },
      exercises: {
        $map: {
          input: { $ifNull: ["$exercises", []] },
          as: "ex",
          in: {
            $mergeObjects: [
              {
                $arrayToObject: {
                  $filter: {
                    input: { $objectToArray: "$$ex" },
                    as: "kv",
                    cond: { $ne: ["$$kv.k", "imageDataUrl"] },
                  },
                },
              },
              {
                imageSig: {
                  $ifNull: [
                    "$$ex.imageSig",
                    {
                      $cond: [
                        { $gt: [{ $strLenCP: { $ifNull: ["$$ex.imageDataUrl", ""] } }, 0] },
                        legacySigExpr("$$ex.imageDataUrl"),
                        null,
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  };
}

/** Pipeline that pulls specific inline data URLs out of ONE legacy APG document
 *  without loading the whole (possibly multi-MB) document. */
export function legacyAssetPipeline(apgId: string, imageIds: string[], exerciseIds: string[]) {
  return [
    { $match: { _id: apgId } },
    {
      $project: {
        images: {
          $filter: {
            input: { $ifNull: ["$images", []] },
            as: "im",
            cond: { $in: ["$$im.id", imageIds] },
          },
        },
        exercises: {
          $filter: {
            input: { $ifNull: ["$exercises", []] },
            as: "ex",
            cond: { $in: ["$$ex.id", exerciseIds] },
          },
        },
      },
    },
    {
      $project: {
        images: {
          $map: {
            input: "$images",
            as: "im",
            in: { id: "$$im.id", dataUrl: { $ifNull: ["$$im.dataUrl", ""] } },
          },
        },
        exercises: {
          $map: {
            input: "$exercises",
            as: "ex",
            in: { id: "$$ex.id", dataUrl: { $ifNull: ["$$ex.imageDataUrl", ""] } },
          },
        },
      },
    },
  ];
}

export function docToApg(doc: any) {
  if (!doc) return doc;
  const { _id, updatedAt, ...rest } = doc;
  return { id: _id, ...rest };
}

export function docToTheme(doc: any) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

/** Response budget. Vercel caps a function response at ~4.5 MB; we stay well
 *  under it and tell the client what didn't fit so it can ask again. */
export const MAX_RESPONSE_BYTES = 3_000_000;

/**
 * Take items while they fit in the budget. At least one item is always taken —
 * otherwise a single oversized item would stall the client in a fetch loop.
 */
export function takeWithinBudget<T>(
  items: T[],
  sizeOf: (item: T) => number,
  budget = MAX_RESPONSE_BYTES
): { taken: T[]; rest: T[] } {
  const taken: T[] = [];
  let total = 0;
  let i = 0;
  for (; i < items.length; i++) {
    const size = sizeOf(items[i]);
    if (taken.length > 0 && total + size > budget) break;
    taken.push(items[i]);
    total += size;
  }
  return { taken, rest: items.slice(i) };
}

/** Parse a repeatable query param that may arrive as a string or an array. */
export function queryList(raw: string | string[] | undefined): string[] {
  const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return parts
    .flatMap((p) => String(p).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** First value of a query param. */
export function queryOne(raw: string | string[] | undefined): string | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v == null || v === "" ? undefined : String(v);
}
