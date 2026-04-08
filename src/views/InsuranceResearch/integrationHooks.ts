/**
 * Integration hooks — placeholder interfaces for connecting the Insurance
 * Quoting & Research tool to other modules in the financial advice platform.
 *
 * These are stub implementations that return mock/default data. Replace with
 * actual API calls or context reads when the corresponding modules are built.
 */

import type { QuoteFormState } from './quoteFormTypes';
import { getDefaultQuoteForm } from './quoteFormTypes';

// ── 1. Fact Find data pull ───────────────────────────────────────────────────
// Pre-populates left-panel fields from the client's Fact Find record.

export interface FactFindData {
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  age: number;
  smoker: boolean;
  occupation: string;
  annualIncome: string;
  state: string;
  partnerFirstName?: string;
  partnerLastName?: string;
  partnerGender?: 'Male' | 'Female';
  partnerAge?: number;
}

export function pullFactFindData(clientId: string): FactFindData {
  // TODO: Replace with API call — GET /api/clients/{clientId}/fact-find
  void clientId;
  return {
    firstName: 'Example',
    lastName: 'Client',
    gender: 'Male',
    dateOfBirth: '15/06/1964',
    age: 61,
    smoker: false,
    occupation: 'Accountant (qualified)',
    annualIncome: '$120,000',
    state: 'Queensland',
    partnerFirstName: 'Example',
    partnerLastName: 'Partner',
    partnerGender: 'Female',
    partnerAge: 59,
  };
}

export function applyFactFindToQuoteForm(data: FactFindData): QuoteFormState {
  return getDefaultQuoteForm(
    data.age,
    data.gender,
    data.annualIncome,
    data.occupation,
    data.state,
  );
}

// ── 2. Needs Analysis data ───────────────────────────────────────────────────
// Insurance needs calculations feed into sum-insured defaults.

export interface NeedsAnalysisResult {
  lifeSumInsured: string;
  tpdSumInsured: string;
  traumaSumInsured: string;
  incomeProtectionMonthly: string;
  businessExpensesSumInsured: string;
  calculatedAt: string;
  notes: string;
}

export function pullNeedsAnalysis(clientId: string): NeedsAnalysisResult | null {
  // TODO: Replace with API call — GET /api/clients/{clientId}/needs-analysis
  void clientId;
  return {
    lifeSumInsured: '$650,000',
    tpdSumInsured: '$650,000',
    traumaSumInsured: '$200,000',
    incomeProtectionMonthly: '$10,000',
    businessExpensesSumInsured: '',
    calculatedAt: new Date().toISOString(),
    notes: 'Based on Fact Find income, debts, and dependants.',
  };
}

export function applyNeedsToQuoteForm(
  form: QuoteFormState,
  needs: NeedsAnalysisResult,
): QuoteFormState {
  return {
    ...form,
    termLife: { ...form.termLife, sumInsured: needs.lifeSumInsured },
    tpdExtension: { ...form.tpdExtension, sumInsured: needs.tpdSumInsured },
    traumaExtension: { ...form.traumaExtension, sumInsured: needs.traumaSumInsured },
    incomeProtection: { ...form.incomeProtection, monthlyBenefit: needs.incomeProtectionMonthly },
    businessExpenses: { ...form.businessExpenses, sumInsured: needs.businessExpensesSumInsured },
  };
}

// ── 3. Digital Advice Scenarios ──────────────────────────────────────────────
// Saved quotes available for strategy building inside Digital Advice.

export interface DigitalAdviceScenarioRef {
  scenarioId: string;
  scenarioName: string;
  quoteSetId: string;
  quoteSetName: string;
  savedAt: string;
  totalPremium: number;
  covers: string[];
}

export function pushToDigitalAdvice(
  scenarioId: string,
  scenarioName: string,
  quoteSetId: string,
  quoteSetName: string,
  totalPremium: number,
  covers: string[],
): DigitalAdviceScenarioRef {
  // TODO: Replace with API call — POST /api/digital-advice/scenarios/{scenarioId}/quotes
  const ref: DigitalAdviceScenarioRef = {
    scenarioId,
    scenarioName,
    quoteSetId,
    quoteSetName,
    savedAt: new Date().toISOString(),
    totalPremium,
    covers,
  };
  // Persist to sessionStorage so Digital Advice can pick it up
  try {
    const key = 'wealthsolver:digitalAdviceQuotes';
    const existing = JSON.parse(sessionStorage.getItem(key) || '[]') as DigitalAdviceScenarioRef[];
    existing.push(ref);
    sessionStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // silently fail
  }
  return ref;
}

export function getDigitalAdviceQuotes(): DigitalAdviceScenarioRef[] {
  try {
    return JSON.parse(sessionStorage.getItem('wealthsolver:digitalAdviceQuotes') || '[]');
  } catch {
    return [];
  }
}

// ── 4. State persistence for navigation ──────────────────────────────────────
// Restores last quote/scenario when navigating away and back.

const PERSIST_KEY = 'wealthsolver:insuranceResearchState';

export interface PersistedResearchState {
  activeScenarioId: string | null;
  viewMode: 'list' | 'detail';
  comparisonOpen: boolean;
  lastUpdated: string;
}

export function persistResearchState(state: PersistedResearchState): void {
  try {
    sessionStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch {
    // silently fail
  }
}

export function restoreResearchState(): PersistedResearchState | null {
  try {
    const raw = sessionStorage.getItem(PERSIST_KEY);
    return raw ? (JSON.parse(raw) as PersistedResearchState) : null;
  } catch {
    return null;
  }
}
