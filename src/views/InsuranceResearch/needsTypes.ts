// ── OmniLife Needs Types ─────────────────────────────────────────────────────
// API-native types for the POST /quote/portfolio `clients[].needs[]` payload.
// Values use API codes exactly (e.g. "S" not "Stepped").

// ── Multi-select field value ────────────────────────────────────────────────

export type FieldValue<T extends string = string> = T | T[];

// ── Shared enumerations ────────────────────────────────────────────────────

export type Structure4 = 'S' | 'B' | 'L' | '70';
export type Structure3 = 'S' | 'B' | 'L';
export type Structure2 = 'S' | 'L';
export type OwnerTRM = 'O' | 'M' | 'S';
export type OwnerTPE = 'O' | 'M' | 'S' | 'J';
export type OwnerINC = 'O' | 'M' | 'S' | 'J' | 'K';
export type Rollover = 'I' | 'N';
export type PremiumWaiver = 'I' | 'Y' | 'N';
export type OccupationType = 'A' | 'O' | 'H' | 'D' | 'E';
export type ThreeWay = 'X' | 'Y' | 'N';
export type FourWay = 'X' | 'I' | 'Y' | 'N';
export type Priority = 'C' | 'B' | 'I';
export type LifeBuyBackTPE = 'L' | 'F' | 'N' | '0' | '1';
export type LifeBuyBackTRE = 'L' | 'F' | 'N' | '1' | '3';
export type AgreedValue = 'X' | 'N';
export type WaitingPeriodINC = '14' | '30' | '60' | '90' | '180' | '365' | '730';
export type WaitingPeriodBUS = '14' | '30' | '60' | '90';
export type BenefitPeriodINC = '1' | '2' | '5' | '55' | '60' | '65' | '67' | '70';
export type BenefitPeriodBUS = '1';
export type ReplacementRatio = 'A' | 'GT75' | '7075' | '6069' | 'LT60';
export type Gender = 'M' | 'F';

// ── Need field interfaces ──────────────────────────────────────────────────

export interface TrmFields {
  sumInsured: number;
  structure: FieldValue<Structure4>;
  owner: FieldValue<OwnerTRM>;
  rollover: FieldValue<Rollover>;
  premiumWaiver: FieldValue<PremiumWaiver>;
  linkedNeeds: LinkedNeedTRM[];
  productCodes: Record<string, string>;
}

export interface TpeFields {
  sumInsured: number;
  structure: FieldValue<Structure4>;
  owner: FieldValue<OwnerTPE>;
  rollover: FieldValue<Rollover>;
  occupationType: FieldValue<OccupationType>;
  lifeBuyBack: FieldValue<LifeBuyBackTPE>;
  doubleTPD: FieldValue<ThreeWay>;
  premiumWaiver: FieldValue<PremiumWaiver>;
}

export interface TreFields {
  sumInsured: number;
  structure: FieldValue<Structure4>;
  lifeBuyBack: FieldValue<LifeBuyBackTRE>;
  doubleTrauma: FieldValue<ThreeWay>;
  traumaReinstatement: FieldValue<ThreeWay>;
  premiumWaiver: FieldValue<PremiumWaiver>;
  babyCare: FieldValue<FourWay>;
  priority: FieldValue<Priority>;
}

export interface TpsFields {
  sumInsured: number;
  structure: FieldValue<Structure4>;
  owner: FieldValue<OwnerTPE>;
  rollover: FieldValue<Rollover>;
  occupationType: FieldValue<OccupationType>;
  premiumWaiver: FieldValue<PremiumWaiver>;
  productCodes: Record<string, string>;
}

export interface TrsFields {
  sumInsured: number;
  structure: FieldValue<Structure4>;
  traumaReinstatement: FieldValue<ThreeWay>;
  premiumWaiver: FieldValue<PremiumWaiver>;
  babyCare: FieldValue<FourWay>;
  priority: FieldValue<Priority>;
  linkedNeeds: LinkedNeedTRS[];
  productCodes: Record<string, string>;
}

export interface TprFields {
  sumInsured: number;
  structure: FieldValue<Structure4>;
  owner: FieldValue<OwnerINC>;
  rollover: FieldValue<Rollover>;
  occupationType: FieldValue<OccupationType>;
  premiumWaiver: FieldValue<PremiumWaiver>;
}

