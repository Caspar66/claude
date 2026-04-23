// ── Quote results types ──────────────────────────────────────────────────────

export interface PremiumBreakdown {
  life: number;
  tpdExt: number;
  traumaExt: number;
  incomeProtection: number;
  policyFee: number;
  stampDuty: number;
}

export interface CommissionBreakdown {
  p100Upfront: number;
  upfrontAmount: number;
  ongoingAmount: number;
}

export interface QuoteResultRow {
  id: string;
  insurer: string;
  insurerShort: string;
  insurerColor: string;
  insurerLogo?: string;
  product: string;
  lifeTpdDouble: string;
  tpdOwnership: string;
  annualPremium: number;
  superAmount: number;
  nonSuperAmount: number;
  fifteenYearPremium: number;
  featureScore: number;
  valueScore: number;
  selected: boolean;
  premiumBreakdown: PremiumBreakdown;
  commission: CommissionBreakdown;
}

export interface ExcludedProduct {
  id: string;
  insurer: string;
  insurerShort: string;
  reasons: string[];
  pdsLink: string;
}

export interface QuoteResults {
  rows: QuoteResultRow[];
  excluded: ExcludedProduct[];
  populated: boolean;
}

// ── Mock data generator ──────────────────────────────────────────────────────

export function generateMockQuoteResults(): QuoteResults {
  const rows: QuoteResultRow[] = [
    {
      id: 'qr-aia',
      insurer: 'AIA Australia',
      insurerShort: 'AIA',
      insurerColor: 'text-red-700',
      product: 'Life Cover Plan - TPD - Crisis Recovery, Income Protection CORE',
      lifeTpdDouble: 'Yes',
      tpdOwnership: 'Non-Super',
      annualPremium: 4826.40,
      superAmount: 0,
      nonSuperAmount: 4826.40,
      fifteenYearPremium: 89420.00,
      featureScore: 89,
      valueScore: 84,
      selected: false,
      premiumBreakdown: { life: 1284.00, tpdExt: 892.00, traumaExt: 648.00, incomeProtection: 1812.40, policyFee: 72.00, stampDuty: 118.00 },
      commission: { p100Upfront: 66, upfrontAmount: 3185.42, ongoingAmount: 966.28 },
    },
    {
      id: 'qr-tal',
      insurer: 'TAL',
      insurerShort: 'TAL',
      insurerColor: 'text-orange-600',
      product: 'Accelerated Protection - Health Sense Life & TPD, IP Enhance',
      lifeTpdDouble: 'Yes',
      tpdOwnership: 'Non-Super',
      annualPremium: 5142.00,
      superAmount: 0,
      nonSuperAmount: 5142.00,
      fifteenYearPremium: 94680.00,
      featureScore: 100,
      valueScore: 92,
      selected: false,
      premiumBreakdown: { life: 1356.00, tpdExt: 984.00, traumaExt: 720.00, incomeProtection: 1872.00, policyFee: 84.00, stampDuty: 126.00 },
      commission: { p100Upfront: 66, upfrontAmount: 3393.72, ongoingAmount: 1028.40 },
    },
    {
      id: 'qr-aami',
      insurer: 'AAMI Life Insurance',
      insurerShort: 'AAMI',
      insurerColor: 'text-blue-800',
      product: 'Life Protection - TPD Extension, Income Shield Standard',
      lifeTpdDouble: 'No',
      tpdOwnership: 'Non-Super',
      annualPremium: 4392.00,
      superAmount: 0,
      nonSuperAmount: 4392.00,
      fifteenYearPremium: 81240.00,
      featureScore: 72,
      valueScore: 78,
      selected: false,
      premiumBreakdown: { life: 1176.00, tpdExt: 804.00, traumaExt: 528.00, incomeProtection: 1704.00, policyFee: 60.00, stampDuty: 120.00 },
      commission: { p100Upfront: 60, upfrontAmount: 2635.20, ongoingAmount: 878.40 },
    },
    {
      id: 'qr-acclaim',
      insurer: 'Acclaim Super',
      insurerShort: 'Acclaim',
      insurerColor: 'text-emerald-700',
      product: 'Super Life Cover - TPD Extension, Income Protection',
      lifeTpdDouble: 'Yes',
      tpdOwnership: 'Super',
      annualPremium: 3948.00,
      superAmount: 3948.00,
      nonSuperAmount: 0,
      fifteenYearPremium: 72180.00,
      featureScore: 68,
      valueScore: 82,
      selected: false,
      premiumBreakdown: { life: 1044.00, tpdExt: 732.00, traumaExt: 0, incomeProtection: 2004.00, policyFee: 48.00, stampDuty: 120.00 },
      commission: { p100Upfront: 55, upfrontAmount: 2171.40, ongoingAmount: 789.60 },
    },
    {
      id: 'qr-amist',
      insurer: 'AMIST Super',
      insurerShort: 'AMIST',
      insurerColor: 'text-green-800',
      product: 'Group Life & TPD - Income Protection Basic',
      lifeTpdDouble: 'No',
      tpdOwnership: 'Super',
      annualPremium: 3612.00,
      superAmount: 3612.00,
      nonSuperAmount: 0,
      fifteenYearPremium: 66960.00,
      featureScore: 58,
      valueScore: 71,
      selected: false,
      premiumBreakdown: { life: 996.00, tpdExt: 660.00, traumaExt: 0, incomeProtection: 1788.00, policyFee: 48.00, stampDuty: 120.00 },
      commission: { p100Upfront: 50, upfrontAmount: 1806.00, ongoingAmount: 722.40 },
    },
    {
      id: 'qr-amp-sig',
      insurer: 'AMP Signature Super',
      insurerShort: 'AMP Sig',
      insurerColor: 'text-blue-900',
      product: 'Signature Protection - Life & TPD, Income Support',
      lifeTpdDouble: 'Yes',
      tpdOwnership: 'Super',
      annualPremium: 5484.00,
      superAmount: 5484.00,
      nonSuperAmount: 0,
      fifteenYearPremium: 101520.00,
      featureScore: 82,
      valueScore: 68,
      selected: false,
      premiumBreakdown: { life: 1476.00, tpdExt: 1044.00, traumaExt: 780.00, incomeProtection: 1944.00, policyFee: 96.00, stampDuty: 144.00 },
      commission: { p100Upfront: 66, upfrontAmount: 3619.44, ongoingAmount: 1096.80 },
    },
    {
      id: 'qr-anz-staff',
      insurer: 'ANZ Staff Super',
      insurerShort: 'ANZ Staff',
      insurerColor: 'text-sky-700',
      product: 'Staff Protect - Life & TPD Linked, Income Guard',
      lifeTpdDouble: 'No',
      tpdOwnership: 'Super',
      annualPremium: 3276.00,
      superAmount: 3276.00,
      nonSuperAmount: 0,
      fifteenYearPremium: 60720.00,
      featureScore: 55,
      valueScore: 76,
      selected: false,
      premiumBreakdown: { life: 876.00, tpdExt: 588.00, traumaExt: 0, incomeProtection: 1644.00, policyFee: 48.00, stampDuty: 120.00 },
      commission: { p100Upfront: 44, upfrontAmount: 1441.44, ongoingAmount: 655.20 },
    },
    {
      id: 'qr-aus-super',
      insurer: 'Australian Super',
      insurerShort: 'Aus Super',
      insurerColor: 'text-amber-700',
      product: 'Member Protect - Death & TPD, Income Protection',
      lifeTpdDouble: 'No',
      tpdOwnership: 'Super',
      annualPremium: 2940.00,
      superAmount: 2940.00,
      nonSuperAmount: 0,
      fifteenYearPremium: 54480.00,
      featureScore: 48,
      valueScore: 88,
      selected: false,
      premiumBreakdown: { life: 780.00, tpdExt: 540.00, traumaExt: 0, incomeProtection: 1452.00, policyFee: 48.00, stampDuty: 120.00 },
      commission: { p100Upfront: 0, upfrontAmount: 0, ongoingAmount: 0 },
    },
    {
      id: 'qr-aus-ethical',
      insurer: 'Australian Ethical Super',
      insurerShort: 'Aus Ethical',
      insurerColor: 'text-lime-700',
      product: 'Ethical Life Cover - TPD, Income Shield Ethical',
      lifeTpdDouble: 'No',
      tpdOwnership: 'Super',
      annualPremium: 3108.00,
      superAmount: 3108.00,
      nonSuperAmount: 0,
      fifteenYearPremium: 57600.00,
      featureScore: 52,
      valueScore: 80,
      selected: false,
      premiumBreakdown: { life: 840.00, tpdExt: 564.00, traumaExt: 0, incomeProtection: 1536.00, policyFee: 48.00, stampDuty: 120.00 },
      commission: { p100Upfront: 0, upfrontAmount: 0, ongoingAmount: 0 },
    },
  ];

  const excluded: ExcludedProduct[] = [
    {
      id: 'ex-clearview',
      insurer: 'ClearView',
      insurerShort: 'ClearView',
      reasons: ['1. No product could meet your Trauma Extension need', '2. Sum insured exceeds maximum for selected occupation class'],
      pdsLink: '#',
    },
    {
      id: 'ex-metlife',
      insurer: 'MetLife',
      insurerShort: 'MetLife',
      reasons: ['1. No product could meet your Life need at the selected premium structure'],
      pdsLink: '#',
    },
    {
      id: 'ex-pps',
      insurer: 'PPS Mutual',
      insurerShort: 'PPS',
      reasons: ['1. Membership restrictions – product is limited to qualified professionals', '2. No Income Protection product available for selected benefit period'],
      pdsLink: '#',
    },
    {
      id: 'ex-neos',
      insurer: 'NEOS Life',
      insurerShort: 'NEOS',
      reasons: ['1. No product could meet your Trauma Extension need'],
      pdsLink: '#',
    },
  ];

  return { rows, excluded, populated: true };
}

export function getEmptyQuoteResults(): QuoteResults {
  return { rows: [], excluded: [], populated: false };
}
