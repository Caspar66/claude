// ── Quote results types — mapped from OmniLife /quote/portfolio response ─────

import type { PremiumFrequency } from './insuranceData';

// ── Frequency-keyed premium maps ────────────────────────────────────────────

export type FreqPremiumMap = Partial<Record<PremiumFrequency, number>>;

// ── Annualisation multipliers ───────────────────────────────────────────────

export const FREQ_ANNUAL_MULTIPLIER: Record<PremiumFrequency, number> = {
  Y: 1, H: 2, Q: 4, M: 12, F: 26, W: 52,
};

// ── Projection entry (one per year) ────────────────────────────────────────

export interface ProjectionEntry {
  premiumInsideSuper: FreqPremiumMap;
  stampDutyInsideSuper: FreqPremiumMap;
  premiumOutsideSuper: FreqPremiumMap;
  stampDutyOutsideSuper: FreqPremiumMap;
}

// ── Included portfolio (allNeedsMet: true) ──────────────────────────────────

export interface QuoteResultRow {
  id: string;
  quoteIndex: number;
  supplierName: string;
  supplierLogo?: string;
  supplierCode: string;
  portfolioCode: string;
  portfolioName: string;
  products: string;
  productCodes: Record<string, string>;
  revisionDate?: string;
  premiumInsideSuper: FreqPremiumMap;
  stampDutyInsideSuper: FreqPremiumMap;
  premiumOutsideSuper: FreqPremiumMap;
  stampDutyOutsideSuper: FreqPremiumMap;
  projections: ProjectionEntry[];
  featureScore: number;
  valueScore: number;
  selected: boolean;
  existingCover: boolean;
  recommendation: 'rec' | 'alt' | null;
}

// ── Premium computation helpers ─────────────────────────────────────────────

export function computePremiumTotal(
  row: QuoteResultRow,
  superFreq: PremiumFrequency,
  nonSuperFreq: PremiumFrequency,
): number {
  const superPrem = (row.premiumInsideSuper[superFreq] ?? 0) + (row.stampDutyInsideSuper[superFreq] ?? 0);
  const nonSuperPrem = (row.premiumOutsideSuper[nonSuperFreq] ?? 0) + (row.stampDutyOutsideSuper[nonSuperFreq] ?? 0);

  if (superFreq === nonSuperFreq) {
    return superPrem + nonSuperPrem;
  }
  return superPrem * FREQ_ANNUAL_MULTIPLIER[superFreq]
       + nonSuperPrem * FREQ_ANNUAL_MULTIPLIER[nonSuperFreq];
}

export function computeCumulativePremium(
  row: QuoteResultRow,
  superFreq: PremiumFrequency,
  nonSuperFreq: PremiumFrequency,
): number {
  let total = 0;
  for (const proj of row.projections) {
    const superPart = (proj.premiumInsideSuper[superFreq] ?? 0) + (proj.stampDutyInsideSuper[superFreq] ?? 0);
    const nonSuperPart = (proj.premiumOutsideSuper[nonSuperFreq] ?? 0) + (proj.stampDutyOutsideSuper[nonSuperFreq] ?? 0);
    total += superPart * FREQ_ANNUAL_MULTIPLIER[superFreq]
           + nonSuperPart * FREQ_ANNUAL_MULTIPLIER[nonSuperFreq];
  }
  return total;
}

// ── Excluded portfolio (allNeedsMet: false) ─────────────────────────────────

export interface ExcludedProduct {
  id: string;
  quoteIndex: number;
  supplierName: string;
  supplierLogo?: string;
  supplierCode: string;
  portfolioCode: string;
  portfolioName: string;
  errors: string[];
  pdsLink?: string;
  tmdLink?: string;
}

// ── Aggregate results ───────────────────────────────────────────────────────

export interface QuoteResults {
  rows: QuoteResultRow[];
  excluded: ExcludedProduct[];
  populated: boolean;
}

// ── API response parser ─────────────────────────────────────────────────────

function asNum(v: unknown): number {
  return typeof v === 'number' ? v : 0;
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asFreqMap(v: unknown): FreqPremiumMap {
  if (!v || typeof v !== 'object') return {};
  const out: FreqPremiumMap = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (['Y', 'H', 'Q', 'M', 'F', 'W'].includes(k) && typeof val === 'number') {
      out[k as PremiumFrequency] = val;
    }
  }
  return out;
}

