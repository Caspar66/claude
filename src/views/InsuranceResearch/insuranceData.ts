// ── Shared types ──────────────────────────────────────────────────────────────

export type EmploymentStatus = 'E' | 'T' | 'Q' | 'O' | 'H' | 'R' | 'P' | 'U' | 'S';

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  E: 'Employee',
  T: 'Self Employed - Sole Trader',
  Q: 'Self Employed - Partnership',
  O: 'Self Employed - Business Owner',
  H: 'Home Duties',
  R: 'Retired',
  P: 'Pensioner',
  U: 'Unemployed',
  S: 'Student',
};

export type HealthDiscount = 'I' | 'E';

export const HEALTH_DISCOUNT_LABELS: Record<HealthDiscount, string> = {
  I: 'Include',
  E: 'Exclude',
};

export interface LoadingEntry {
  percentage: number;
  dollarPer1000: number;
}

export interface Loadings {
  life: LoadingEntry;
  tpd: LoadingEntry;
  trauma: LoadingEntry;
  incomeProtection: LoadingEntry;
  businessExpenses: LoadingEntry;
}

export const EMPTY_LOADINGS: Loadings = {
  life: { percentage: 0, dollarPer1000: 0 },
  tpd: { percentage: 0, dollarPer1000: 0 },
  trauma: { percentage: 0, dollarPer1000: 0 },
  incomeProtection: { percentage: 0, dollarPer1000: 0 },
  businessExpenses: { percentage: 0, dollarPer1000: 0 },
};

export function hasLoadings(l: Loadings): boolean {
  return Object.values(l).some((e) => e.percentage !== 0 || e.dollarPer1000 !== 0);
}

export interface ClientFormData {
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  smoker: 'Yes' | 'No';
  dateOfBirth: string;
  age: number;
  occupation: string;
  occupationCode: string;
  employmentStatus: EmploymentStatus;
  healthDiscount: HealthDiscount;
  annualIncome: string;
  state: string;
  loadings: Loadings;
}

export interface QuoteOptions {
  state: string;
  optionsMode: 'Flexible' | 'Fixed';
  multiSelect: 'No' | 'Yes';
  autoRefreshQuote: 'Yes' | 'No';
}

export interface LifeCoverOptions {
  enabled: boolean;
  sumInsured: string;
  structure: 'Stepped' | 'Level';
  premiumWaiver: 'Exclude' | 'Include if possible';
  ownership: 'Non-Super' | 'Super Fund';
  payByRollover: 'Exclude' | 'Include';
}

export interface TpdOptions {
  enabled: boolean;
  sumInsured: string;
  structure: 'Stepped' | 'Level';
  premiumWaiver: 'Exclude' | 'Include if possible';
  ownership: 'Non-Super' | 'Super Fund';
  lifeBuyBack: 'Exclude if possible' | 'Include if possible';
  doubleTpd: 'Exclude if possible' | 'Include if possible';
  occupationType: 'Best Available' | 'Own Occupation' | 'Any Occupation';
  payByRollover: 'Exclude' | 'Include';
}

export interface TraumaOptions {
  enabled: boolean;
}

export interface IncomeProtectionOptions {
  enabled: boolean;
  monthlyBenefit: string;
  structure: 'Stepped' | 'Level';
  ownership: 'Non-Super' | 'Super Fund';
  waitingPeriod: '14 days' | '30 days' | '60 days' | '90 days';
  benefitPeriod: '2 years' | '5 years' | 'To age 65' | 'To age 70';
  increaseClaimBenefit: 'Exclude if possible' | 'Include if possible';
  accidentBenefit: 'Exclude if possible' | 'Include if possible';
  payByRollover: 'Exclude' | 'Include';
  ipFeatures: 'Standard' | 'Enhanced';
}

export interface BusinessExpensesOptions {
  enabled: boolean;
}

export type DisplayOption =
  | 'hideLogos'
  | 'hideInsurerColumn'
  | 'hideFeatureScores'
  | 'hideCombinedScores'
  | 'hideUnmatchedProducts'
  | 'hideProductNames'
  | 'showSuperAndNonSuper';

