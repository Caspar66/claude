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

// ── Legacy Portfolios ────────────────────────────────────────────────────────

export interface LegacyPortfolio {
  supplierCode: string;
  supplierName: string;
  revisionDates: string[];
}

export async function fetchLegacyPortfolios(): Promise<LegacyPortfolio[]> {
  const res = await fetch('/api/legacy-portfolios', {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`OmniLife /legacy/portfolios returned ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  const list: Record<string, unknown>[] = Array.isArray(payload) ? payload : [];
  const raw = list
    .map((entry) => {
      const supplierCode =
        typeof entry.supplierCode === 'string' ? entry.supplierCode :
        typeof entry.code === 'string' ? entry.code : '';
      const supplierName =
        typeof entry.supplierName === 'string' ? entry.supplierName :
        typeof entry.name === 'string' ? entry.name : supplierCode;
      const rd = entry.revisionDates ?? entry.dates;
      const revisionDates = Array.isArray(rd)
        ? rd.filter((d): d is string => typeof d === 'string')
        : [];
      return { supplierCode, supplierName, revisionDates };
    })
    .filter((p) => p.supplierCode);

  // Dedupe by supplierName. supplierCode can be shared across multiple
  // portfolios (e.g. "MLC" -> "MLC Personal Protection Portfolio" and
  // "MLC Insurance"), so we key by name and only merge revision dates when the
  // exact same name repeats.
  const byName = new Map<string, LegacyPortfolio>();
  for (const p of raw) {
    const existing = byName.get(p.supplierName);
    if (existing) {
      const merged = new Set([...existing.revisionDates, ...p.revisionDates]);
      existing.revisionDates = Array.from(merged).sort().reverse();
    } else {
      byName.set(p.supplierName, { ...p, revisionDates: [...p.revisionDates].sort().reverse() });
    }
  }
  return Array.from(byName.values());
}

// ── Legacy Products ──────────────────────────────────────────────────────────

export interface SupportedCoverType {
  mandatory: boolean;
  optional: boolean;
  ownership: string;
  researchProductCode: string;
}

export interface LegacyProduct {
  supplierCode: string;
  productCode: string;
  productName: string;
  revisionDate: string;
  supportedCoverTypes: Partial<Record<string, SupportedCoverType>>;
  raw: Record<string, unknown>;
}

export interface FetchLegacyProductsArgs {
  supplierCode: string;
  date: string;
}

export async function fetchLegacyProducts(args: FetchLegacyProductsArgs): Promise<LegacyProduct[]> {
  const params = new URLSearchParams({
    supplierCode: args.supplierCode,
    date: args.date,
    coverNeedType: '1',
  });
  const res = await fetch(`/api/legacy-products?${params.toString()}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`OmniLife /legacy/products returned ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  const list: Record<string, unknown>[] = Array.isArray(payload) ? payload : [];
  return list
    .map((raw) => {
      const productCode =
        typeof raw.code === 'string' ? raw.code :
        typeof raw.productCode === 'string' ? raw.productCode : '';
      const productName =
        typeof raw.name === 'string' ? raw.name :
        typeof raw.productName === 'string' ? raw.productName :
        typeof raw.description === 'string' ? raw.description : '';
      const supplierCode =
        typeof raw.supplierCode === 'string' ? raw.supplierCode : args.supplierCode;
      const revisionDate =
        typeof raw.revisionDate === 'string' ? raw.revisionDate : args.date;

      const sct: Partial<Record<string, SupportedCoverType>> = {};
      if (raw.supportedCoverTypes && typeof raw.supportedCoverTypes === 'object') {
        for (const [key, val] of Object.entries(raw.supportedCoverTypes as Record<string, unknown>)) {
          if (val && typeof val === 'object') {
            const v = val as Record<string, unknown>;
            sct[key] = {
              mandatory: v.mandatory === true,
              optional: v.optional === true,
              ownership: typeof v.ownership === 'string' ? v.ownership : '',
              researchProductCode: typeof v.researchProductCode === 'string' ? v.researchProductCode : '',
            };
          }
        }
      }

      return { supplierCode, productCode, productName, revisionDate, supportedCoverTypes: sct, raw };
    })
    .filter((p) => p.productCode);
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

export interface CampaignOption {
  code: string;
  name: string;
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
  campaignOptions?: CampaignOption[];
  products: SupplierProduct[];
}

function ensureSupplierUrl(v: string): string {
  if (!v) return '';
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('//')) return v;
  return `https://${v}`;
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
    logo: typeof raw.logo === 'string' ? ensureSupplierUrl(raw.logo) : undefined,
    url: typeof raw.url === 'string' ? raw.url : undefined,
    cmapRating: typeof raw.cmapRating === 'string' ? raw.cmapRating : undefined,
    defaultCampaignCode: typeof raw.defaultCampaignCode === 'string' ? raw.defaultCampaignCode : undefined,
    defaultCommissionCode: typeof raw.defaultCommissionCode === 'string' ? raw.defaultCommissionCode : undefined,
    minimumCommissionCode: typeof raw.minimumCommissionCode === 'string' ? raw.minimumCommissionCode : undefined,
    commissionText: typeof raw.commissionText === 'string' ? raw.commissionText : undefined,
    commissionOptions,
    campaignOptions: Array.isArray(raw.campaignOptions)
      ? (raw.campaignOptions as Record<string, unknown>[])
          .map((c) => ({
            code: typeof c.code === 'string' ? c.code : '',
            name: typeof c.name === 'string' ? c.name : '',
          }))
      : undefined,
    products,
  };
}

// ── Portfolio Quote ──────────────────────────────────────────────────────────

export interface PortfolioQuoteResponse {
  raw: unknown;
}

export async function postQuotePortfolio(
  body: Record<string, unknown>,
  query?: URLSearchParams,
): Promise<PortfolioQuoteResponse> {
  const qs = query ? `?${query.toString()}` : '';
  const res = await fetch(`/api/quote-portfolio${qs}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OmniLife /quote/portfolio returned ${res.status} ${res.statusText}${text ? ': ' + text : ''}`);
  }

  const payload: unknown = await res.json().catch(() => null);
  return { raw: payload };
}

