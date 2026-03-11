// ── Asset Allocation ──────────────────────────────────────────────────────────

export interface WsAssetAllocation {
  domEq: number;       // Domestic Equity
  intlEq: number;      // International Equity
  domProp: number;     // Domestic Property
  intlProp: number;    // International Property
  domFI: number;       // Domestic Fixed Interest
  intlFI: number;      // International Fixed Interest
  domCash: number;     // Domestic Cash
  intlCash: number;    // International Cash
  dirProp: number;     // Direct Property
  alt: number;         // Alternative
  other: number;       // Other
}

export function allocGrowth(a: WsAssetAllocation) {
  return a.domEq + a.intlEq + a.domProp + a.intlProp;
}
export function allocDefensive(a: WsAssetAllocation) {
  return a.domFI + a.intlFI + a.domCash + a.intlCash + a.dirProp;
}
export function allocOther(a: WsAssetAllocation) {
  return a.alt + a.other;
}
export function allocTotal(a: WsAssetAllocation) {
  return allocGrowth(a) + allocDefensive(a) + allocOther(a);
}

// ── Investment Option ─────────────────────────────────────────────────────────

export interface WsInvestmentOption {
  id: string;
  name: string;
  apir: string;
  type: string;             // "Ethical" | ""
  assetAllocation: string;  // primary asset class label
  investFees: number;       // percentage
  perfFees: number | null;
  transCost: number | null;
  buyCost: number | null;
  sellCost: number | null;
  custom: boolean;
  broadObjectives: string;
  alloc: WsAssetAllocation;
  cashAccount: boolean;
  ethical: boolean;
  sma: boolean;
  restricted: boolean;
  redemptionFreq: string;
  netAssets: number;
  incomeDistributions: string;
  managerBackground: string;
  investmentRebate?: number | null;
}

// ── Fees ─────────────────────────────────────────────────────────────────────

export interface WsFeeTier {
  feePercent: number;
  feeDollar: number;
  tierLimit: number;   // 99999999999 = "Remaining" (last tier)
}

export interface WsFeeSet {
  shortId: string;
  name: string;
  minDollar: number;
  maxDollar: number;
  isDefault: boolean;
  tiers: WsFeeTier[];
  shareExchanges?: { code: string }[];
  investmentOptionIds?: string[];   // investment option IDs assigned to this set
  numTiers: string;                 // 'Flat rate' | '2 Tiers' | ... | '10 Tiers'
}

export interface WsFee {
  xplanId: string;
  name: string;
  isRebate: boolean;
  isCommission: boolean;
  isFlat: boolean;               // flat vs progressive (Tier type)
  isDollar: boolean;             // dollar vs percentage (Percent or dollar fee)
  baseDollar: number;
  feeBasis: string;              // "Account balance" | "Investment balance" | "Fixed"
  aggregationOption: string;     // one of AGGREGATION_OPTION values
  minMaxApplied: string;         // 'Plan' | 'No min/max'
  minDollar: number;             // plan-level fee minimum
  maxDollar: number;             // plan-level fee maximum
  minAggregated: number;         // aggregated fee minimum (for balance aggregation types)
  maxAggregated: number;         // aggregated fee maximum (for balance aggregation types)
  includeBaseInMinMax: boolean;
  basePerAccount: boolean;       // Base fee applies per account (only for balance aggregation)
  defaultSetId: string;          // shortId of the default set for investment options
  researchDescription: string;   // user-editable research description (blank = auto-generate)
  feeSets: WsFeeSet[];
  prodCostDesc: string;          // legacy display description
  overrideFee?: WsFee;           // derived plan override (undefined = no override)
}

// ── Document ─────────────────────────────────────────────────────────────────

export interface WsDocument {
  id: number;
  name: string;
  type: string;
  size: number | null;
}

export const DOCUMENT_TYPES = [
  'PDS', 'Investment', 'Additional', 'Insurance', 'FSG',
  'Other', 'Fees', 'SMA', 'Annual Report', 'TMD',
] as const;

// ── Plan ─────────────────────────────────────────────────────────────────────

export type WsPlanType = 'Investment Platform' | 'Pension' | 'Super';

export interface WsPlan {
  id: string;
  name: string;
  sortName: string;
  manager: string;
  type: WsPlanType;
  subtype: string;
  rating: number;          // 0–5
  openForBusiness: boolean;
  abn: string;
  productSpin?: string;
  usi?: string;
  iressSpin?: string;
  tmdStatus?: string;
  createdBy?: string;
  comments?: string;
  description: string;
  contributions: {
    employerSG: boolean;
    employerVoluntary: boolean;
    memberVoluntary: boolean;
    memberSalary: boolean;
    spouse: boolean;
    governmentCoContribution: boolean;
    rollover: boolean;
    downsizer: boolean;
  };
  payments: {
    bpay: boolean;
    directDebit: boolean;
    cheque: boolean;
    eft: boolean;
    creditCard: boolean;
    eftpos: boolean;
  };
  investmentRules: {
    minInitial: number;
    minOneOff: number;
    minRegularContrib: number;
    minOneOffWithdrawal: number;
    minRegularWithdrawal: number;
    minBalance: number;
  };
  investmentOptions: WsInvestmentOption[];
  fees: {
    ongoing: WsFee[];
    rebates: WsFee[];
    transactional: WsFee[];
    commissions: WsFee[];
  };
  documents: WsDocument[];
  changedFields?: string[];
  derivedFromId?: string;  // set when this plan was derived from another plan
}

