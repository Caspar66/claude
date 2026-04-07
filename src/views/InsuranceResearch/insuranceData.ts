// ── Shared types ──────────────────────────────────────────────────────────────

export interface ClientFormData {
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  smoker: 'No' | 'Yes';
  dateOfBirth: string;
  age: number;
  occupation: string;
  annualIncome: string;
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

export function getDefaultClientData(firstName: string, lastName: string, age: number): ClientFormData {
  const birthYear = new Date().getFullYear() - age;
  return {
    firstName,
    lastName,
    gender: 'Male',
    smoker: 'No',
    dateOfBirth: `19/09/${birthYear}`,
    age,
    occupation: 'Accountant (qualified)',
    annualIncome: '$75,000',
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