// ── Quote Validation ───────────────────────────────────────────────────────

export interface QuoteValidationResponse {
  validation: string;
  omniumPremiumTotal: number;
  supplierPremiumTotal: number;
}

export async function postQuoteValidation(
  portfolioCode: string,
  body: Record<string, unknown>,
  superFrequency: string,
  frequency: string,
): Promise<QuoteValidationResponse> {
  const params = new URLSearchParams({ superFrequency, frequency });
  const res = await fetch(`/api/quote-portfolio/${portfolioCode}/quoteValidation?${params.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OmniLife /quoteValidation returned ${res.status} ${res.statusText}${text ? ': ' + text : ''}`);
  }

  return res.json();
}

// ── Product Options (Exclusion Reasons) ─────────────────────────────────────

export async function postProductOptions(
  portfolioCode: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const params = new URLSearchParams({ portfolioCode });
  const res = await fetch(`/api/product-options?${params.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OmniLife /quote/portfolio/${portfolioCode}/productOptions returned ${res.status} ${res.statusText}${text ? ': ' + text : ''}`);
  }

  return res.json();
}

// ── Quote Portfolio Features (compare) ──────────────────────────────────────

export async function postQuotePortfolioFeatures(
  codes: string[],
  body: Record<string, unknown>,
  options?: { excludeSimilarities?: boolean },
): Promise<unknown> {
  const params = new URLSearchParams({
    codes: codes.join(','),
    coverNeedType: 'NeedType',
    scoreWeightingType: 'Balanced',
  });
  if (options?.excludeSimilarities) params.set('excludeSimilarities', 'true');
  const res = await fetch(`/api/quote-portfolio-features?${params.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OmniLife /quote/portfolio/features returned ${res.status} ${res.statusText}${text ? ': ' + text : ''}`);
  }

  return res.json();
}

// ── Portfolio Features ──────────────────────────────────────────────────────

export interface FeatureRequestEntry {
  supplierCode: string;
  revisionDate?: string;
  products: Record<string, string>;
}

export async function postPortfolioFeatures(body: FeatureRequestEntry[]): Promise<unknown> {
  const params = new URLSearchParams({
    excludeSimilarities: '0',
    score: '1',
    coverNeedType: '1',
    scoreWeightingType: '1',
  });
  const res = await fetch(`/api/portfolio-features?${params.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OmniLife /research/portfolio/features returned ${res.status} ${res.statusText}${text ? ': ' + text : ''}`);
  }

  return res.json();
}

