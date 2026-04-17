// ── OmniLife API Client ──────────────────────────────────────────────────────
//
// Requests go through server-side proxies to avoid CORS:
//   - Dev: Vite dev server proxy (vite.config.ts)
//   - Production: Vercel serverless function (api/occupations.ts)

export interface OccupationOption {
  code: string;
  label: string;
}

interface RawOccupation {
  id?: string;
  description?: string;
  code?: string;
  name?: string;
  [k: string]: unknown;
}

function normalise(raw: RawOccupation): OccupationOption | null {
  const code = raw.id ?? raw.code ?? '';
  const name = raw.description ?? raw.name ?? '';
  if (!code && !name) return null;
  return {
    code: String(code || name),
    label: String(name || code),
  };
}

export async function fetchOccupations(): Promise<OccupationOption[]> {
  const res = await fetch('/api/occupations', {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`OmniLife /occupations returned ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  const list: RawOccupation[] = Array.isArray(payload) ? payload : [];

  return list.map(normalise).filter((o): o is OccupationOption => o !== null);
}
