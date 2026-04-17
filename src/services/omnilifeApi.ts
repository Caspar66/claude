// ── OmniLife API Client ──────────────────────────────────────────────────────
//
// All requests go through /api/omnilife/* which is proxied server-side:
//   - Dev: Vite dev server proxy (vite.config.ts)
//   - Production: Vercel serverless function (api/omnilife/[...path].ts)
// This avoids CORS and keeps credentials out of the client bundle.

const BASE_URL = '/api/omnilife';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
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