export interface IncFields {
  monthlyBenefit: number;
  superContributionOption: number;
  structure: FieldValue<Structure3>;
  owner: FieldValue<OwnerINC>;
  rollover: FieldValue<Rollover>;
  agreedValue: FieldValue<AgreedValue>;
  accidentBenefit: FieldValue<FourWay>;
  increaseClaimBenefit: FieldValue<FourWay>;
  waitingPeriod: FieldValue<WaitingPeriodINC> | '?';
  benefitPeriod: FieldValue<BenefitPeriodINC> | '?';
  initialReplacementRatio: FieldValue<ReplacementRatio>;
  priority: FieldValue<Priority>;
  productCodes: Record<string, string>;
}

export interface BusFields {
  monthlyBenefit: number;
  structure: FieldValue<Structure3>;
  waitingPeriod: FieldValue<WaitingPeriodBUS>;
  benefitPeriod: BenefitPeriodBUS;
  productCodes: Record<string, string>;
}

export interface NesFields {
  sumInsured: number;
  structure: Structure2;
  productCodes: Record<string, string>;
}

export interface ChtChild {
  sumInsured: number;
  dateOfBirth?: string;
  age?: number;
  gender: Gender;
}

export interface ChtFields {
  children: ChtChild[];
}

// ── Linked need wrappers ───────────────────────────────────────────────────

export type LinkedNeedTRM = { TPE: TpeFields } | { TRE: TreFields };
export type LinkedNeedTRS = { TPR: TprFields };

// ── Need discriminated union ───────────────────────────────────────────────

export type Need =
  | { TRM: TrmFields }
  | { TPS: TpsFields }
  | { TRS: TrsFields }
  | { INC: IncFields }
  | { BUS: BusFields }
  | { NES: NesFields }
  | { CHT: ChtFields };

export type NeedCode = 'TRM' | 'TPS' | 'TRS' | 'INC' | 'BUS' | 'NES' | 'CHT';
export type LinkedNeedCode = 'TPE' | 'TRE' | 'TPR';

// ── Need code metadata ─────────────────────────────────────────────────────

export const NEED_CODE_LABELS: Record<NeedCode, string> = {
  TRM: 'Life',
  TPS: 'TPD Standalone',
  TRS: 'Trauma Standalone',
  INC: 'Income Protection',
  BUS: 'Business Expenses',
  NES: 'Needle Stick',
  CHT: 'Child Trauma',
};

export const LINKED_NEED_LABELS: Record<LinkedNeedCode, string> = {
  TPE: 'TPD Extension to Life',
  TRE: 'Trauma Extension to Life',
  TPR: 'TPD Extension to Trauma',
};

// ── Field option labels (code → display) ───────────────────────────────────

