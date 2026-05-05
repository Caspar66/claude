import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

// ── Fee definitions ────────────────────────────────────────────────────────────

interface FeeDef {
  label: string;
  hasPercent?: boolean;
  hasInfoIcon?: boolean;
}

interface FeeSection {
  title: string;
  fees: FeeDef[];
}

const ONGOING_COSTS: FeeSection = {
  title: 'Ongoing costs',
  fees: [
    { label: 'Account Membership fee' },
    { label: 'Administration Fees' },
    { label: 'Adviser Commission', hasPercent: true },
    { label: 'Adviser Service Fee', hasPercent: true },
    { label: 'Contribution Fee' },
    { label: 'Expense Recovery Fee', hasPercent: true },
    { label: 'Insurance Premium' },
    { label: 'Investment Fees and Costs', hasPercent: true },
    { label: 'Other Fees', hasPercent: true },
    { label: 'Performance Fees', hasPercent: true },
    { label: 'SMA Administration Access Fee' },
    { label: 'Transaction costs', hasPercent: true },
    { label: 'Trustee Fees', hasPercent: true },
  ],
};

const REBATES: FeeSection = {
  title: 'Rebates',
  fees: [
    { label: 'Contribution Commission Rebate' },
    { label: 'Investment Rebate', hasPercent: true },
    { label: 'Other Rebates', hasPercent: true },
    { label: 'Portfolio Balance Rebate', hasPercent: true },
    { label: 'Trail Commission Rebate', hasPercent: true },
  ],
};

const TRANSACTIONAL_COSTS: FeeSection = {
  title: 'Transactional Costs',
  fees: [
    { label: 'Brokerage Fee' },
    { label: 'Buy/Sell costs', hasInfoIcon: true },
    { label: 'Custodial Holdings Option Fee', hasPercent: true },
    { label: 'Exit Fees' },
    { label: 'External Brokerage Fee' },
    { label: 'Initial Contribution Fee' },
    { label: 'Less Initial Contribution Commission Rebate' },
    { label: 'Listed Securities Fees' },
    { label: 'Managed Funds Fee' },
    { label: 'Portfolio Construction Fee' },
    { label: 'Supplementary Brokerage fee' },
    { label: 'Withdrawal Fees' },
  ],
};

const COMMISSION_DETAILS: FeeSection = {
  title: 'Commission Details',
  fees: [
    { label: 'Contribution Commission' },
    { label: 'Initial Commission' },
    { label: 'Insurance Commission' },
    { label: 'Trail Commission', hasPercent: true },
  ],
};

const ALL_SECTIONS = [ONGOING_COSTS, REBATES, TRANSACTIONAL_COSTS, COMMISSION_DETAILS];
const CLOSING_SECTIONS = [TRANSACTIONAL_COSTS];

// ── Fee row state ─────────────────────────────────────────────────────────────

interface FeeAmendment {
  amended: boolean;
  percent: string;
  amount: string;
}

type FeeState = Record<string, FeeAmendment>;

function defaultFeeState(sections: FeeSection[]): FeeState {
  const state: FeeState = {};
  for (const section of sections) {
    for (const fee of section.fees) {
      state[fee.label] = { amended: false, percent: '0.00', amount: '0.00' };
    }
  }
  return state;
}

// ── Fee row component ─────────────────────────────────────────────────────────

interface FeeRowProps {
  fee: FeeDef;
  amendment: FeeAmendment;
  onChange: (update: Partial<FeeAmendment>) => void;
  calculatedAmount?: number;
  isEven: boolean;
}

