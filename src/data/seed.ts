import type { ClientFile, Platform, Entity, Proposal, Scenario, Investment } from '@/types/domain';

// ── Investment Catalogue (for Add Investment search) ──────────────────────────

export const investmentCatalogue: Omit<Investment, 'id' | 'amount'>[] = [
  { name: '4 Dimensions Global Infrastructure Fund', apirCode: 'BFL0019AU', allocation: {}, fundType: '', investCosts: 1.00, transactionCost: 0.00, buyCost: 0.20, sellCost: 0.20, perfFee: 0.08 },
  { name: '4D Global Infrastructure Fund (AUD Hedged)', apirCode: 'BFL3306AU', allocation: {}, fundType: '', investCosts: 1.00, transactionCost: 0.05, buyCost: 0.20, sellCost: 0.20, perfFee: 0.08 },
  { name: 'AAL001 - Altair Concentrated Portfolio', apirCode: 'FC52336AU', allocation: {}, fundType: 'SMA', isSMAHighlight: true, investCosts: 0.88, transactionCost: 0.00, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00 },
  { name: 'AAL002 - Altair Income Portfolio', apirCode: 'FC52337AU', allocation: {}, fundType: 'SMA', isSMAHighlight: false, investCosts: 1.10, transactionCost: 0.00, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00 },
  { name: 'AAP001 - Ausbil Australian Active Equity', apirCode: 'FC56212AU', allocation: {}, fundType: 'SMA', isSMAHighlight: false, investCosts: 0.8298, transactionCost: 0.0604, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00 },
  { name: 'AAP002 - Ausbil Australian Emerging Leaders', apirCode: 'FC56213AU', allocation: {}, fundType: 'SMA', isSMAHighlight: true, investCosts: 0.8112, transactionCost: 0.2207, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00 },
  { name: 'AB Global Strategic Core Equities Fund', apirCode: 'ACM3679AU', allocation: {}, fundType: '', investCosts: 0.70, transactionCost: 0.20, buyCost: 0.20, sellCost: 0.20, perfFee: 0.00 },
  { name: 'AB Managed Volatility Equities Fund - MVE Class', apirCode: 'ACM0006AU', allocation: {}, fundType: '', investCosts: 0.55, transactionCost: 0.00, buyCost: 0.25, sellCost: 0.25, perfFee: 0.00 },
  { name: 'AB Sustainable Global Thematic Equities Fund', apirCode: 'ACM8902AU', allocation: {}, fundType: '', investCosts: 1.05, transactionCost: 0.00, buyCost: 0.20, sellCost: 0.20, perfFee: 0.00 },
  { name: 'ABA001 - AB Concentrated US Growth Equities', apirCode: 'FC55713AU', allocation: {}, fundType: 'SMA', isSMAHighlight: true, investCosts: 0.65, transactionCost: 0.00, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00 },
  { name: 'ABA002 - AB Concentrated Global Growth Equities', apirCode: 'FC55712AU', allocation: {}, fundType: 'SMA', isSMAHighlight: false, investCosts: 0.753, transactionCost: 0.0607, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00 },
  { name: 'abrdn Emerging Markets Equity Fund', apirCode: 'ETL0032AU', allocation: {}, fundType: '', investCosts: 0.99, transactionCost: 0.01, buyCost: 0.22, sellCost: 0.22, perfFee: 0.00 },
  { name: 'abrdn Global Corporate Bond Fund (Class A)', apirCode: 'ETL0132AU', allocation: {}, fundType: '', investCosts: 0.50, transactionCost: 0.00, buyCost: 0.16, sellCost: 0.16, perfFee: 0.00 },
  { name: 'abrdn Sustainable Asian Opportunities Fund', apirCode: 'EQI0028AU', allocation: {}, fundType: '', investCosts: 1.18, transactionCost: 0.01, buyCost: 0.28, sellCost: 0.28, perfFee: 0.00 },
  { name: 'abrdn Sustainable International Equities Fund', apirCode: 'CRS0005AU', allocation: {}, fundType: '', investCosts: 0.98, transactionCost: 0.02, buyCost: 0.15, sellCost: 0.15, perfFee: 0.00 },
];