export const STRUCTURE_4_LABELS: Record<Structure4, string> = {
  S: 'Variable age-stepped', B: 'Blended', L: 'Variable to age 65', '70': 'Variable to age 70',
};
export const STRUCTURE_3_LABELS: Record<Structure3, string> = {
  S: 'Variable age-stepped', B: 'Blended', L: 'Variable',
};
export const STRUCTURE_2_LABELS: Record<Structure2, string> = {
  S: 'Variable age-stepped', L: 'Variable',
};
export const OWNER_TRM_LABELS: Record<OwnerTRM, string> = {
  O: 'Non-Super', M: 'SMSF', S: 'Super',
};
export const OWNER_TPE_LABELS: Record<OwnerTPE, string> = {
  O: 'Non-Super', M: 'SMSF', S: 'Super', J: 'SuperLink',
};
export const OWNER_INC_LABELS: Record<OwnerINC, string> = {
  O: 'Non-Super', M: 'SMSF', S: 'Super', J: 'SuperLink', K: 'SMSF SuperLink',
};
export const ROLLOVER_LABELS: Record<Rollover, string> = {
  I: 'Include if possible', N: 'Exclude',
};
export const PREMIUM_WAIVER_LABELS: Record<PremiumWaiver, string> = {
  I: 'Include if possible', Y: 'Include', N: 'Exclude',
};
export const OCCUPATION_LABELS: Record<OccupationType, string> = {
  A: 'Any', O: 'Own', H: 'Homemaker', D: 'ADL', E: 'Best available',
};
export const THREE_WAY_LABELS: Record<ThreeWay, string> = {
  X: 'Exclude if possible', Y: 'Include', N: 'Exclude',
};
export const FOUR_WAY_LABELS: Record<FourWay, string> = {
  X: 'Exclude if possible', I: 'Include if possible', Y: 'Include', N: 'Exclude',
};
export const PRIORITY_LABELS: Record<Priority, string> = {
  C: 'Cheapest', B: 'Best', I: 'Intermediate',
};
export const LIFE_BUY_BACK_TPE_LABELS: Record<LifeBuyBackTPE, string> = {
  L: 'Lowest premium', F: 'Fastest available', N: 'None', '0': 'Immediate', '1': '1 year',
};
export const LIFE_BUY_BACK_TRE_LABELS: Record<LifeBuyBackTRE, string> = {
  L: 'Lowest premium', F: 'Fastest available', N: 'None', '1': '1 year', '3': '3 years',
};
export const AGREED_VALUE_LABELS: Record<AgreedValue, string> = {
  X: 'Indemnity if possible', N: 'Indemnity',
};
export const WAITING_INC_LABELS: Record<WaitingPeriodINC, string> = {
  '14': '14 days', '30': '30 days', '60': '60 days', '90': '90 days',
  '180': '180 days', '365': '1 year', '730': '2 years',
};
export const WAITING_BUS_LABELS: Record<WaitingPeriodBUS, string> = {
  '14': '14 days', '30': '30 days', '60': '60 days', '90': '90 days',
};
export const BENEFIT_INC_LABELS: Record<BenefitPeriodINC, string> = {
  '1': '1 year', '2': '2 years', '5': '5 years', '55': 'To age 55',
  '60': 'To age 60', '65': 'To age 65', '67': 'To age 67', '70': 'To age 70',
};
export const REPLACEMENT_RATIO_LABELS: Record<ReplacementRatio, string> = {
  A: 'Any', GT75: 'Greater than 75%', '7075': '70% to 75%',
  '6069': '60% to 69%', LT60: 'Less than 60%',
};
export const GENDER_LABELS: Record<Gender, string> = {
  M: 'Male', F: 'Female',
};

// ── Default factories ──────────────────────────────────────────────────────

export function defaultTrm(): TrmFields {
  return { sumInsured: 500000, structure: 'S', owner: 'O', rollover: 'N', premiumWaiver: 'I', linkedNeeds: [], productCodes: {} };
}
export function defaultTpe(): TpeFields {
  return { sumInsured: 0, structure: 'S', owner: 'O', rollover: 'N', occupationType: 'A', lifeBuyBack: 'L', doubleTPD: 'X', premiumWaiver: 'I' };
}
export function defaultTre(): TreFields {
  return { sumInsured: 0, structure: 'S', lifeBuyBack: 'L', doubleTrauma: 'X', traumaReinstatement: 'X', premiumWaiver: 'I', babyCare: 'I', priority: 'C' };
}
export function defaultTps(): TpsFields {
  return { sumInsured: 0, structure: 'S', owner: 'O', rollover: 'N', occupationType: 'A', premiumWaiver: 'I', productCodes: {} };
}
export function defaultTrs(): TrsFields {
  return { sumInsured: 0, structure: 'S', traumaReinstatement: 'X', premiumWaiver: 'I', babyCare: 'I', priority: 'C', linkedNeeds: [], productCodes: {} };
}
export function defaultTpr(): TprFields {
  return { sumInsured: 0, structure: 'S', owner: 'O', rollover: 'N', occupationType: 'A', premiumWaiver: 'I' };
}
export function defaultInc(): IncFields {
  return { monthlyBenefit: 0, superContributionOption: 0, structure: 'S', owner: 'O', rollover: 'N', agreedValue: 'N', accidentBenefit: 'X', increaseClaimBenefit: 'X', waitingPeriod: '30', benefitPeriod: '65', initialReplacementRatio: 'A', priority: 'C', productCodes: {} };
}
export function defaultBus(): BusFields {
  return { monthlyBenefit: 0, structure: 'S', waitingPeriod: '30', benefitPeriod: '1', productCodes: {} };
}
export function defaultNes(): NesFields {
  return { sumInsured: 0, structure: 'S', productCodes: {} };
}
export function defaultCht(): ChtFields {
  return { children: [] };
}

export function createNeed(code: NeedCode): Need {
  switch (code) {
    case 'TRM': return { TRM: defaultTrm() };
    case 'TPS': return { TPS: defaultTps() };
    case 'TRS': return { TRS: defaultTrs() };
    case 'INC': return { INC: defaultInc() };
    case 'BUS': return { BUS: defaultBus() };
    case 'NES': return { NES: defaultNes() };
    case 'CHT': return { CHT: defaultCht() };
  }
}

