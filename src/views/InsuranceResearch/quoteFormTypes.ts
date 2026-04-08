// ── Quote form data model ─────────────────────────────────────────────────────

export interface LifeInsuredDetails {
  gender: 'Male' | 'Female';
  ageNextBirthday: number;
  smoker: 'Yes' | 'No';
  state: string;
  annualIncome: string;
  occupation: string;
}

export interface TermLifeOptions {
  sumInsured: string;
  premiumStructure: string;
  ownership: 'Non-Super' | 'Super';
  premiumWaiver: 'Exclude' | 'Include';
  payByRollover: string;
  lifeBuyBack: string;
  doubleTpd: string;
  occupationType: string;
  reinstatement: string;
}

export interface TpdExtensionOptions {
  sumInsured: string;
  premiumStructure: string;
  ownership: 'Non-Super' | 'Super';
  premiumWaiver: 'Exclude' | 'Include';
  payByRollover: string;
  lifeBuyBack: string;
  doubleTpd: string;
}

export interface TraumaExtensionOptions {
  sumInsured: string;
  premiumStructure: string;
  traumaFeatures: 'Basic' | 'Intermediate' | 'Comprehensive';
  premiumWaiver: 'Exclude' | 'Include';
  lifeBuyBack: string;
  doubleTrauma: string;
  babyCare: string;
  reinstatement: string;
}

export interface TpdStandaloneOptions {
  sumInsured: string;
}

export interface TraumaStandaloneOptions {
  sumInsured: string;
}

export interface ChildTraumaOptions {
  numberOfChildren: number;
}

export interface IncomeProtectionQuoteOptions {
  monthlyBenefit: string;
  owner: 'Non-Super' | 'Super';
  premiumStructure: 'Stepped' | 'Level';
  waitingPeriod: '30 days' | '60 days' | '90 days';
  benefitPeriod: '2 years' | '5 years' | 'To Age 65';
  benefitType: 'Indemnity' | 'Agreed' | 'Indemnity if possible';
  incClaimBenefit: 'Exclude if possible' | 'Include';
  accidentalBenefit: 'Exclude if possible' | 'Include';
  ipFeature: 'Standard' | 'Day 1';
  payByRollover: 'Exclude' | 'Include';
}

export interface BusinessExpensesQuoteOptions {
  sumInsured: string;
}

export interface NeedleStickOptions {
  sumInsured: string;
}

export interface PremiumLoadingOptions {
  loading: string; // percentage or 'N/A'
}

export interface ExistingPoliciesOptions {
  count: number;
}

export interface QuoteFormState {
  lifeInsured: LifeInsuredDetails;
  termLife: TermLifeOptions;
  tpdExtension: TpdExtensionOptions;
  traumaExtension: TraumaExtensionOptions;
  tpdStandalone: TpdStandaloneOptions;
  traumaStandalone: TraumaStandaloneOptions;
  childTrauma: ChildTraumaOptions;
  incomeProtection: IncomeProtectionQuoteOptions;
  businessExpenses: BusinessExpensesQuoteOptions;
  needleStick: NeedleStickOptions;
  premiumLoading: PremiumLoadingOptions;
  existingPolicies: ExistingPoliciesOptions;
}

// ── Section expanded/collapsed state ──────────────────────────────────────────

export type QuoteSectionKey =
  | 'lifeInsured'
  | 'termLife'
  | 'tpdExtension'
  | 'traumaExtension'
  | 'tpdStandalone'
  | 'traumaStandalone'
  | 'childTrauma'
  | 'incomeProtection'
  | 'businessExpenses'
  | 'needleStick'
  | 'premiumLoading'
  | 'existingPolicies';

export const SECTION_LABELS: Record<QuoteSectionKey, string> = {
  lifeInsured: 'Life Insured Details',
  termLife: 'Term Life and Extensions',
  tpdExtension: 'TPD Extension',
  traumaExtension: 'Trauma Extension',
  tpdStandalone: 'TPD - Standalone',
  traumaStandalone: 'Trauma - Standalone',
  childTrauma: 'Child Trauma',
  incomeProtection: 'Income Protection',
  businessExpenses: 'Business Expenses',
  needleStick: 'Needle Stick',
  premiumLoading: 'Premium Loading',
  existingPolicies: 'Existing Policies',
};

// ── Defaults ──────────────────────────────────────────────────────────────────