// ── Reusable investment fund definitions ──────────────────────────────────────

const makeInvestments = (platformId: string) => [
  {
    id: `${platformId}-inv1`,
    name: 'Acadian Australian Equity Long Short-Class A',
    apirCode: 'FSF3982AU',
    amount: 50000,
    allocation: { 'Domestic Equity': 100 },
  },
  {
    id: `${platformId}-inv2`,
    name: 'Acadian Defensive Income Fund - Class A',
    apirCode: 'FSF0973AU',
    amount: 50000,
    allocation: { 'Fixed Interest': 70, Cash: 30 },
  },
  {
    id: `${platformId}-inv3`,
    name: 'CFS FirstChoice W\'sale - CFS Australian Small Companies',
    apirCode: 'FSF0502AU',
    amount: 100000,
    allocation: { 'Domestic Equity': 100 },
  },
];

// ── Platform templates ─────────────────────────────────────────────────────────

function makeHub24Super(suffix = ''): Platform {
  return {
    id: `hub24-super${suffix}`,
    name: 'HUB24 Super - Choice',
    accountNumber: '111111',
    type: 'Super',
    balance: 200000,
    taxFreeBalance: 50000,
    otherBalancesClient: 0,
    otherBalancesFamily: 0,
    investments: makeInvestments(`hub24-super${suffix}`),
  };
}

function makePcareSuper(suffix = ''): Platform {
  return {
    id: `pcare-super${suffix}`,
    name: 'PortfolioCare Super eWRAP',
    accountNumber: '222222',
    type: 'Super',
    balance: 150000,
    taxFreeBalance: 30000,
    hasWarning: true,
    warningMessage: 'Platform requires attention — data may be out of date',
    investments: makeInvestments(`pcare-super${suffix}`),
  };
}

function makeResLife(suffix = ''): Platform {
  return {
    id: `res-life${suffix}`,
    name: 'Resolution Life SuperSelect',
    accountNumber: '88888888',
    type: 'Super',
    balance: 250000,
    taxFreeBalance: 80000,
    investments: makeInvestments(`res-life${suffix}`),
  };
}

function makeHub24Invest(suffix = ''): Platform {
  return {
    id: `hub24-invest${suffix}`,
    name: 'HUB24 Invest - Choice',
    accountNumber: '333333',
    type: 'Investment',
    balance: 50000,
    investments: [
      {
        id: `hub24-invest${suffix}-inv1`,
        name: 'Acadian Australian Equity Long Short-Class A',
        apirCode: 'FSF3982AU',
        amount: 25000,
        allocation: { 'Domestic Equity': 100 },
      },
      {
        id: `hub24-invest${suffix}-inv2`,
        name: 'Acadian Defensive Income Fund - Class A',
        apirCode: 'FSF0973AU',
        amount: 25000,
        allocation: { 'Fixed Interest': 70, Cash: 30 },
      },
    ],
  };
}

function makeHub24SuperDest(suffix = ''): Platform {
  return {
    id: `hub24-super-dest${suffix}`,
    name: 'HUB24 Super - Choice',
    accountNumber: 'NEW001',
    type: 'Super',
    balance: 0,
    investments: [],
  };
}

function makePcareSuperDest(suffix = ''): Platform {
  return {
    id: `pcare-super-dest${suffix}`,
    name: 'PortfolioCare Super eWRAP',
    accountNumber: 'NEW002',
    type: 'Super',
    balance: 0,
    investments: [],
  };
}

// ── Entity builder ─────────────────────────────────────────────────────────────