// ── Need helpers ───────────────────────────────────────────────────────────

export function getNeedCode(need: Need): NeedCode {
  return Object.keys(need)[0] as NeedCode;
}

export function getNeedFields(need: Need): unknown {
  return Object.values(need)[0];
}

export function hasNeedCode(needs: Need[], code: NeedCode): boolean {
  return needs.some((n) => code in n);
}

export function hasLinkedNeed(parent: TrmFields | TrsFields, code: LinkedNeedCode): boolean {
  return parent.linkedNeeds.some((ln) => code in ln);
}

export function addLinkedNeedTRM(trm: TrmFields, code: 'TPE' | 'TRE'): TrmFields {
  if (hasLinkedNeed(trm, code)) return trm;
  const ln = code === 'TPE' ? { TPE: defaultTpe() } : { TRE: defaultTre() };
  return { ...trm, linkedNeeds: [...trm.linkedNeeds, ln] };
}

export function addLinkedNeedTRS(trs: TrsFields, code: 'TPR'): TrsFields {
  if (hasLinkedNeed(trs, code)) return trs;
  return { ...trs, linkedNeeds: [...trs.linkedNeeds, { TPR: defaultTpr() }] };
}

export function removeLinkedNeed(parent: TrmFields, code: LinkedNeedCode): TrmFields;
export function removeLinkedNeed(parent: TrsFields, code: LinkedNeedCode): TrsFields;
export function removeLinkedNeed(parent: TrmFields | TrsFields, code: LinkedNeedCode): TrmFields | TrsFields {
  return { ...parent, linkedNeeds: parent.linkedNeeds.filter((ln) => !(code in ln)) } as TrmFields | TrsFields;
}

// ── Serialisation ──────────────────────────────────────────────────────────

function omitEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'number' && v === 0 && k === 'superContributionOption') continue;
    result[k] = v;
  }
  return result;
}

export function serialiseNeeds(needs: Need[]): unknown[] {
  return needs.map((need) => {
    const code = getNeedCode(need);
    const fields = { ...(getNeedFields(need) as Record<string, unknown>) };

    if (code === 'CHT') return { CHT: fields };

    const cleaned = omitEmpty(fields);

    if ('linkedNeeds' in cleaned) {
      const linked = cleaned.linkedNeeds as Record<string, unknown>[];
      cleaned.linkedNeeds = linked.map((ln) => {
        const lnCode = Object.keys(ln)[0];
        const lnFields = { ...(Object.values(ln)[0] as Record<string, unknown>) };
        return { [lnCode]: omitEmpty(lnFields) };
      });
    }

    return { [code]: cleaned };
  });
}

// ── Multi-select helpers ───────────────────────────────────────────────────

export function isMultiSelect(value: FieldValue): boolean {
  return Array.isArray(value);
}

export function fieldValueCount(value: FieldValue): number {
  if (Array.isArray(value)) return value.length;
  return 1;
}

export function toSingleValue<T extends string>(value: FieldValue<T>, fallback: T): T {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value;
}

export function toggleMultiValue<T extends string>(current: FieldValue<T>, option: T): FieldValue<T> {
  if (Array.isArray(current)) {
    const exists = current.includes(option);
    if (exists) {
      const next = current.filter((v) => v !== option);
      return next.length === 1 ? next[0] : next.length === 0 ? option : next;
    }
    return [...current, option];
  }
  return current === option ? current : [current, option];
}

// ── Quote wrapper ──────────────────────────────────────────────────────────

export type QuoteFrequency = 'Y' | 'H' | 'Q' | 'M' | 'F' | 'W';

export interface NeedsQuote {
  id: string;
  name: string;
  lifeInsured: 'client' | 'partner';
  needs: Need[];
  compareAllCombinations: boolean;
  superFrequency: QuoteFrequency;
  nonSuperFrequency: QuoteFrequency;
  requiredFeatures: Record<string, string[]>;
}

export function createNeedsQuote(name: string, lifeInsured: 'client' | 'partner' = 'client'): NeedsQuote {
  return {
    id: crypto.randomUUID(),
    name,
    lifeInsured,
    needs: [],
    compareAllCombinations: true,
    superFrequency: 'M',
    nonSuperFrequency: 'M',
    requiredFeatures: {},
  };
}