// ── Suppliers ────────────────────────────────────────────────────────────────

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

// ── Supplier Occupation Search ────────────────────────────────────────────

export interface SupplierOccupation {
  supplierCode: string;
  id: string;
  description: string;
  classTRM: string;
  classTPDAny: string;
  classTPDOwn: string;
  classTPDADL: string;
  classTRA: string;
  classINC: string;
  classBUS: string;
}

export async function searchSupplierOccupations(
  supplierCode: string,
  searchText: string,
): Promise<SupplierOccupation[]> {
  const params = new URLSearchParams({ searchText });
  const res = await fetch(`/api/supplier-occupations/${supplierCode}/occupations?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`OmniLife /suppliers/${supplierCode}/occupations returned ${res.status}`);
  }

  const payload: unknown = await res.json();
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      supplierCode: String(item.supplierCode ?? supplierCode),
      id: String(item.id ?? ''),
      description: String(item.description ?? ''),
      classTRM: String(item.classTRM ?? ''),
      classTPDAny: String(item.classTPDAny ?? ''),
      classTPDOwn: String(item.classTPDOwn ?? ''),
      classTPDADL: String(item.classTPDADL ?? ''),
      classTRA: String(item.classTRA ?? ''),
      classINC: String(item.classINC ?? ''),
      classBUS: String(item.classBUS ?? ''),
    }));
}

// ── Gained and Lost (Replacement comparison) ───────────────────────────────

export interface GainedLostSubFeature {
  code: string;
  recommendedValue: string;
  comparedValue?: string;
}

export interface GainedLostFeature {
  code: string;
  name: string;
  coverType: string;
  needType: string;
  subFeatures: GainedLostSubFeature[];
}

export interface GainedLostResponse {
  featuresGained: GainedLostFeature[];
  featuresLost: GainedLostFeature[];
  featuresImproved: GainedLostFeature[];
  featuresDecreased: GainedLostFeature[];
}

export interface GainedLostRequest {
  compared: {
    supplierCode: string;
    revisionDate?: string;
    products: Record<string, string>;
  };
  recommended: {
    supplierCode: string;
    revisionDate?: string;
    products: Record<string, string>;
  };
}

export async function postGainedAndLost(body: GainedLostRequest): Promise<GainedLostResponse> {
  const params = new URLSearchParams({ coverNeedType: 'NeedType', includeSubFeatures: 'true' });
  const res = await fetch(`/api/gained-and-lost?${params.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OmniLife /research/portfolio/gainedAndLost returned ${res.status}${text ? ': ' + text : ''}`);
  }

  return res.json();
}

// ── Similarities & Differences ──────────────────────────────────────────────

export interface SimilaritiesAndDifferencesEntry {
  supplierCode: string;
  revisionDate?: string;
  products: Record<string, string>;
}

export interface DifferenceFeature {
  code: string;
  name: string;
  coverType: string;
  featureIncluded: string[];
  featureExcluded: string[];
  subFeatures: unknown[];
}

export interface SimilaritiesAndDifferencesResponse {
  similarities: unknown[];
  differences: DifferenceFeature[];
}

export async function postSimilaritiesAndDifferences(
  body: SimilaritiesAndDifferencesEntry[],
): Promise<SimilaritiesAndDifferencesResponse> {
  const res = await fetch('/api/similarities-and-differences', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OmniLife similaritiesAndDifferences returned ${res.status}${text ? ': ' + text : ''}`);
  }

  return res.json();
}

// ── Supplier Documents ──────────────────────────────────────────────────────

export interface SupplierDocument {
  supplier: string;
  dateIssued: string;
  description: string;
  url: string;
}

export async function fetchSupplierDocuments(
  documentType: string,
  date?: string,
): Promise<SupplierDocument[]> {
  const params = new URLSearchParams({ documentType });
  if (date) params.set('date', date);

  const res = await fetch(`/api/supplier-documents?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`OmniLife /suppliers/documents returned ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      supplier: String(item.supplierName ?? item.supplier ?? ''),
      dateIssued: String(item.dateIssued ?? item.date ?? item.revisionDate ?? ''),
      description: String(item.name ?? item.description ?? item.documentType ?? ''),
      url: String(item.url ?? item.link ?? item.pdsUrl ?? ''),
    }))
    .filter((d) => d.supplier || d.description);
}
