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
}

export interface WsFee {
  xplanId: string;
  name: string;
  isRebate: boolean;
  isCommission: boolean;
  isFlat: boolean;       // flat vs progressive
  isDollar: boolean;     // dollar vs percentage
  baseDollar: number;
  feeBasis: string;      // "Account balance" | "Investment balance" | "Fixed"
  aggregationOption: string;
  minMaxApplied: string; // "none" | "plan" | "set"
  minDollar: number;
  maxDollar: number;
  includeBaseInMinMax: boolean;
  feeSets: WsFeeSet[];
  prodCostDesc: string;
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