export function getDefaultQuoteForm(clientAge: number, clientGender: 'Male' | 'Female', income: string, occupation: string, state: string): QuoteFormState {
  return {
    lifeInsured: {
      gender: clientGender,
      ageNextBirthday: clientAge + 1,
      smoker: 'No',
      state,
      annualIncome: income,
      occupation: occupation || 'Generic 4: Clerical',
    },
    termLife: {
      sumInsured: '$650,000',
      premiumStructure: 'Stepped',
      ownership: 'Non-Super',
      premiumWaiver: 'Exclude',
      payByRollover: 'Exclude',
      lifeBuyBack: 'Exclude',
      doubleTpd: 'Exclude if possible',
      occupationType: 'Best available',
      reinstatement: 'Exclude if possible',
    },
    tpdExtension: {
      sumInsured: '$650,000',
      premiumStructure: 'Stepped',
      ownership: 'Non-Super',
      premiumWaiver: 'Exclude',
      payByRollover: 'Exclude',
      lifeBuyBack: 'Exclude if possible / Lowest pr.',
      doubleTpd: 'Exclude if possible',
    },
    traumaExtension: {
      sumInsured: '$200,000',
      premiumStructure: 'Stepped',
      traumaFeatures: 'Comprehensive',
      premiumWaiver: 'Exclude',
      lifeBuyBack: 'Exclude if possible / Lowest pr.',
      doubleTrauma: 'Exclude if possible',
      babyCare: 'Exclude',
      reinstatement: 'Exclude if possible',
    },
    tpdStandalone: { sumInsured: '' },
    traumaStandalone: { sumInsured: '' },
    childTrauma: { numberOfChildren: 0 },
    incomeProtection: {
      monthlyBenefit: '$10,000',
      owner: 'Non-Super',
      premiumStructure: 'Stepped',
      waitingPeriod: '90 days',
      benefitPeriod: 'To Age 65',
      benefitType: 'Agreed',
      incClaimBenefit: 'Exclude if possible',
      accidentalBenefit: 'Exclude if possible',
      ipFeature: 'Standard',
      payByRollover: 'Exclude',
    },
    businessExpenses: { sumInsured: '' },
    needleStick: { sumInsured: '' },
    premiumLoading: { loading: 'N/A' },
    existingPolicies: { count: 0 },
  };
}

// ── Summary helpers ───────────────────────────────────────────────────────────

export function getSectionSummary(key: QuoteSectionKey, form: QuoteFormState): string {
  switch (key) {
    case 'lifeInsured':
      return `${form.lifeInsured.gender}, Age ${form.lifeInsured.ageNextBirthday}, ${form.lifeInsured.smoker === 'No' ? 'Non-Smoker' : 'Smoker'}, ${form.lifeInsured.state}`;
    case 'termLife':
      return form.termLife.sumInsured ? `${form.termLife.sumInsured} · ${form.termLife.premiumStructure} · ${form.termLife.ownership}` : 'Not configured';
    case 'tpdExtension':
      return form.tpdExtension.sumInsured ? `${form.tpdExtension.sumInsured} · ${form.tpdExtension.premiumStructure}` : 'Not configured';
    case 'traumaExtension':
      return form.traumaExtension.sumInsured ? `${form.traumaExtension.sumInsured} · ${form.traumaExtension.traumaFeatures}` : 'Not configured';
    case 'tpdStandalone':
      return form.tpdStandalone.sumInsured || 'Not configured';
    case 'traumaStandalone':
      return form.traumaStandalone.sumInsured || 'Not configured';
    case 'childTrauma':
      return form.childTrauma.numberOfChildren > 0 ? `${form.childTrauma.numberOfChildren} children` : 'None';
    case 'incomeProtection':
      return form.incomeProtection.monthlyBenefit
        ? `${form.incomeProtection.monthlyBenefit}/mo · ${form.incomeProtection.waitingPeriod} wait · ${form.incomeProtection.benefitPeriod}`
        : 'Not configured';
    case 'businessExpenses':
      return form.businessExpenses.sumInsured || 'Not configured';
    case 'needleStick':
      return form.needleStick.sumInsured || 'Not configured';
    case 'premiumLoading':
      return form.premiumLoading.loading;
    case 'existingPolicies':
      return form.existingPolicies.count > 0 ? `${form.existingPolicies.count} policies` : 'None';
  }
}
