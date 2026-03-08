import type { ClientFile, Platform, Entity, Proposal, Scenario, Investment } from '@/types/domain';

// ── Investment Catalogue (for Add Investment search) ──────────────────────────

const DEFAULT_FEE_ARRANGEMENTS = [
  { label: 'Adviser Service Fee', value: 'Set A' },
  { label: 'Brokerage Fee', value: 'Excluded' },
  { label: 'Contribution Fee', value: 'Set A' },
  { label: 'Human Financial SMA Fee', value: 'Excluded' },
  { label: 'Initial Contribution Fee', value: 'Set A' },
  { label: 'Listed Securities Fees', value: 'Set A' },
  { label: 'Managed Funds Fee', value: 'Set A' },
  { label: 'Portfolio Balance Rebate', value: 'Excluded' },
];

export const investmentCatalogue: Omit<Investment, 'id' | 'amount'>[] = [
  {
    name: '4 Dimensions Global Infrastructure Fund',
    apirCode: 'BFL0019AU',
    allocation: { 'International Equity': 88.5, 'Domestic Cash': 8.2, 'International Cash': 3.3 },
    fundType: '',
    investCosts: 1.00, transactionCost: 0.00, buyCost: 0.20, sellCost: 0.20, perfFee: 0.08,
    broadObjectives: "The Fund aims to provide investors with exposure to a diversified portfolio of global listed infrastructure securities, focusing on long-term capital growth and income.",
    pastPerformance: { oneMonth: 3.42, threeMonth: 7.15, sixMonth: 12.84, oneYear: 22.31, twoYear: 14.67, threeYear: 11.23, effectiveDate: '28/02/2026' },
    isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0,
  },
  {
    name: '4D Global Infrastructure Fund (AUD Hedged)',
    apirCode: 'BFL3306AU',
    allocation: { 'International Equity': 93.19, 'Domestic Cash': 6.69, 'International Cash': 0.12 },
    fundType: '',
    investCosts: 1.00, transactionCost: 0.05, buyCost: 0.20, sellCost: 0.20, perfFee: 0.08,
    broadObjectives: "The Fund's objective is to identify quality listed global infrastructure securities, trading below fair value, with sustainable, growing earnings combined with sustainable, growing dividends.",
    pastPerformance: { oneMonth: 6.65, threeMonth: 10.67, sixMonth: 18.27, oneYear: 31.11, twoYear: 17.92, threeYear: 12.78, effectiveDate: '28/02/2026' },
    isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0,
  },
  {
    name: 'AAL001 - Altair Concentrated Portfolio',
    apirCode: 'FC52336AU',
    allocation: { 'Domestic Equity': 85.0, 'International Equity': 10.0, 'Domestic Cash': 5.0 },
    fundType: 'SMA', isSMAHighlight: true,
    investCosts: 0.88, transactionCost: 0.00, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00,
    broadObjectives: "The portfolio aims to generate returns above the S&P/ASX 200 Accumulation Index through a concentrated portfolio of Australian equities.",
    pastPerformance: { oneMonth: 1.82, threeMonth: 4.56, sixMonth: 8.90, oneYear: 19.44, twoYear: 13.21, threeYear: 10.87, effectiveDate: '28/02/2026' },
    isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0,
  },
  { name: 'AAL002 - Altair Income Portfolio', apirCode: 'FC52337AU', allocation: { 'Domestic Fixed Interest': 60, 'Domestic Cash': 25, 'Domestic Equity': 15 }, fundType: 'SMA', isSMAHighlight: false, investCosts: 1.10, transactionCost: 0.00, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00, broadObjectives: "The portfolio focuses on generating consistent income returns through a combination of fixed interest securities and high-yielding equities.", pastPerformance: { oneMonth: 0.85, threeMonth: 2.41, sixMonth: 4.88, oneYear: 9.12, twoYear: 7.34, threeYear: 6.55, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'AAP001 - Ausbil Australian Active Equity', apirCode: 'FC56212AU', allocation: { 'Domestic Equity': 95.0, 'Domestic Cash': 5.0 }, fundType: 'SMA', isSMAHighlight: false, investCosts: 0.8298, transactionCost: 0.0604, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00, broadObjectives: "The portfolio seeks to outperform the S&P/ASX 200 Accumulation Index over rolling 3-year periods, investing in a diversified portfolio of Australian equities.", pastPerformance: { oneMonth: 2.11, threeMonth: 5.67, sixMonth: 11.23, oneYear: 21.45, twoYear: 14.88, threeYear: 12.02, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'AAP002 - Ausbil Australian Emerging Leaders', apirCode: 'FC56213AU', allocation: { 'Domestic Equity': 92.0, 'Domestic Cash': 8.0 }, fundType: 'SMA', isSMAHighlight: true, investCosts: 0.8112, transactionCost: 0.2207, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00, broadObjectives: "The portfolio targets small and mid-cap Australian companies with strong growth potential and competitive advantages within their industries.", pastPerformance: { oneMonth: 2.89, threeMonth: 7.23, sixMonth: 14.56, oneYear: 28.33, twoYear: 18.45, threeYear: 15.67, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'AB Global Strategic Core Equities Fund', apirCode: 'ACM3679AU', allocation: { 'International Equity': 96.0, 'Domestic Cash': 4.0 }, fundType: '', investCosts: 0.70, transactionCost: 0.20, buyCost: 0.20, sellCost: 0.20, perfFee: 0.00, broadObjectives: "The Fund seeks long-term capital appreciation by investing in a diversified portfolio of global equities selected using fundamental research.", pastPerformance: { oneMonth: 3.12, threeMonth: 8.45, sixMonth: 15.67, oneYear: 26.78, twoYear: 16.33, threeYear: 13.45, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'AB Managed Volatility Equities Fund - MVE Class', apirCode: 'ACM0006AU', allocation: { 'International Equity': 82.0, 'Domestic Equity': 12.0, 'Domestic Cash': 6.0 }, fundType: '', investCosts: 0.55, transactionCost: 0.00, buyCost: 0.25, sellCost: 0.25, perfFee: 0.00, broadObjectives: "The Fund aims to provide equity market returns with lower volatility than traditional equity indices through a risk-managed approach.", pastPerformance: { oneMonth: 1.95, threeMonth: 5.12, sixMonth: 9.87, oneYear: 18.44, twoYear: 12.56, threeYear: 10.23, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'AB Sustainable Global Thematic Equities Fund', apirCode: 'ACM8902AU', allocation: { 'International Equity': 94.0, 'Domestic Cash': 6.0 }, fundType: '', investCosts: 1.05, transactionCost: 0.00, buyCost: 0.20, sellCost: 0.20, perfFee: 0.00, broadObjectives: "The Fund invests in companies globally that are beneficiaries of sustainable economic themes, focusing on environmental and social responsibility.", pastPerformance: { oneMonth: 2.44, threeMonth: 6.78, sixMonth: 12.34, oneYear: 22.56, twoYear: 15.44, threeYear: 12.78, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: true, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'ABA001 - AB Concentrated US Growth Equities', apirCode: 'FC55713AU', allocation: { 'International Equity': 97.0, 'Domestic Cash': 3.0 }, fundType: 'SMA', isSMAHighlight: true, investCosts: 0.65, transactionCost: 0.00, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00, broadObjectives: "The portfolio concentrates on high-growth US technology and consumer discretionary companies with durable competitive advantages.", pastPerformance: { oneMonth: 5.23, threeMonth: 14.56, sixMonth: 24.33, oneYear: 42.11, twoYear: 24.56, threeYear: 18.90, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'ABA002 - AB Concentrated Global Growth Equities', apirCode: 'FC55712AU', allocation: { 'International Equity': 95.0, 'Domestic Cash': 5.0 }, fundType: 'SMA', isSMAHighlight: false, investCosts: 0.753, transactionCost: 0.0607, buyCost: 0.00, sellCost: 0.00, perfFee: 0.00, broadObjectives: "The portfolio invests in a select group of high-quality global growth companies with strong fundamentals and long-term earnings potential.", pastPerformance: { oneMonth: 3.88, threeMonth: 9.67, sixMonth: 18.45, oneYear: 32.23, twoYear: 19.34, threeYear: 15.67, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'abrdn Emerging Markets Equity Fund', apirCode: 'ETL0032AU', allocation: { 'International Equity': 90.0, 'Domestic Cash': 10.0 }, fundType: '', investCosts: 0.99, transactionCost: 0.01, buyCost: 0.22, sellCost: 0.22, perfFee: 0.00, broadObjectives: "The Fund seeks long-term total returns by investing in a high-conviction portfolio of emerging market equities.", pastPerformance: { oneMonth: 1.34, threeMonth: 3.89, sixMonth: 7.56, oneYear: 14.23, twoYear: 9.44, threeYear: 7.89, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'abrdn Global Corporate Bond Fund (Class A)', apirCode: 'ETL0132AU', allocation: { 'International Fixed Interest': 88.0, 'Domestic Cash': 12.0 }, fundType: '', investCosts: 0.50, transactionCost: 0.00, buyCost: 0.16, sellCost: 0.16, perfFee: 0.00, broadObjectives: "The Fund aims to provide regular income and modest capital growth through investment in a diversified portfolio of global corporate bonds.", pastPerformance: { oneMonth: 0.62, threeMonth: 1.88, sixMonth: 3.44, oneYear: 7.12, twoYear: 4.88, threeYear: 3.78, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'abrdn Sustainable Asian Opportunities Fund', apirCode: 'EQI0028AU', allocation: { 'International Equity': 91.0, 'Domestic Cash': 9.0 }, fundType: '', investCosts: 1.18, transactionCost: 0.01, buyCost: 0.28, sellCost: 0.28, perfFee: 0.00, broadObjectives: "The Fund invests in a portfolio of Asia-Pacific equities that demonstrate strong ESG practices, seeking both financial returns and positive societal impact.", pastPerformance: { oneMonth: 1.67, threeMonth: 4.23, sixMonth: 8.11, oneYear: 15.44, twoYear: 10.23, threeYear: 8.56, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: true, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
  { name: 'abrdn Sustainable International Equities Fund', apirCode: 'CRS0005AU', allocation: { 'International Equity': 93.0, 'Domestic Cash': 7.0 }, fundType: '', investCosts: 0.98, transactionCost: 0.02, buyCost: 0.15, sellCost: 0.15, perfFee: 0.00, broadObjectives: "The Fund invests in international companies committed to sustainable business practices, targeting long-term capital growth with responsible ESG integration.", pastPerformance: { oneMonth: 2.34, threeMonth: 6.11, sixMonth: 11.78, oneYear: 20.44, twoYear: 13.67, threeYear: 11.23, effectiveDate: '28/02/2026' }, isCashAccount: false, isEthical: true, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0 },
];

// ── Reusable investment fund definitions ──────────────────────────────────────

const makeInvestments = (platformId: string) => [
  {
    id: `${platformId}-inv1`,
    name: 'Acadian Australian Equity Long Short-Class A',
    apirCode: 'FSF3982AU',
    amount: 50000,
    allocation: { 'Domestic Equity': 78.4, 'International Equity': 12.6, 'Domestic Cash': 9.0 },
    fundType: '' as const,
    investCosts: 1.15, transactionCost: 0.10, buyCost: 0.25, sellCost: 0.25, perfFee: 0.20,
    broadObjectives: "The Fund seeks to generate returns in excess of the S&P/ASX 200 Accumulation Index over a full market cycle through a long/short strategy focused on Australian equities.",
    pastPerformance: { oneMonth: 2.14, threeMonth: 5.32, sixMonth: 9.87, oneYear: 18.42, twoYear: 11.25, threeYear: 8.76, fiveYear: 9.12, effectiveDate: '28/02/2026' },
    isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0,
  },
  {
    id: `${platformId}-inv2`,
    name: 'Acadian Defensive Income Fund - Class A',
    apirCode: 'FSF0973AU',
    amount: 50000,
    allocation: { 'Domestic Fixed Interest': 45.0, 'International Fixed Interest': 25.0, 'Domestic Cash': 20.0, 'International Cash': 10.0 },
    fundType: '' as const,
    investCosts: 0.65, transactionCost: 0.05, buyCost: 0.15, sellCost: 0.15, perfFee: 0.00,
    broadObjectives: "The Fund aims to provide investors with a regular income stream and capital stability by investing primarily in investment-grade fixed interest and cash securities.",
    pastPerformance: { oneMonth: 0.52, threeMonth: 1.58, sixMonth: 3.14, oneYear: 6.33, twoYear: 4.88, threeYear: 4.12, fiveYear: 4.55, effectiveDate: '28/02/2026' },
    isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0,
  },
  {
    id: `${platformId}-inv3`,
    name: "CFS FirstChoice W'sale - CFS Australian Small Companies",
    apirCode: 'FSF0502AU',
    amount: 100000,
    allocation: { 'Domestic Equity': 93.5, 'Domestic Cash': 6.5 },
    fundType: '' as const,
    investCosts: 0.95, transactionCost: 0.08, buyCost: 0.20, sellCost: 0.20, perfFee: 0.00,
    broadObjectives: "The Fund invests in a diversified portfolio of small Australian companies, seeking capital growth over the long term by identifying businesses with strong competitive positions.",
    pastPerformance: { oneMonth: 3.21, threeMonth: 8.44, sixMonth: 16.78, oneYear: 29.56, twoYear: 17.33, threeYear: 14.22, fiveYear: 12.88, effectiveDate: '28/02/2026' },
    isCashAccount: false, isEthical: false, feeArrangements: DEFAULT_FEE_ARRANGEMENTS, investmentRebate: 0,
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
