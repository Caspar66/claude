import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useWealthSolver } from '@/context/WealthSolverContext';
import { ColHead, DRow, SecLabel, Stars, YN, fmtCurrency, fmtPct } from './components';
import { EditResearch } from './EditResearch';
import { EditFees } from './EditFees';
import { EditDocuments } from './EditDocuments';
import { InvestmentOptionsView } from './InvestmentOptionsView';
import type { WsPlan } from '@/types/wealthsolver';

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useWealthSolver();

  const plan = state.plans.find((p) => p.id === planId);
  if (!plan) {
    return <div className="p-6 text-muted-foreground text-sm">Plan not found.</div>;
  }

  const mode = searchParams.get('mode');

  function setMode(m: string | null) {
    if (m) setSearchParams({ mode: m });
    else setSearchParams({});
  }

  // Sub-view routing
  if (mode === 'editResearch') return <EditResearch plan={plan} />;
  if (mode === 'editFees') return <EditFees plan={plan} />;
  if (mode === 'editDocuments') return <EditDocuments plan={plan} />;
  if (mode === 'investmentOptions') return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <button className="text-teal-700 text-sm hover:underline" onClick={() => setMode(null)}>← Back to Plan</button>
        <span className="text-muted-foreground text-sm">/ Investment Options</span>
      </div>
      <InvestmentOptionsView plan={plan} />
    </div>
  );

  // Default: Plan Detail View
  return <PlanDetail plan={plan} onMode={setMode} plans={state.plans} />;
}