// ── State for WealthSolver ───────────────────────────────────────────────────

export interface WealthSolverState {
  plans: WsPlan[];
  globalOptions: WsInvestmentOption[];
}

// ── Fee constants ─────────────────────────────────────────────────────────────

export const AGGREGATION_OPTIONS = [
  { value: 'investment_allocation', label: 'Investment Allocation' },
  { value: 'set', label: 'Total allocation for set' },
  { value: 'plan_balance', label: 'Plan balance' },
  { value: 'member_balance', label: 'Balance of members accounts' },
  { value: 'family_balance', label: 'Balance of family accounts' },
  { value: 'member_family_balance', label: 'Balance of member and family accounts' },
  { value: 'member_family_excl_invest', label: 'Balance of member and family accounts excluding investments' },
  { value: 'member_family_super', label: 'Balance of member and family super/pension/investment accounts' },
  { value: 'member_excl_balance', label: 'Balance of member accounts less excluded balances' },
  { value: 'employer_plan', label: 'Total assets of employer plan' },
] as const;

// Aggregation options that require showing aggregated min/max and "base per account" fields
export const BALANCE_AGGREGATION_TYPES = [
  'member_balance', 'family_balance', 'member_family_balance',
  'member_family_excl_invest', 'member_family_super', 'member_excl_balance',
];

export const TIER_COUNT_OPTIONS = [
  'Flat rate', '2 Tiers', '3 Tiers', '4 Tiers', '5 Tiers',
  '6 Tiers', '7 Tiers', '8 Tiers', '9 Tiers', '10 Tiers',
] as const;

export const SHARE_EXCHANGES = [
  { code: 'ASX', name: 'ASX - Australian Stock Exchange' },
  { code: 'AXW', name: 'AXW - ASX Warrants' },
  { code: 'FND', name: 'FND - Australian/New Zealand Managed Funds' },
  { code: 'CASH', name: 'CASH - CASH' },
  { code: 'TD', name: 'TD - Term Deposits' },
] as const;

// Convert tier count option to number of tiers
export function numTiersFromOption(opt: string): number {
  if (opt === 'Flat rate') return 1;
  return parseInt(opt);
}

// Get tier count option from number of tiers
export function tierOptionFromCount(count: number): string {
  if (count <= 1) return 'Flat rate';
  return `${count} Tiers`;
}

// Auto-generate a fee description from fee structure
export function generateFeeDescription(fee: WsFee): string {
  if (fee.researchDescription) return fee.researchDescription;

  const fmtVal = (tier: WsFeeTier) =>
    fee.isDollar
      ? `$${tier.feeDollar.toFixed(2)}`
      : `${tier.feePercent.toFixed(4).replace(/\.?0+$/, '')}%`;

  const fmtAmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);

  // Simple case: single set, single flat-rate tier — just show the value
  if (fee.feeSets.length === 1 && fee.feeSets[0].tiers.length === 1) {
    const tier = fee.feeSets[0].tiers[0];
    let desc = fmtVal(tier);
    if (fee.minMaxApplied === 'Plan' && fee.minDollar > 0) {
      desc += `\nMinimum $${fee.minDollar.toFixed(2)}`;
    }
    return desc;
  }

  // Multi-set or progressive: show structured description
  const aggrOpt = AGGREGATION_OPTIONS.find((o) => o.value === fee.aggregationOption);
  const aggrLabel = aggrOpt?.label ?? fee.aggregationOption;
  const lines: string[] = [`Fee calculated on ${aggrLabel}`];

  for (const set of fee.feeSets) {
    lines.push('');
    lines.push(`${set.name}${set.isDefault ? ' (Default)' : ''}:`);
    for (let i = 0; i < set.tiers.length; i++) {
      const tier = set.tiers[i];
      const isLast = i === set.tiers.length - 1;
      const val = fmtVal(tier);
      if (isLast) {
        lines.push(`${val} for the remaining balance`);
      } else {
        const prefix = i === 0 ? 'for the first' : 'for the next';
        lines.push(`${val} ${prefix} ${fmtAmt(tier.tierLimit)}`);
      }
    }
  }

  if (fee.minMaxApplied === 'Plan' && fee.minDollar > 0) {
    lines.push('');
    lines.push(`Minimum $${fee.minDollar.toFixed(2)}`);
  }

  return lines.join('\n');
}
