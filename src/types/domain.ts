export type AccountType = 'Super' | 'Investment' | 'Pension' | 'SMSF';
export type EntityOwner = 'Client' | 'Partner' | 'Joint';
export type ProposalType = 'Plan Review' | 'New Plan' | 'Rollover' | 'Switch';

export interface Investment {
  id: string;
  name: string;
  apirCode: string;
  amount: number;
  allocation: Partial<Record<string, number>>;
  investCosts?: number;
  transactionCost?: number;
  buyCost?: number;
  sellCost?: number;
  perfFee?: number;
  fundType?: 'SMA' | '';
  isSMAHighlight?: boolean;
  isCustom?: boolean;
  // Detail modal fields
  broadObjectives?: string;
  pastPerformance?: {
    oneMonth?: number;
    threeMonth?: number;
    sixMonth?: number;
    oneYear?: number;
    twoYear?: number;
    threeYear?: number;
    fiveYear?: number;
    sevenYear?: number;
    effectiveDate?: string;
  };
  isCashAccount?: boolean;
  isEthical?: boolean;
  feeArrangements?: Array<{ label: string; value: string }>;
  investmentRebate?: number;
}

export interface Platform {
  id: string;
  name: string;
  accountNumber: string;
  type: AccountType;
  balance: number;
  taxFreeBalance?: number;
  otherBalancesClient?: number;
  otherBalancesFamily?: number;
  hasWarning?: boolean;
  warningMessage?: string;
  investments: Investment[];
}

export interface Entity {
  id: string;
  owner: EntityOwner;
  platforms: Platform[];
  ownershipSplit?: { client: number; partner: number };
}

export interface PersonDetails {
  name: string;
  age: number;
  retirementDate: string;
  ordinaryWages: number;
}

export interface AdviserTimestamp {
  date: string;
  adviser: string;
}

export interface ProposalRow {
  id: string;
  owner: EntityOwner;
  proposalType: ProposalType;
  fromPlatform: Platform;
  toPlatform: Platform;
  balance: number;
}

export interface Proposal {
  id: string;
  label: string;
  rows: ProposalRow[];
}

export interface Scenario {
  id: string;
  name: string;
  created: AdviserTimestamp;
  lastChanged: AdviserTimestamp;
  implemented?: AdviserTimestamp;
  locked?: AdviserTimestamp;
  isLocked: boolean;
  entities: Entity[];
  proposals: Proposal[];
}

export interface ClientFile {
  client: PersonDetails;
  partner: PersonDetails;
  scenarios: Scenario[];
}
