// ── OmniLife API Client ──────────────────────────────────────────────────────
//
// ⚠️ SECURITY WARNING
// Calling OmniLife directly from the browser exposes these credentials in the
// compiled JS bundle and will typically fail CORS. For production, proxy these
// calls through a backend endpoint and pass the Authorization header server-
// side. This module is intended for a UAT prototype only.

const BASE_URL =
  (import.meta.env.VITE_OMNILIFE_BASE_URL as string | undefined) ??
  'https://uat.omnilife.com.au/API/4';

const USERNAME =
  (import.meta.env.VITE_OMNILIFE_USERNAME as string | undefined) ?? 'FinuraDigital';

const PASSWORD =
  (import.meta.env.VITE_OMNILIFE_PASSWORD as string | undefined) ??
  '16HahIceQ42WpmurCIdP';

function authHeader(): string {
  return `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`OmniLife ${path} returned ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Occupations ──────────────────────────────────────────────────────────────

export interface OmniOccupation {
  // The OmniLife spec describes occupation records with code + name fields.
  // We stay permissive on the shape so the mapper still works if the API uses
  // slightly different keys (code/Code, name/Name/description).
  code?: string;
  name?: string;
  description?: string;
  Code?: string;
  Name?: string;
  Description?: string;
  [k: string]: unknown;
}

export interface OccupationOption {
  code: string;
  label: string;
}

function normaliseOccupation(raw: OmniOccupation): OccupationOption | null {
  const code = raw.code ?? raw.Code ?? '';
  const name = raw.name ?? raw.Name ?? raw.description ?? raw.Description ?? '';
  if (!code && !name) return null;
  const label = code && name ? `${code} - ${name}` : code || String(name);
  return { code: String(code || name), label };
}

export async function fetchOccupations(): Promise<OccupationOption[]> {
  // The OmniLife v4 spec returns occupations as an array (possibly wrapped
  // under a root key). Accept both shapes.
  const payload = await get<OmniOccupation[] | { occupations?: OmniOccupation[]; data?: OmniOccupation[] }>(
    '/occupations',
  );

  const list: OmniOccupation[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.occupations)
      ? payload.occupations!
      : Array.isArray(payload?.data)
        ? payload.data!
        : [];

  return list
    .map(normaliseOccupation)
    .filter((o): o is OccupationOption => o !== null);
}
