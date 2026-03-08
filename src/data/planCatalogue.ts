export type PlanType = 'Super' | 'Pension' | 'Investment';

export interface PlanRecord {
  id: string;
  name: string;
  type: PlanType;
  stars: number;        // 1.0 – 5.0, displayed as filled/half/empty stars
  hasWarning?: boolean; // red dot indicator
  hasVariants?: boolean;// split-button with dropdown for sub-types
  manager?: string;
  subtype?: string;
  features?: string[];
}

export const planCatalogue: PlanRecord[] = [
  // ── Super Plans ────────────────────────────────────────────────────────────
  { id: 'super-001', name: 'Access eWrap Super', type: 'Super', stars: 4, hasWarning: true, manager: 'Netwealth', subtype: 'Retail' },
  { id: 'super-002', name: 'Acclaim Core Super (Family Discount)', type: 'Super', stars: 4, manager: 'Acclaim', subtype: 'Retail' },
  { id: 'super-003', name: 'Acclaim Core Super (Standard)', type: 'Super', stars: 4, manager: 'Acclaim', subtype: 'Retail' },
  { id: 'super-004', name: 'Acclaim Super', type: 'Super', stars: 4, manager: 'Acclaim', subtype: 'Retail' },
  { id: 'super-005', name: 'Acquire Retirement Service Superannuation', type: 'Super', stars: 4.5, hasWarning: true, hasVariants: true, manager: 'Acquire', subtype: 'Industry' },
  { id: 'super-006', name: 'Active Super Choice', type: 'Super', stars: 4, manager: 'Active Super', subtype: 'Industry' },
  { id: 'super-007', name: 'Active Super Retirement Scheme', type: 'Super', stars: 2, hasWarning: true, manager: 'Active Super', subtype: 'Industry' },
  { id: 'super-008', name: 'Active Super Saver', type: 'Super', stars: 4, manager: 'Active Super', subtype: 'Industry' },
  { id: 'super-009', name: 'Agentia Super', type: 'Super', stars: 4, manager: 'Agentia', subtype: 'Retail' },
  { id: 'super-010', name: 'Akambo Super', type: 'Super', stars: 4.5, hasVariants: true, manager: 'Akambo', subtype: 'Retail' },
  { id: 'super-011', name: 'AMG Southern Cross Super Plan', type: 'Super', stars: 4, hasWarning: true, manager: 'AMG', subtype: 'Employer' },
  { id: 'super-012', name: 'AMG Super', type: 'Super', stars: 4.5, hasWarning: true, hasVariants: true, manager: 'AMG', subtype: 'Retail' },
  { id: 'super-013', name: 'AMP Signature Super - Employer Super', type: 'Super', stars: 4.5, hasWarning: true, hasVariants: true, manager: 'AMP', subtype: 'Employer' },
  { id: 'super-014', name: 'AMP Signature Super - Personal Super (Super Protection)', type: 'Super', stars: 4, manager: 'AMP', subtype: 'Retail' },
  { id: 'super-015', name: 'ANZ Personal Superannuation Bond (Fee Plan B)', type: 'Super', stars: 2.5, hasWarning: true, manager: 'ANZ', subtype: 'Retail' },
  { id: 'super-016', name: 'ANZ Smart Choice Super', type: 'Super', stars: 4, manager: 'ANZ', subtype: 'Retail' },
  { id: 'super-017', name: 'ANZ Smart Choice Super for employers and their employees', type: 'Super', stars: 4, manager: 'ANZ', subtype: 'Employer' },
  { id: 'super-018', name: 'AustralianSuper', type: 'Super', stars: 5, manager: 'AustralianSuper', subtype: 'Industry' },
  { id: 'super-019', name: 'BT Super', type: 'Super', stars: 4, manager: 'BT', subtype: 'Retail' },
  { id: 'super-020', name: 'BT Panorama Super', type: 'Super', stars: 4.5, manager: 'BT', subtype: 'Retail' },
  { id: 'super-021', name: 'CFS FirstChoice Employer Super', type: 'Super', stars: 4, manager: 'CFS', subtype: 'Employer' },
  { id: 'super-022', name: 'CFS FirstChoice Personal Super', type: 'Super', stars: 4, manager: 'CFS', subtype: 'Retail' },
  { id: 'super-023', name: 'Colonial First State Rollover Fund', type: 'Super', stars: 3.5, hasWarning: true, manager: 'CFS', subtype: 'Retail' },
  { id: 'super-024', name: 'HUB24 Super - Choice', type: 'Super', stars: 4.5, manager: 'HUB24', subtype: 'Retail' },
  { id: 'super-025', name: 'Macquarie Super Accumulator', type: 'Super', stars: 4, manager: 'Macquarie', subtype: 'Retail' },
  { id: 'super-026', name: 'MLC MasterKey Super Fundamentals', type: 'Super', stars: 3.5, manager: 'MLC', subtype: 'Retail' },
  { id: 'super-027', name: 'Netwealth Super Accelerator', type: 'Super', stars: 4.5, manager: 'Netwealth', subtype: 'Retail' },
  { id: 'super-028', name: 'Perpetual Select Super Plan', type: 'Super', stars: 4, manager: 'Perpetual', subtype: 'Retail' },
  { id: 'super-029', name: 'PortfolioCare Super eWRAP', type: 'Super', stars: 4, manager: 'Asgard', subtype: 'Retail' },
  { id: 'super-030', name: 'Resolution Life SuperSelect', type: 'Super', stars: 4, manager: 'Resolution Life', subtype: 'Retail' },
  { id: 'super-031', name: 'Sunsuper for Life', type: 'Super', stars: 5, manager: 'Sunsuper', subtype: 'Industry' },
  { id: 'super-032', name: 'UniSuper Accumulation (1) Plan', type: 'Super', stars: 5, manager: 'UniSuper', subtype: 'Industry' },

  // ── Pension Plans ──────────────────────────────────────────────────────────
  { id: 'pension-001', name: 'Access eWrap Pension', type: 'Pension', stars: 4, manager: 'Netwealth', subtype: 'Account Based' },
  { id: 'pension-002', name: 'AMP Flexible Super - Retirement', type: 'Pension', stars: 3.5, manager: 'AMP', subtype: 'Account Based' },
  { id: 'pension-003', name: 'ANZ Smart Choice Pension', type: 'Pension', stars: 4, manager: 'ANZ', subtype: 'Account Based' },
  { id: 'pension-004', name: 'BT Panorama Retirement', type: 'Pension', stars: 4.5, manager: 'BT', subtype: 'Account Based' },
  { id: 'pension-005', name: 'CFS FirstChoice Pension', type: 'Pension', stars: 4, manager: 'CFS', subtype: 'Account Based' },
  { id: 'pension-006', name: 'HUB24 Super - Pension', type: 'Pension', stars: 4.5, manager: 'HUB24', subtype: 'Account Based' },
  { id: 'pension-007', name: 'Macquarie Income Generator', type: 'Pension', stars: 4, manager: 'Macquarie', subtype: 'Account Based' },
  { id: 'pension-008', name: 'MLC MasterKey Pension Fundamentals', type: 'Pension', stars: 3.5, manager: 'MLC', subtype: 'Account Based' },
  { id: 'pension-009', name: 'Netwealth Super Accelerator Pension', type: 'Pension', stars: 4.5, manager: 'Netwealth', subtype: 'Account Based' },
  { id: 'pension-010', name: 'PortfolioCare eWRAP Pension', type: 'Pension', stars: 4, manager: 'Asgard', subtype: 'Account Based' },
  { id: 'pension-011', name: 'Resolution Life Pension Select', type: 'Pension', stars: 3.5, hasWarning: true, manager: 'Resolution Life', subtype: 'Account Based' },
  { id: 'pension-012', name: 'UniSuper Accumulation (2) Pension', type: 'Pension', stars: 5, manager: 'UniSuper', subtype: 'TTR' },

  // ── Investment Platforms ───────────────────────────────────────────────────
  { id: 'invest-001', name: 'BT Panorama Investments', type: 'Investment', stars: 4.5, manager: 'BT', subtype: 'Wrap' },
  { id: 'invest-002', name: 'CFS FirstChoice Investments', type: 'Investment', stars: 4, manager: 'CFS', subtype: 'Master Trust' },
  { id: 'invest-003', name: 'HUB24 Invest - Choice', type: 'Investment', stars: 4.5, manager: 'HUB24', subtype: 'Wrap' },
  { id: 'invest-004', name: 'Macquarie Wrap', type: 'Investment', stars: 4, manager: 'Macquarie', subtype: 'Wrap' },
  { id: 'invest-005', name: 'Netwealth Investments', type: 'Investment', stars: 4.5, manager: 'Netwealth', subtype: 'Wrap' },
  { id: 'invest-006', name: 'Perpetual Private', type: 'Investment', stars: 4, manager: 'Perpetual', subtype: 'Managed Account' },
  { id: 'invest-007', name: 'PortfolioCare Investments eWRAP', type: 'Investment', stars: 4, manager: 'Asgard', subtype: 'Wrap' },
];