function PlanDetail({ plan, onMode, plans }: { plan: WsPlan; onMode: (m: string) => void; plans: WsPlan[] }) {
  const navigate = useNavigate();
  const isChanged = (field: string) => (plan.changedFields ?? []).includes(field);

  const isDerived = !!plan.derivedFromId;
  const sourcePlan = isDerived ? plans.find((p) => p.id === plan.derivedFromId) : undefined;

  return (
    <div className="p-4 overflow-auto">
      {/* Disclaimer banner */}
      {(plan.changedFields?.length ?? 0) > 0 && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          * Displayed next to any field that has been changed and will not receive any WealthSolver research updates.
          Fields without a * will continue to receive research updates.
        </div>
      )}

      {/* Derived-from banner */}
      {isDerived && (
        <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          Derived from{' '}
          {sourcePlan ? (
            <button
              className="font-semibold underline hover:text-blue-900"
              onClick={() => navigate(`/research/plans/${sourcePlan.id}`)}
            >
              {sourcePlan.name}
            </button>
          ) : (
            <span className="font-semibold">a deleted plan</span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">
          {plan.name}
          {isDerived && <span className="ml-2 text-sm font-normal text-muted-foreground">Derived</span>}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-sm"
            onClick={() => onMode('investmentOptions')}
          >
            Investment Options
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-sm">
                Edit <ChevronDown size={12} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onMode('editResearch')}>Edit Research</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMode('editFees')}>Edit Fees</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMode('editDocuments')}>Edit Product Documents</DropdownMenuItem>
              {!isDerived && (
                <DropdownMenuItem onClick={() => navigate(`/research/plans/${plan.id}/derive`)}>Derive Plan</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 text-sm" onClick={() => navigate('/research/plans')}>
            Back
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-sm text-muted-foreground" disabled>
            Report
          </Button>
        </div>
      </div>

      {/* Product Overview */}
      <ColHead title="Product Overview" defaultOpen>
        <DRow label="Name" value={plan.name} changed={isChanged('name')} />
        <DRow label="Product SPIN" value={plan.productSpin ?? '—'} />
        <DRow label="USI" value={plan.usi ?? '—'} />
        <DRow label="Iress SPIN" value={plan.iressSpin ?? '—'} changed={isChanged('iressSpin')} />
        <DRow label="Plan Subtype" value={plan.subtype} />
        <DRow label="Open for New Business" value={<YN value={plan.openForBusiness} />} />
        <DRow label="Product Type" value="Product" />
        <DRow
          label="Product documents"
          value={
            plan.documents.length === 0
              ? <span className="text-muted-foreground italic">No documents</span>
              : (
                <span className="flex flex-wrap gap-2">
                  {plan.documents.map((d) => (
                    <span key={d.id} className="text-teal-700 underline cursor-pointer text-xs">{d.name}</span>
                  ))}
                </span>
              )
          }
        />
        <DRow label="TMD Status" value={plan.tmdStatus ?? '—'} />
        <DRow label="Created By" value={plan.createdBy ?? '—'} changed={isChanged('createdBy')} />
        <DRow label="Comments" value={plan.comments ?? '—'} changed={isChanged('comments')} />
        <DRow label="Relationships" value="Derived from link" />
        <DRow label="General Description" value={plan.description} />
      </ColHead>

      {/* Product Details */}
      <ColHead title="Product Details" defaultOpen={false}>
        <SecLabel label="Contributions" />
        <DRow label="Employer SG" value={<YN value={plan.contributions.employerSG} />} />
        <DRow label="Employer Voluntary" value={<YN value={plan.contributions.employerVoluntary} />} />
        <DRow label="Member Voluntary" value={<YN value={plan.contributions.memberVoluntary} />} />
        <DRow label="Member Salary Sacrifice" value={<YN value={plan.contributions.memberSalary} />} />
        <DRow label="Spouse" value={<YN value={plan.contributions.spouse} />} />
        <DRow label="Government Co-Contribution" value={<YN value={plan.contributions.governmentCoContribution} />} />
        <DRow label="Rollover" value={<YN value={plan.contributions.rollover} />} />
        <DRow label="Downsizer" value={<YN value={plan.contributions.downsizer} />} />

        <SecLabel label="Payment Facilities" />
        <DRow label="BPAY" value={<YN value={plan.payments.bpay} />} />
        <DRow label="Direct Debit" value={<YN value={plan.payments.directDebit} />} />
        <DRow label="Cheque" value={<YN value={plan.payments.cheque} />} />
        <DRow label="EFT" value={<YN value={plan.payments.eft} />} />
        <DRow label="Credit Card" value={<YN value={plan.payments.creditCard} />} />
        <DRow label="EFTPOS" value={<YN value={plan.payments.eftpos} />} />

        <SecLabel label="Investment Rules" />
        <DRow label="Min Initial" value={fmtCurrency(plan.investmentRules.minInitial)} />
        <DRow label="Min One-Off" value={fmtCurrency(plan.investmentRules.minOneOff)} />
        <DRow label="Min Regular Contrib" value={fmtCurrency(plan.investmentRules.minRegularContrib)} />
        <DRow label="Min One-Off Withdrawal" value={fmtCurrency(plan.investmentRules.minOneOffWithdrawal)} />
        <DRow label="Min Regular Withdrawal" value={fmtCurrency(plan.investmentRules.minRegularWithdrawal)} />
        <DRow label="Min Balance" value={fmtCurrency(plan.investmentRules.minBalance)} />
      </ColHead>

      {/* Investment Options */}
      <ColHead title="Investment Options" defaultOpen={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-3 py-1.5 text-left text-muted-foreground">Name</th>
                <th className="px-3 py-1.5 text-left text-muted-foreground">APIR</th>
                <th className="px-3 py-1.5 text-right text-muted-foreground">Invest Fees</th>
                <th className="px-3 py-1.5 text-right text-muted-foreground">Perf Fee</th>
                <th className="px-3 py-1.5 text-right text-muted-foreground">Trans Cost</th>
              </tr>
            </thead>
            <tbody>
              {plan.investmentOptions.map((opt) => (
                <tr key={opt.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-1.5">{opt.name}</td>
                  <td className="px-3 py-1.5 font-mono text-muted-foreground">{opt.apir}</td>
                  <td className="px-3 py-1.5 text-right">{fmtPct(opt.investFees)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtPct(opt.perfFees)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtPct(opt.transCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ColHead>

      {/* Fees Overview */}
      <ColHead title="Fees Overview" defaultOpen={false}>
        <FeeGroup label="Ongoing Costs" fees={plan.fees.ongoing} />
        <FeeGroup label="Rebates" fees={plan.fees.rebates} />
        <FeeGroup label="Transactional Costs" fees={plan.fees.transactional} />
        <FeeGroup label="Commission Details" fees={plan.fees.commissions} />
      </ColHead>
    </div>
  );
}

function FeeGroup({ label, fees }: { label: string; fees: import('@/types/wealthsolver').WsFee[] }) {
  return (
    <>
      <SecLabel label={label} />
      {fees.map((fee) => (
        <DRow key={fee.xplanId} label={fee.name} value={fee.prodCostDesc} />
      ))}
    </>
  );
}