function ensureUrl(v: string): string {
  if (!v) return '';
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('//')) return v;
  return `https://${v}`;
}

function parseProjections(raw: unknown): ProjectionEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: ProjectionEntry[] = [];
  for (const proj of raw) {
    if (!proj || typeof proj !== 'object') continue;
    const p = proj as Record<string, unknown>;
    entries.push({
      premiumInsideSuper: asFreqMap(p.premiumInsideSuper),
      stampDutyInsideSuper: asFreqMap(p.stampDutyInsideSuper),
      premiumOutsideSuper: asFreqMap(p.premiumOutsideSuper),
      stampDutyOutsideSuper: asFreqMap(p.stampDutyOutsideSuper),
    });
  }
  return entries;
}

function parsePortfolio(
  p: Record<string, unknown>,
  globalIdx: number,
  quoteIndex: number,
): QuoteResultRow | ExcludedProduct {
  const supplier = (p.supplier ?? {}) as Record<string, unknown>;
  const supplierName = asStr(supplier.name);
  const supplierCode = asStr(supplier.code) || asStr(supplier.supplierCode);
  const rawLogo = asStr(supplier.logo);
  const supplierLogo = rawLogo ? ensureUrl(rawLogo) : undefined;
  const portfolioName = asStr(p.name);
  const portfolioCode = asStr(p.code) || asStr(p.portfolioCode);
  const allNeedsMet = p.allNeedsMet === true;
  const isExistingCover = p.existingCover === true && asStr(p.portfolioType) === 'Research';
  const revisionDate = (asStr(p.revisionDate) || asStr(p.RevisionDate)).split('T')[0] || undefined;

  if (!allNeedsMet && !isExistingCover) {
    const links = (p.links ?? {}) as Record<string, unknown>;
    const errors = Array.isArray(p.errors)
      ? (p.errors as unknown[]).map((e) => (typeof e === 'string' ? e : asStr((e as Record<string, unknown>)?.message ?? e)))
      : [];
    return {
      id: `ex-${crypto.randomUUID()}`,
      quoteIndex,
      supplierName,
      supplierLogo,
      supplierCode,
      portfolioCode,
      portfolioName,
      errors,
      pdsLink: ensureUrl(asStr(links.pds)) || undefined,
      tmdLink: ensureUrl(asStr(links.tmd)) || undefined,
    };
  }

  const productCodes: Record<string, string> = {};
  const products = Array.isArray(p.products)
    ? (p.products as Record<string, unknown>[]).map((pr) => {
        const code = asStr(pr.code) || asStr(pr.productCode) || asStr(pr.researchProductCode);
        if (code) {
          const coveredNeeds = pr.coveredNeeds;
          if (Array.isArray(coveredNeeds)) {
            for (const need of coveredNeeds) {
              const needCode = typeof need === 'string' ? need : asStr(need);
              if (needCode) productCodes[needCode] = code;
            }
          } else {
            const type = asStr(pr.coverNeedCode) || asStr(pr.type) || asStr(pr.coverType);
            if (type) productCodes[type] = code;
          }
        }
        return asStr(pr.name) || asStr(pr.pdsName);
      }).filter(Boolean).join(', ')
    : '';

  const pt = (p.premiumTotal ?? {}) as Record<string, unknown>;
  const premiumInsideSuper = asFreqMap(pt.premiumInsideSuper);
  const stampDutyInsideSuper = asFreqMap(pt.stampDutyInsideSuper);
  const premiumOutsideSuper = asFreqMap(pt.premiumOutsideSuper);
  const stampDutyOutsideSuper = asFreqMap(pt.stampDutyOutsideSuper);

  const projections = parseProjections(p.premiumTotalProjections);

  const score = (p.score ?? {}) as Record<string, unknown>;
  const featureObj = (score.feature ?? {}) as Record<string, unknown>;
  const combinedObj = (score.combined ?? {}) as Record<string, unknown>;

  return {
    id: `qr-${crypto.randomUUID()}`,
    quoteIndex,
    supplierName,
    supplierLogo,
    supplierCode,
    portfolioCode,
    portfolioName,
    products,
    productCodes,
    revisionDate,
    premiumInsideSuper,
    stampDutyInsideSuper,
    premiumOutsideSuper,
    stampDutyOutsideSuper,
    projections,
    featureScore: asNum(featureObj.raw),
    valueScore: asNum(combinedObj.raw),
    selected: false,
    existingCover: isExistingCover,
    recommendation: null,
  };
}