export const PLAN_MANAGERS = ['All', 'AMP', 'ANZ', 'Asgard', 'Akambo', 'BT', 'CFS', 'HUB24', 'Macquarie', 'MLC', 'Netwealth', 'Perpetual', 'Resolution Life', 'UniSuper'];

export const PLAN_SUBTYPES: Record<PlanType, string[]> = {
  Super: ['All', 'Retail', 'Industry', 'Employer', 'Public Sector'],
  Pension: ['All', 'Account Based', 'TTR', 'Term Allocated'],
  Investment: ['All', 'Wrap', 'Master Trust', 'Managed Account'],
};

export const ADVANCED_FEATURES = [
  'Open for New Business', 'Public Offer', 'Employer Contribution',
  'Personal (pre-tax) Contributions', 'Personal (post-tax) Contributions', 'Spouse Contributions',
  'No Initial Minimum Investment', 'Savings Plan', 'Margin Lending Available',
  'Binding Nomination - Lapsing', 'Binding Nomination - Non-Lapsing', 'Binding Nomination - Non-Binding',
  'Binding Nomination - Reversionary Pension', 'Binding Nomination - None',
  'On-line Access', 'Accept of UK Transfers', 'Ability to Transfer In-Specie',
  'Direct Shares', 'Ethical Investments', 'SMA Investments', 'Unlimited Switches',
  'Death Cover Insurance', 'TPD Insurance', 'SC - Group Salary Continuance', 'Pension - TTR',
] as const;
