// ── OmniLife /quote/portfolio request builder ──────────────────────────────
// Maps ClientFormData + NeedsQuote[] + ExistingPolicy[] into the API payload.

import type { ClientFormData, ExistingPolicy, Loadings, ResearchPortfolio } from './insuranceData';
import type { NeedsQuote } from './needsTypes';
import { serialiseNeeds } from './needsTypes';
import type { OccupationOption } from '@/services/omnilifeApi';
import { stripNeedPrefix } from './requiredFeaturesData';

const LOADING_KEY_MAP: Record<keyof Loadings, string> = {
  life: 'TRM',
  tpd: 'TPD',
  trauma: 'TRA',
  incomeProtection: 'INC',
  businessExpenses: 'BNC',
};

function buildLoadings(loadings: Loadings): Record<string, unknown> {
  const percentage: Record<string, string> = {};
  const dollarsPerThousand: Record<string, string> = {};

  for (const [key, apiCode] of Object.entries(LOADING_KEY_MAP)) {
    const entry = loadings[key as keyof Loadings];
    if (entry.percentage !== 0) {
      percentage[apiCode] = String(entry.percentage);
    }
    if (entry.dollarPer1000 !== 0) {
      dollarsPerThousand[apiCode] = String(entry.dollarPer1000);
    }
  }

  return { percentage, dollarsPerThousand, supplierOverrides: {} };
}

function buildRequiredFeatures(rf: Record<string, string[]> | undefined): Record<string, string[]> {
  if (!rf) return {};
  const result: Record<string, string[]> = {};
  for (const [needCode, values] of Object.entries(rf)) {
    result[needCode] = values.map((v) => stripNeedPrefix(needCode, v));
  }
  return result;
}

export interface PortfolioAdviser {
  id: string;
  email: string;
  crm: string | null;
  firstName: string;
  lastName: string;
}

export interface PortfolioTags {
  userId: string;
  groupId: string;
}

export interface BuildPortfolioArgs {
  clientData: ClientFormData;
  partnerData: ClientFormData | null;
  quotes: NeedsQuote[];
  policies: ExistingPolicy[];
  occupations: OccupationOption[];
  adviser?: PortfolioAdviser;
  tags?: PortfolioTags;
}

const DEFAULT_ADVISER: PortfolioAdviser = {
  id: '2314a147-afbb-4c0a-8e3d-0ba3b5ca4193',
  email: 'caspar.jacobs@finuragroup.com',
  crm: null,
  firstName: 'Caspar',
  lastName: 'Jacobs',
};

const DEFAULT_TAGS: PortfolioTags = {
  userId: '2314a147-afbb-4c0a-8e3d-0ba3b5ca4193',
  groupId: 'TEST_OMNILIFE',
};

function parseIncome(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseDobToISO(dob: string): string {
  if (!dob) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return dob;
  const parts = dob.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts.map((p) => p.trim());
  const dd = d.padStart(2, '0');
  const mm = m.padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function calcAgeFromDob(iso: string): number {
  if (!iso) return 0;
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function occupationIdFromLabel(label: string, occupations: OccupationOption[]): string {
  const match = occupations.find((o) => o.label === label);
  return match?.code ?? '';
}

function buildClientForQuote(
  quote: NeedsQuote,
  data: ClientFormData,
  policies: ExistingPolicy[],
  occupations: OccupationOption[],
): Record<string, unknown> {
  const dobIso = parseDobToISO(data.dateOfBirth);
  const age = dobIso ? calcAgeFromDob(dobIso) : data.age;

  const researchPortfolios = policies
    .filter((p) => p.lifeInsured === quote.lifeInsured && p.researchPortfolio != null)
    .map((p) => p.researchPortfolio as ResearchPortfolio);

  return {
    firstName: data.firstName,
    lastName: data.lastName,
    title: '',
    age,
    dateOfBirth: dobIso,
    income: parseIncome(data.annualIncome),
    gender: data.gender === 'Male' ? 'M' : 'F',
    smoker: data.smoker === 'Yes',
    employmentStatus: data.employmentStatus,
    state: data.state,
    healthDiscount: data.healthDiscount === 'E' ? 'X' : 'I',
    occupationId: occupationIdFromLabel(data.occupationCode, occupations),
    loadings: buildLoadings(data.loadings),
    requiredFeatures: buildRequiredFeatures(quote.requiredFeatures),
    customOccupations: {},
    clientId: `${crypto.randomUUID()}_${quote.name}`,
    researchPortfolios,
    needs: serialiseNeeds(quote.needs),
  };
}

export function buildPortfolioRequest(args: BuildPortfolioArgs): Record<string, unknown> {
  const { clientData, partnerData, quotes, policies, occupations, adviser, tags } = args;
  const clients: Record<string, unknown>[] = [];

  for (const quote of quotes) {
    const data = quote.lifeInsured === 'partner' && partnerData ? partnerData : clientData;
    clients.push(buildClientForQuote(quote, data, policies, occupations));
  }

  return {
    clients,
    settings: {
      commissionOptions: {},
      campaignOptions: { AMG: [''] },
      frequency: 'M',
      superFrequency: 'M',
      priceWeighting: 0,
      includedSuppliers: [],
      excludedProducts: [],
      scoreWeightingFeatureType: 'Balanced',
      scoreModeType: 'AllScores',
      priceWeightingNeedOverride: null,
      indexationRate: 0,
      useQuoteDefaultAPL: false,
      projectionYears: '15',
    },
    adviser: adviser ?? DEFAULT_ADVISER,
    tags: tags ?? DEFAULT_TAGS,
  };
}

export const PORTFOLIO_QUERY_PARAMS = new URLSearchParams({
  premiumBreakdown: 'covertype',
  premiumComponents: 'commission',
  includeTopFeatures: '5',
  includeBottomFeatures: '5',
  compareAllCombinations: 'true',
  scoreWeightingType: 'Balanced',
});
