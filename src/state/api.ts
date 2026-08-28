// Client-side data layer: talks to the Vercel serverless API (/api/*) backed by
// MongoDB Atlas, so the acervo is SHARED — two people edit the same data from
// different machines.
//
// Two kinds of failure are told apart on purpose:
//   • NetworkError — the request never reached the server (offline, timeout).
//     The store keeps the edit and retries; nothing is lost.
//   • Error        — the server answered with a problem. Also retried, but shown
//     to the user, because it usually needs attention.
//
// Auth is a single shared password sent in the `x-app-password` header. It's
// kept in memory and mirrored to sessionStorage so a page reload within the same
// tab stays logged in.

import { APG, ThemeSettings } from "./types";
import { BlobRef, toWire } from "./blobs";

const PW_KEY = "domineaqui.pw";

// A request that hasn't answered by now is treated as a network failure. Well
// above a normal round-trip, well below the user losing patience.
const TIMEOUT_MS = 30000;

let password: string | null = (() => {
  try {
    return sessionStorage.getItem(PW_KEY);
  } catch {
    return null;
  }
})();

export function getPassword(): string | null {
  return password;
}

export function setPassword(pw: string | null): void {
  password = pw;
  try {
    if (pw) sessionStorage.setItem(PW_KEY, pw);
    else sessionStorage.removeItem(PW_KEY);
  } catch {
    /* sessionStorage blocked — password still lives in memory */
  }
}

/** Thrown on 401 so callers can drop back to the login screen. */
export class AuthError extends Error {}

/** Thrown when the request never got an answer (offline, DNS, timeout). */
export class NetworkError extends Error {}

async function api(path: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-app-password": password ?? "",
        ...(init?.headers || {}),
      },
    });
  } catch (e) {
    throw new NetworkError(
      (e as Error)?.name === "AbortError"
        ? "O servidor demorou demais para responder."
        : "Sem conexão com o servidor."
    );
  } finally {
    window.clearTimeout(timer);
  }

  if (res.status === 401) throw new AuthError("Senha incorreta ou sessão expirada.");
  // 5xx and 429 are transient from the client's point of view: the platform is
  // busy or a function crashed. Report them as network-ish so the store retries
  // quietly instead of shouting at the user on every hiccup.
  if (res.status >= 500 || res.status === 429) {
    throw new NetworkError(`O servidor respondeu ${res.status}. Tentando de novo…`);
  }
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    if (res.status === 413) msg = "Conteúdo grande demais para o servidor.";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  return res;
}

export interface RemoteState {
  apgs: APG[];
  theme: Partial<ThemeSettings> | null;
  /** Legacy documents still waiting to be converted to the split storage. */
  pendingMigration?: number;
}

/** Load the shared acervo — APG metadata only; pictures come from fetchBlobs. */
export async function fetchState(): Promise<RemoteState> {
  const res = await api("state");
  return res.json();
}

/** Validate a candidate password; on success it becomes the active password. */
export async function login(pw: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch("/api/state", { headers: { "x-app-password": pw } });
  } catch {
    throw new NetworkError("Sem conexão com o servidor.");
  }
  if (res.status === 401) return false;
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  setPassword(pw);
  return true;
}

/** Upsert a single APG (without its pictures — those go through saveBlob). */
export async function saveApg(apg: APG): Promise<void> {
  await api("apgs", { method: "PUT", body: JSON.stringify(toWire(apg)) });
}

/** Upsert many APGs at once (used by import). */
export async function saveApgs(apgs: APG[]): Promise<void> {
  if (apgs.length === 0) return;
  await api("apgs", { method: "PUT", body: JSON.stringify({ apgs: apgs.map(toWire) }) });
}

/** Delete a single APG by id (the server drops its pictures too). */
export async function deleteApgRemote(id: string): Promise<void> {
  await api(`apgs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Upsert the shared theme. */
export async function saveTheme(theme: ThemeSettings): Promise<void> {
  await api("theme", { method: "PUT", body: JSON.stringify(theme) });
}

// ---- pictures -------------------------------------------------------------

export interface FetchedBlobs {
  blobs: { key: string; rev: string; dataUrl: string }[];
  /** Keys the response had no room for; ask again with them. */
  next: string[];
}

/** Download the pictures of one APG (optionally only some keys). */
export async function fetchBlobs(apgId: string, keys?: string[]): Promise<FetchedBlobs> {
  const q = new URLSearchParams({ apg: apgId });
  if (keys?.length) q.set("keys", keys.join(","));
  const res = await api(`blobs?${q.toString()}`);
  const j = await res.json();
  return { blobs: Array.isArray(j?.blobs) ? j.blobs : [], next: Array.isArray(j?.next) ? j.next : [] };
}

/** Upload one picture. Small enough that it always fits the platform's cap. */
export async function saveBlob(b: BlobRef): Promise<void> {
  await api("blobs", { method: "PUT", body: JSON.stringify(b) });
}