interface ClientGroup {
  portfolios: Record<string, unknown>[];
}

function extractClientGroups(raw: unknown): ClientGroup[] {
  if (!raw || typeof raw !== 'object') return [];

  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const first = raw[0] as Record<string, unknown> | null;
    if (!first || typeof first !== 'object') return [];

    // Array of portfolio objects directly (single client)
    if ('supplier' in first || 'allNeedsMet' in first) {
      return [{ portfolios: raw as Record<string, unknown>[] }];
    }

    // Array of client results, each with portfolios
    return raw
      .filter((item): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && 'portfolios' in (item as Record<string, unknown>))
      .map((item) => ({
        portfolios: Array.isArray(item.portfolios) ? (item.portfolios as Record<string, unknown>[]) : [],
      }));
  }

  const obj = raw as Record<string, unknown>;

  // { portfolios: [...] }
  if (Array.isArray(obj.portfolios)) {
    return [{ portfolios: obj.portfolios as Record<string, unknown>[] }];
  }

  // { clients: [...] } or { results: [...] } or { data: [...] }
  const nested = (obj.clients ?? obj.results ?? obj.data) as unknown;
  if (Array.isArray(nested)) {
    return nested
      .filter((item): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && 'portfolios' in (item as Record<string, unknown>))
      .map((item) => ({
        portfolios: Array.isArray(item.portfolios) ? (item.portfolios as Record<string, unknown>[]) : [],
      }));
  }

  return [];
}

export function parsePortfolioResponse(raw: unknown): QuoteResults {
  const clientGroups = extractClientGroups(raw);

  const rows: QuoteResultRow[] = [];
  const excluded: ExcludedProduct[] = [];
  let globalIdx = 0;

  clientGroups.forEach((group, quoteIndex) => {
    for (const p of group.portfolios) {
      const result = parsePortfolio(p, globalIdx++, quoteIndex);
      if ('products' in result) rows.push(result);
      else excluded.push(result);
    }
  });

  return { rows, excluded, populated: rows.length > 0 || excluded.length > 0 };
}

export function getEmptyQuoteResults(): QuoteResults {
  return { rows: [], excluded: [], populated: false };
}

// ── Product Options (Exclusion Reasons) parser ─────────────────────────────

export interface SupportedNeed {
  needCode: string;
  mandatory: boolean;
  optional: boolean;
  selected: boolean;
  excluded: boolean;
  ownership: string;
  errorMessage: string;
  researchProductCode: string;
}

export interface ProductOption {
  code: string;
  name: string;
  supportedNeeds: SupportedNeed[];
}

const NEED_LABELS: Record<string, string> = {
  TRM: 'Life',
  TPE: 'TPD Extension to Life',
  TRE: 'Trauma Extension to Life',
  TPS: 'TPD Standalone',
  TRS: 'Trauma Standalone',
  TPR: 'TPD Extension to Trauma',
  INC: 'Income Protection',
  BUS: 'Business Expenses',
  NES: 'Needle Stick',
  CHT: 'Child Trauma',
  FEE: 'Fee',
};

export function getNeedLabel(code: string): string {
  return NEED_LABELS[code] ?? code;
}

export function parseProductOptionsResponse(raw: unknown): ProductOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const supportedNeeds: SupportedNeed[] = [];
      const needs = item.supportedNeeds as Record<string, unknown> | undefined;
      if (needs && typeof needs === 'object') {
        for (const [code, val] of Object.entries(needs)) {
          if (!val || typeof val !== 'object') continue;
          const n = val as Record<string, unknown>;
          supportedNeeds.push({
            needCode: code,
            mandatory: n.mandatory === true,
            optional: n.optional === true,
            selected: n.selected === true,
            excluded: n.excluded === true,
            ownership: asStr(n.ownership),
            errorMessage: asStr(n.errorMessage),
            researchProductCode: asStr(n.researchProductCode),
          });
        }
      }
      return {
        code: asStr(item.code),
        name: asStr(item.name),
        supportedNeeds,
      };
    });
}
