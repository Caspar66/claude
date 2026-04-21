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

// ── Occupation Mappings ─────────────────────────────────────────────────────

export interface OccupationMapping {
  supplierCode: string;
  description: string;
  classTRM: string;
  classTRA: string;
  classTPDADL: string;
  classTPDAny: string;
  classTPDOwn: string;
  classINC: string;
  classBUS: string;
}

export async function fetchOccupationMappings(occupationId: string): Promise<OccupationMapping[]> {
  const res = await fetch(`/api/occupation-mappings/${encodeURIComponent(occupationId)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`OmniLife /occupations/${occupationId}/mappings returned ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (!Array.isArray(payload)) return [];
  return payload.map((raw: Record<string, unknown>) => ({
    supplierCode: typeof raw.supplierCode === 'string' ? raw.supplierCode : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    classTRM: typeof raw.classTRM === 'string' ? raw.classTRM : '',
    classTRA: typeof raw.classTRA === 'string' ? raw.classTRA : '',
    classTPDADL: typeof raw.classTPDADL === 'string' ? raw.classTPDADL : '',
    classTPDAny: typeof raw.classTPDAny === 'string' ? raw.classTPDAny : '',
    classTPDOwn: typeof raw.classTPDOwn === 'string' ? raw.classTPDOwn : '',
    classINC: typeof raw.classINC === 'string' ? raw.classINC : '',
    classBUS: typeof raw.classBUS === 'string' ? raw.classBUS : '',
  })).filter((m) => m.supplierCode);
}

// ── Legacy Suppliers ─────────────────────────────────────────────────────────

export interface LegacySupplier {
  code: string;
  name: string;
}

export async function fetchLegacySuppliers(): Promise<LegacySupplier[]> {
  const res = await fetch('/api/legacy-suppliers', {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`OmniLife /legacy/suppliers returned ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  const list: Record<string, unknown>[] = Array.isArray(payload) ? payload : [];
  return list
    .map((raw) => ({
      code: typeof raw.code === 'string' ? raw.code : (typeof raw.id === 'string' ? raw.id : ''),
      name: typeof raw.name === 'string' ? raw.name : (typeof raw.description === 'string' ? raw.description : ''),
    }))
    .filter((s): s is LegacySupplier => Boolean(s.code || s.name))
    .map((s) => ({ code: s.code || s.name, name: s.name || s.code }));
}

// ── Suppliers ────────────────────────────────────────────────────────────────

export interface SupplierProduct {
  code: string;
  name: string;
  [k: string]: unknown;
}

export interface CommissionChoice {
  code: string;
  name: string;
  structure?: string;
  upfrontPercentage?: number;
  ongoingPercentage?: number;
}

export interface Supplier {
  code: string;
  name: string;
  type?: string;
  fundType: string;
  logo?: string;
  url?: string;
  cmapRating?: string;
  defaultCampaignCode?: string;
  defaultCommissionCode?: string;
  minimumCommissionCode?: string;
  commissionText?: string;
  commissionOptions?: CommissionChoice[];
  products: SupplierProduct[];
}

function normaliseSupplier(raw: Record<string, unknown>): Supplier | null {
  const code = typeof raw.code === 'string' ? raw.code : '';
  const name = typeof raw.name === 'string' ? raw.name : '';
  if (!code && !name) return null;

  const fundType = typeof raw.fundType === 'string' ? raw.fundType : 'Other';
  const products = Array.isArray(raw.products)
    ? (raw.products as Record<string, unknown>[])
        .map((p) => ({
          code: typeof p.code === 'string' ? p.code : '',
          name: typeof p.name === 'string' ? p.name : '',
          ...p,
        }))
        .filter((p): p is SupplierProduct => Boolean(p.code || p.name))
    : [];

  const commissionOptions = Array.isArray(raw.commissionOptions)
    ? (raw.commissionOptions as Record<string, unknown>[])
        .map((c) => ({
          code: typeof c.code === 'string' ? c.code : '',
          name: typeof c.name === 'string' ? c.name : (typeof c.description === 'string' ? c.description : ''),
          structure: typeof c.structure === 'string' ? c.structure : undefined,
          upfrontPercentage: typeof c.upfrontPercentage === 'number' ? c.upfrontPercentage : undefined,
          ongoingPercentage: typeof c.ongoingPercentage === 'number' ? c.ongoingPercentage : undefined,
        }))
        .filter((c) => c.code)
    : undefined;

  return {
    code: code || name,
    name: name || code,
    type: typeof raw.type === 'string' ? raw.type : undefined,
    fundType,
    logo: typeof raw.logo === 'string' ? raw.logo : undefined,
    url: typeof raw.url === 'string' ? raw.url : undefined,
    cmapRating: typeof raw.cmapRating === 'string' ? raw.cmapRating : undefined,
    defaultCampaignCode: typeof raw.defaultCampaignCode === 'string' ? raw.defaultCampaignCode : undefined,
    defaultCommissionCode: typeof raw.defaultCommissionCode === 'string' ? raw.defaultCommissionCode : undefined,
    minimumCommissionCode: typeof raw.minimumCommissionCode === 'string' ? raw.minimumCommissionCode : undefined,
    commissionText: typeof raw.commissionText === 'string' ? raw.commissionText : undefined,
    commissionOptions,
    products,
  };
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch('/api/suppliers', {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`OmniLife /suppliers returned ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  const list: Record<string, unknown>[] = Array.isArray(payload) ? payload : [];
  return list
    .map(normaliseSupplier)
    .filter((s): s is Supplier => s !== null);
}