export interface InsuranceProvider {
  id: string;
  name: string;
  shortName: string;
  product: string;
  premium: number;
  featureScore: number;
  combinedScore: number;
  selected: boolean;
  hasIcons: boolean;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const PROVIDER_LIST: InsuranceProvider[] = [
  { id: 'integrity', name: 'Integrity', shortName: 'integrity.', product: '(Life: Life Cover and Care Support Package - TPD)', premium: 36.26, featureScore: 85, combinedScore: 82, selected: false, hasIcons: false },
  { id: 'tal', name: 'TAL', shortName: 'TAL', product: '(Life: Life Insurance)', premium: 39.59, featureScore: 100, combinedScore: 100, selected: false, hasIcons: true },
  { id: 'aia', name: 'AIA', shortName: 'AIA', product: '(Life: Life Cover Plan)', premium: 39.76, featureScore: 89, combinedScore: 93, selected: false, hasIcons: true },
  { id: 'clearview', name: 'ClearView', shortName: 'ClearView', product: '(Life: Life Cover)', premium: 42.32, featureScore: 92, combinedScore: 83, selected: false, hasIcons: false },
  { id: 'zurich', name: 'Zurich', shortName: 'ZURICH', product: '(Life: Protection Plus)', premium: 43.37, featureScore: 94, combinedScore: 93, selected: false, hasIcons: true },
  { id: 'mlc', name: 'MLC', shortName: 'MLC', product: '(Life: Life Cover)', premium: 44.32, featureScore: 90, combinedScore: 80, selected: false, hasIcons: true },
  { id: 'neos', name: 'NEOS', shortName: 'NEOS', product: '(Life: Life Cover)', premium: 44.47, featureScore: 87, combinedScore: 79, selected: false, hasIcons: false },
  { id: 'onepath', name: 'OnePath', shortName: 'OnePath', product: '(Life: Life Cover)', premium: 46.35, featureScore: 90, combinedScore: 85, selected: false, hasIcons: false },
  { id: 'metlife', name: 'MetLife', shortName: 'MetLife', product: '(Life: Life Cover)', premium: 46.53, featureScore: 89, combinedScore: 78, selected: false, hasIcons: true },
  { id: 'bt', name: 'BT', shortName: 'BT', product: '(Life: Term Life - TPD)', premium: 76.52, featureScore: 95, combinedScore: 86, selected: false, hasIcons: true },
  { id: 'pps', name: 'PPS Mutual', shortName: 'pps', product: '(Life: Life Cover - TPD)', premium: 74.62, featureScore: 84, combinedScore: 84, selected: false, hasIcons: false },
  { id: 'amp-elevate', name: 'AMP Elevate (Members only)', shortName: 'AMP Life', product: '(Life: Life Insurance...)', premium: 82.05, featureScore: 82, combinedScore: 75, selected: false, hasIcons: false },
  { id: 'amp-sig', name: 'AMP Signature Super', shortName: 'AMP', product: '', premium: 0, featureScore: 0, combinedScore: 0, selected: false, hasIcons: false },
];

export const PROVIDER_LIST_SUPER: InsuranceProvider[] = [
  { id: 'integrity-s', name: 'Integrity', shortName: 'integrity.', product: '(Life: Life Cover and Care Support Package - TPD)', premium: 119.84, featureScore: 80, combinedScore: 88, selected: false, hasIcons: false },
  { id: 'tal-s', name: 'TAL', shortName: 'TAL', product: '(Super) - Ordinary...', premium: 148.41, featureScore: 79, combinedScore: 84, selected: false, hasIcons: true },
  { id: 'neos-s', name: 'NEOS', shortName: 'NEOS', product: '(Life: Life Cover (Super) - Linked TPD...)', premium: 148.83, featureScore: 80, combinedScore: 82, selected: false, hasIcons: false },
  { id: 'aia-s', name: 'AIA', shortName: 'AIA', product: '(Life: Superannuation Life Cover Plan (Al...)', premium: 151.56, featureScore: 80, combinedScore: 83, selected: false, hasIcons: true },
  { id: 'amp-elevate-s', name: 'AMP Elevate (Members only)', shortName: 'AMP Life', product: '(Life: Life Insurance...)', premium: 158.92, featureScore: 81, combinedScore: 81, selected: false, hasIcons: false },
  { id: 'metlife-s', name: 'MetLife', shortName: 'MetLife', product: '(Life: Life Cover (Super) - Ordinary T...)', premium: 166.85, featureScore: 72, combinedScore: 73, selected: false, hasIcons: true },
  { id: 'onepath-s', name: 'OnePath', shortName: 'OnePath', product: '(Life: Life Cover (Super) - Ordinary...)', premium: 166.97, featureScore: 85, combinedScore: 81, selected: false, hasIcons: false },
  { id: 'mlc-s', name: 'MLC', shortName: 'MLC', product: '(Life: Life Cover (Super) - Linked TPD, I...)', premium: 170.83, featureScore: 81, combinedScore: 77, selected: false, hasIcons: true },
  { id: 'clearview-s', name: 'ClearView', shortName: 'ClearView', product: '(Life: Life Cover (Super) - Ordinary...)', premium: 174.41, featureScore: 84, combinedScore: 78, selected: false, hasIcons: false },
];

// ── Insurance policy types (scenario detail view) ─────────────────────────────

export type PolicyStatus = 'Alternative' | 'Replace' | 'Like For Like' | 'Recommend';

export interface PolicyCoverDetail {
  type: 'Life' | 'TPD' | 'Trauma' | 'IP';
  definition?: string;
  owner: string;
  lifeInsured: string;
  benefitAmount: number;
  waitingPeriod?: string;
  benefitPeriod?: string;
}

export interface InsurancePolicy {
  id: string;
  policyName: string;
  insurer: string;
  premiumPA: number;
  frequency: 'Monthly' | 'Annual' | 'Fortnightly';
  status: PolicyStatus;
  covers: PolicyCoverDetail[];
  expanded: boolean;
}

export const SEED_POLICIES: InsurancePolicy[] = [
  {
    id: 'pol-1',
    policyName: 'Super Accelerator \u2013 Income Protection',
    insurer: 'Netwealth Super',
    premiumPA: 3365.64,
    frequency: 'Monthly',
    status: 'Alternative',
    expanded: true,
    covers: [
      { type: 'IP', definition: 'Indemnity', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 5833.00, waitingPeriod: '30 days', benefitPeriod: 'Age 65' },
    ],
  },
  {
    id: 'pol-2',
    policyName: 'Insurance policy name',
    insurer: 'AIA Australia',
    premiumPA: 3600.00,
    frequency: 'Monthly',
    status: 'Replace',
    expanded: true,
    covers: [
      { type: 'Trauma', definition: 'Linked', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 100000.00 },
    ],
  },
  {
    id: 'pol-3',
    policyName: 'Accelerated Protection - Health Sense Life & TPD & Critical Illness Premier',
    insurer: 'TAL',
    premiumPA: 12240.00,
    frequency: 'Monthly',
    status: 'Like For Like',
    expanded: true,
    covers: [
      { type: 'Trauma', definition: 'FlexiLinked', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 355000.00 },
      { type: 'TPD', definition: 'Any', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 605000.00 },
      { type: 'Life', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 605000.00 },
    ],
  },
  {
    id: 'pol-4',
    policyName: 'iQ Super \u2013 Death & TPD',
    insurer: 'Russell Investments',
    premiumPA: 968.04,
    frequency: 'Monthly',
    status: 'Recommend',
    expanded: true,
    covers: [
      { type: 'TPD', definition: 'Any', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 400000.00 },
      { type: 'Life', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 400000.00 },
    ],
  },
  {
    id: 'pol-5',
    policyName: 'Protection \u2013 Income Support Super',
    insurer: 'NEOS Life',
    premiumPA: 3428.88,
    frequency: 'Monthly',
    status: 'Alternative',
    expanded: false,
    covers: [
      { type: 'IP', definition: 'Indemnity', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 5000.00, waitingPeriod: '30 days', benefitPeriod: 'Age 65' },
    ],
  },
  {
    id: 'pol-6',
    policyName: 'Accelerated Protection \u2013 IP Enhance',
    insurer: 'TAL',
    premiumPA: 3054.84,
    frequency: 'Monthly',
    status: 'Recommend',
    expanded: false,
    covers: [
      { type: 'IP', definition: 'Agreed', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 5833.00, waitingPeriod: '30 days', benefitPeriod: 'Age 65' },
    ],
  },
  {
    id: 'pol-7',
    policyName: 'Priority Protect w/ Vitality $500 Silver Reward \u2013 Healthier Life Super & TPD (linke\u2026',
    insurer: 'AIA Australia',
    premiumPA: 8397.24,
    frequency: 'Monthly',
    status: 'Alternative',
    expanded: false,
    covers: [
      { type: 'Life', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 650000.00 },
      { type: 'TPD', definition: 'Any', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 350000.00 },
    ],
  },
  {
    id: 'pol-8',
    policyName: 'Priority Protect w/ Vitality $500 VSSR - Super Life Cover Plan - Term Level*',
    insurer: 'AIA Australia',
    premiumPA: 6000.00,
    frequency: 'Monthly',
    status: 'Like For Like',
    expanded: false,
    covers: [
      { type: 'Life', owner: 'Client Example', lifeInsured: 'Client Example', benefitAmount: 650000.00 },
    ],
  },
];

export function buildPoliciesFromSelection(
  selectedProviders: InsuranceProvider[],
  lifeCover: LifeCoverOptions,
  tpd: TpdOptions,
  incomeProtection: IncomeProtectionOptions,
  clientName: string,
): InsurancePolicy[] {
  const statuses: PolicyStatus[] = ['Recommend', 'Alternative', 'Like For Like', 'Replace'];
  return selectedProviders.map((p, i) => {
    const covers: PolicyCoverDetail[] = [];
    if (lifeCover.enabled) {
      covers.push({
        type: 'Life',
        owner: clientName,
        lifeInsured: clientName,
        benefitAmount: parseFloat(lifeCover.sumInsured.replace(/[$,]/g, '')) || 650000,
      });
    }
    if (tpd.enabled) {
      covers.push({
        type: 'TPD',
        definition: 'Any',
        owner: clientName,
        lifeInsured: clientName,
        benefitAmount: parseFloat(tpd.sumInsured.replace(/[$,]/g, '')) || 350000,
      });
    }
    if (incomeProtection.enabled) {
      covers.push({
        type: 'IP',
        definition: 'Indemnity',
        owner: clientName,
        lifeInsured: clientName,
        benefitAmount: parseFloat(incomeProtection.monthlyBenefit.replace(/[$,]/g, '')) || 4687,
        waitingPeriod: incomeProtection.waitingPeriod,
        benefitPeriod: incomeProtection.benefitPeriod,
      });
    }
    return {
      id: `pol-new-${p.id}`,
      policyName: `${p.name} ${p.product}`.trim(),
      insurer: p.name,
      premiumPA: p.premium * 12,
      frequency: 'Monthly' as const,
      status: statuses[i % statuses.length],
      covers,
      expanded: i === 0,
    };
  });
}

// ── Default helpers ───────────────────────────────────────────────────────────

export function getDefaultClientData(
  firstName: string,
  lastName: string,
  age: number,
  overrides?: Partial<ClientFormData>,
): ClientFormData {
  const birthYear = new Date().getFullYear() - age;
  return {
    firstName,
    lastName,
    gender: 'Male',
    smoker: 'No',
    dateOfBirth: `15/06/${birthYear}`,
    age,
    occupation: '',
    occupationCode: '',
    employmentStatus: 'E',
    healthDiscount: 'E',
    annualIncome: '$100,000',
    state: 'QLD',
    loadings: { ...EMPTY_LOADINGS },
    ...overrides,
  };
}

export function getDefaultQuoteOptions(): QuoteOptions {
  return { state: 'NSW', optionsMode: 'Flexible', multiSelect: 'No', autoRefreshQuote: 'Yes' };
}

export function getDefaultLifeCover(): LifeCoverOptions {
  return { enabled: true, sumInsured: '$650,000', structure: 'Stepped', premiumWaiver: 'Exclude', ownership: 'Non-Super', payByRollover: 'Exclude' };
}

export function getDefaultTpd(): TpdOptions {
  return { enabled: true, sumInsured: '$350,000', structure: 'Stepped', premiumWaiver: 'Exclude', ownership: 'Non-Super', lifeBuyBack: 'Exclude if possible', doubleTpd: 'Exclude if possible', occupationType: 'Best Available', payByRollover: 'Exclude' };
}

export function getDefaultIncomeProtection(): IncomeProtectionOptions {
  return { enabled: true, monthlyBenefit: '$4,687', structure: 'Stepped', ownership: 'Non-Super', waitingPeriod: '30 days', benefitPeriod: 'To age 65', increaseClaimBenefit: 'Exclude if possible', accidentBenefit: 'Exclude if possible', payByRollover: 'Exclude', ipFeatures: 'Standard' };
}
