// Client-side data layer: talks to the Vercel serverless API (/api/*) backed by
// MongoDB Atlas. Replaces the old local IndexedDB/localStorage persistence so the
// acervo is SHARED — two people edit the same data from different machines.
//
// Auth is a single shared password sent in the `x-app-password` header. It's kept
// in memory and mirrored to sessionStorage so a page reload within the same tab
// stays logged in (it's cleared when the tab closes — it is NOT the old data-in-
// localStorage that this migration removed).

import { APG, ThemeSettings } from "./types";

const PW_KEY = "domineaqui.pw";

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

async function api(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-app-password": password ?? "",
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) throw new AuthError("Senha incorreta ou sessão expirada.");
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
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
}

/** Load the whole shared acervo. */
export async function fetchState(): Promise<RemoteState> {
  const res = await api("state");
  return res.json();
}

/** Validate a candidate password; on success it becomes the active password. */
export async function login(pw: string): Promise<boolean> {
  const res = await fetch("/api/state", { headers: { "x-app-password": pw } });
  if (res.status === 401) return false;
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  setPassword(pw);
  return true;
}

/** Upsert a single APG. */
export async function saveApg(apg: APG): Promise<void> {
  await api("apgs", { method: "PUT", body: JSON.stringify(apg) });
}

/** Upsert many APGs at once (used by import). */
export async function saveApgs(apgs: APG[]): Promise<void> {
  if (apgs.length === 0) return;
  await api("apgs", { method: "PUT", body: JSON.stringify({ apgs }) });
}

/** Delete a single APG by id. */
export async function deleteApgRemote(id: string): Promise<void> {
  await api(`apgs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Upsert the shared theme. */
export async function saveTheme(theme: ThemeSettings): Promise<void> {
  await api("theme", { method: "PUT", body: JSON.stringify(theme) });
}