function FeeRow({ fee, amendment, onChange, calculatedAmount = 0, isEven }: FeeRowProps) {
  const calcDisplay = `$${calculatedAmount.toFixed(2)}`;

  return (
    <tr className={isEven ? 'bg-white' : 'bg-gray-50/40'}>
      {/* Fee name */}
      <td className="pl-8 pr-3 py-1.5 w-56">
        <span className="text-blue-600 text-sm cursor-pointer hover:underline">{fee.label}</span>
      </td>

      {/* Calculated Fee Amount */}
      <td className="px-3 py-1.5 text-sm text-center w-36">
        {calculatedAmount !== 0 && (
          <span className="text-blue-600">{fee.hasPercent ? '0.00%' : ''}</span>
        )}
      </td>
      <td className="px-1 py-1.5 text-sm text-center w-20">{calcDisplay}</td>

      {/* Amended checkbox */}
      <td className="px-2 py-1.5 text-center w-8">
        <input
          type="checkbox"
          checked={amendment.amended}
          onChange={(e) => onChange({ amended: e.target.checked })}
          className="rounded border-slate-300"
        />
      </td>

      {/* % input */}
      <td className="px-1 py-1.5 w-20">
        {fee.hasPercent ? (
          <input
            type="text"
            value={amendment.percent}
            onChange={(e) => onChange({ percent: e.target.value })}
            className="w-full border border-border rounded px-2 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-teal-400"
            placeholder="0.00%"
          />
        ) : null}
      </td>

      {/* $ amount input */}
      <td className="px-1 py-1.5 w-24">
        <input
          type="text"
          value={amendment.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
          className="w-full border border-border rounded px-2 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-teal-400"
          placeholder="$0.00"
        />
      </td>

      {/* Icon */}
      <td className="px-2 py-1.5 w-8 text-center">
        {fee.hasInfoIcon ? (
          <Info size={14} className="text-muted-foreground inline" />
        ) : (
          <ExternalLink size={13} className="text-blue-500 inline cursor-pointer hover:text-blue-700" />
        )}
      </td>
    </tr>
  );
}

// ── Section component ─────────────────────────────────────────────────────────

interface FeeSectionViewProps {
  section: FeeSection;
  feeState: FeeState;
  onChange: (label: string, update: Partial<FeeAmendment>) => void;
}

function FeeSectionView({ section, feeState, onChange }: FeeSectionViewProps) {
  return (
    <>
      <tr className="bg-white border-t border-border">
        <td colSpan={7} className="px-4 py-2 text-sm font-semibold text-foreground">
          {section.title}
        </td>
      </tr>
      {section.fees.map((fee, i) => (
        <FeeRow
          key={fee.label}
          fee={fee}
          amendment={feeState[fee.label] ?? { amended: false, percent: '0.00', amount: '0.00' }}
          onChange={(update) => onChange(fee.label, update)}
          isEven={i % 2 === 0}
        />
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function EditFeesPage() {
  const { scenarioId, proposalId, platformId } = useParams<{
    scenarioId: string;
    proposalId?: string;
    platformId: string;
  }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') ?? 'proposed'; // 'proposed' | 'closing'
  const { state } = useAppContext();
  const navigate = useNavigate();

  // Find platform name — check current situation entities first, then proposal entries
  const scenario = state.clientFile.scenarios.find((s) => s.id === scenarioId);
  let platformName = '';
  let platformAccNum = '';

  if (scenario) {
    // Search current entities
    const current = scenario.entities
      .flatMap((e) => e.platforms)
      .find((p) => p.id === platformId);
    if (current) {
      platformName = current.name;
      platformAccNum = current.accountNumber;
    } else {
      // Search proposal entries
      for (const proposal of scenario.proposals) {
        if ('entries' in proposal) {
          const entry = proposal.entries.find((e) => e.platform.id === platformId);
          if (entry) {
            platformName = entry.platform.name;
            platformAccNum = entry.platform.accountNumber;
            break;
          }
        }
        if ('entityReviews' in proposal && proposal.entityReviews) {
          for (const er of proposal.entityReviews) {
            const entry = er.entries.find((e) => e.platform.id === platformId);
            if (entry) {
              platformName = entry.platform.name;
              platformAccNum = entry.platform.accountNumber;
              break;
            }
          }
          if (platformName) break;
        }
      }
    }
  }

  const sections = mode === 'closing' ? CLOSING_SECTIONS : ALL_SECTIONS;
  const [feeState, setFeeState] = useState<FeeState>(() => defaultFeeState(sections));

  function handleChange(label: string, update: Partial<FeeAmendment>) {
    setFeeState((prev) => ({
      ...prev,
      [label]: { ...prev[label], ...update },
    }));
  }

  const displayName = platformAccNum
    ? `${platformName} (${platformAccNum})`
    : platformName || platformId;

  const backPath = scenarioId ? `/scenarios/${scenarioId}` : '/scenarios';

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border bg-white sticky top-0 z-10">
        <span className="text-xs font-semibold border border-border rounded px-2 py-1 mr-2">
          CURRENT DATA
        </span>
        <Button variant="outline" size="sm" onClick={() => navigate(backPath)}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white"
          onClick={() => navigate(backPath)}
        >
          Save
        </Button>
      </div>

      {/* Fees card */}
      <div className="m-4 border border-border rounded overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-navy text-white">
          <span className="text-sm font-semibold">
            Plan Review : Edit Fees : {displayName}
          </span>
          <button className="text-white/80 hover:text-white text-base leading-none">
            ∧
          </button>
        </div>

        {/* Column headers */}
        <div className="bg-white border-b border-border">
          <table className="w-full text-xs">
            <colgroup>
              <col className="w-56" />
              <col className="w-36" />
              <col className="w-20" />
              <col className="w-8" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-8" />
            </colgroup>
            <thead>
              <tr>
                <th className="pl-8 pr-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                  Fee
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground" colSpan={2}>
                  Calculated Fee Amount
                </th>
                <th />
                <th className="px-1 py-2 text-center text-xs font-semibold text-muted-foreground" colSpan={2}>
                  Amended Fee Amount
                </th>
                <th />
              </tr>
            </thead>
          </table>
        </div>

        {/* Fee rows */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <colgroup>
              <col className="w-56" />
              <col className="w-36" />
              <col className="w-20" />
              <col className="w-8" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-8" />
            </colgroup>
            <tbody>
              {sections.map((section) => (
                <FeeSectionView
                  key={section.title}
                  section={section}
                  feeState={feeState}
                  onChange={handleChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