function makeEntities(scenarioId: string): Entity[] {
  return [
    {
      id: `${scenarioId}-client`,
      owner: 'Client',
      platforms: [makeHub24Super(`-${scenarioId}`), makePcareSuper(`-${scenarioId}`)],
    },
    {
      id: `${scenarioId}-partner`,
      owner: 'Partner',
      platforms: [makeResLife(`-${scenarioId}`)],
    },
    {
      id: `${scenarioId}-joint`,
      owner: 'Joint',
      ownershipSplit: { client: 50, partner: 50 },
      platforms: [makeHub24Invest(`-${scenarioId}`)],
    },
  ];
}

// ── Proposal builder ───────────────────────────────────────────────────────────

function makeProposals(scenarioId: string): Proposal[] {
  const hub24Src = makeHub24Super(`-${scenarioId}-prop`);
  const pcareSrc = makePcareSuper(`-${scenarioId}-prop`);
  const hub24Dest = makeHub24SuperDest(`-${scenarioId}`);
  const pcareDestA = makePcareSuperDest(`-${scenarioId}-a`);

  return [
    {
      id: `${scenarioId}-prop1`,
      label: 'Proposal 1',
      rows: [
        {
          id: `${scenarioId}-prop1-row1`,
          owner: 'Client',
          proposalType: 'Plan Review',
          fromPlatform: hub24Src,
          toPlatform: hub24Dest,
          balance: 200000,
        },
      ],
    },
    {
      id: `${scenarioId}-prop2`,
      label: 'Client - Rollover to HUB24 Super - Choice',
      rows: [
        {
          id: `${scenarioId}-prop2-row1`,
          owner: 'Client',
          proposalType: 'Rollover',
          fromPlatform: pcareSrc,
          toPlatform: hub24Dest,
          balance: 150000,
        },
      ],
    },
    {
      id: `${scenarioId}-prop3`,
      label: 'Client - Rollover to PortfolioCare Super eWRAP',
      rows: [
        {
          id: `${scenarioId}-prop3-row1`,
          owner: 'Client',
          proposalType: 'Rollover',
          fromPlatform: hub24Src,
          toPlatform: pcareDestA,
          balance: 200000,
        },
      ],
    },
    {
      id: `${scenarioId}-prop4`,
      label: 'Proposal 2',
      rows: [],
    },
    {
      id: `${scenarioId}-prop5`,
      label: 'Proposal 3',
      rows: [],
    },
    {
      id: `${scenarioId}-prop6`,
      label: 'Proposal 4',
      rows: [],
    },
  ];
}

// ── Ten scenarios ──────────────────────────────────────────────────────────────

const scenarioNames = [
  'GROW WRAP',
  'SMSF New',
  'Test Types',
  '123',
  'Hold ROA',
  'Investment with the same name',
  'New Plan Only',
  'NO Joint',
  'Rounding',
  '0907',
];

const scenarios: Scenario[] = scenarioNames.map((name, i) => {
  const id = `scenario-${i + 1}`;
  return {
    id,
    name,
    created: {
      date: `2024-0${(i % 9) + 1}-${String((i * 3 + 5) % 28 + 1).padStart(2, '0')}`,
      adviser: 'Satchell, Aron',
    },
    lastChanged: {
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i * 7 + 10) % 28 + 1).padStart(2, '0')}`,
      adviser: 'Satchell, Aron',
    },
    implemented:
      i % 3 === 0
        ? {
            date: `2025-0${(i % 9) + 1}-${String((i * 5 + 3) % 28 + 1).padStart(2, '0')}`,
            adviser: 'Satchell, Aron',
          }
        : undefined,
    locked: i === 2 || i === 7 ? { date: '2025-06-01', adviser: 'Satchell, Aron' } : undefined,
    isLocked: i === 2 || i === 7,
    entities: makeEntities(id),
    proposals: makeProposals(id),
  };
});

// ── Exported client file ───────────────────────────────────────────────────────

export const clientFile: ClientFile = {
  client: {
    name: 'Client Example',
    age: 61,
    retirementDate: '2035-07-15',
    ordinaryWages: 100000,
  },
  partner: {
    name: 'Partner Example',
    age: 59,
    retirementDate: '2033-07-02',
    ordinaryWages: 100000,
  },
  scenarios,
};
