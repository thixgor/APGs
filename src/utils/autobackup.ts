// Automatic backups to a real folder on the user's PC, via the File System
// Access API (Chrome/Edge). The user picks a folder once; the app then writes a
// rolling backup file there whenever the data changes, plus a dated daily
// snapshot. The directory handle is persisted in IndexedDB so it survives
// reloads (permission may need a one-click re-grant per session).

import { APG, ThemeSettings } from "../state/types";
import { idbGet, idbSet, idbDelete } from "../state/db";

const DIR_KEY = "backupDir";
const FILE_NAME = "DomineAqui-APGs-backup.json";

type DirHandle = any; // FileSystemDirectoryHandle (not in all TS lib versions)

export function fsSupported(): boolean {
  return typeof (window as any).showDirectoryPicker === "function";
}

/** Prompt the user to choose a backup folder (requires a user gesture). */
export async function pickBackupDir(): Promise<DirHandle> {
  const handle = await (window as any).showDirectoryPicker({
    id: "domineaqui-backup",
    mode: "readwrite",
  });
  await idbSet(DIR_KEY, handle);
  return handle;
}

export async function getBackupDir(): Promise<DirHandle | undefined> {
  try {
    return await idbGet<DirHandle>(DIR_KEY);
  } catch {
    return undefined;
  }
}

export async function clearBackupDir(): Promise<void> {
  await idbDelete(DIR_KEY);
}

export function dirName(handle: DirHandle): string {
  return handle?.name ?? "pasta";
}

/** Check/obtain readwrite permission. Only requests (which needs a gesture)
 *  when `request` is true. */
export async function ensurePermission(handle: DirHandle, request = false): Promise<boolean> {
  if (!handle?.queryPermission) return true;
  const opts = { mode: "readwrite" };
  let perm: string = await handle.queryPermission(opts);
  if (perm === "granted") return true;
  if (request && handle.requestPermission) perm = await handle.requestPermission(opts);
  return perm === "granted";
}

function payload(apgs: APG[], theme: ThemeSettings): string {
  return JSON.stringify({
    app: "domineaqui.apgs",
    version: 1,
    exportedAt: new Date().toISOString(),
    count: apgs.length,
    theme,
    apgs,
  });
}

/** Write the rolling backup file plus a dated daily snapshot to the folder. */
export async function writeBackup(
  handle: DirHandle,
  apgs: APG[],
  theme: ThemeSettings
): Promise<void> {
  const data = payload(apgs, theme);
  const main = await handle.getFileHandle(FILE_NAME, { create: true });
  const w = await main.createWritable();
  await w.write(data);
  await w.close();
  // Dated snapshot (one per day; overwritten as the day progresses).
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    const snap = await handle.getFileHandle(`DomineAqui-APGs-${stamp}.json`, { create: true });
    const w2 = await snap.createWritable();
    await w2.write(data);
    await w2.close();
  } catch {
    /* snapshot is best-effort */
  }
}
