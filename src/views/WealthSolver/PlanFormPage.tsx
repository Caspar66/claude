/**
 * Shared form page used by both AddPlanPage and DerivePlanPage.
 * `mode="add"` starts blank; `mode="derive"` pre-fills from an existing plan
 * and forces the user to enter a unique name before saving.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWealthSolver } from '@/context/WealthSolverContext';
import { makeDefaultFees } from '@/data/wealthsolverSeed';
import type { WsPlan, WsPlanType } from '@/types/wealthsolver';

const PLAN_TYPES: WsPlanType[] = ['Investment Platform', 'Super', 'Pension'];

type Props =
  | { mode: 'add' }
  | { mode: 'derive'; sourcePlan: WsPlan };

export function PlanFormPage(props: Props) {
  const { state, dispatch } = useWealthSolver();
  const navigate = useNavigate();

  const isDerive = props.mode === 'derive';
  const source: Partial<WsPlan> = isDerive ? props.sourcePlan : {};

  const [form, setForm] = useState<Omit<WsPlan, 'id'>>({
    name: isDerive ? props.sourcePlan.name : '',
    sortName: source.sortName ?? '',
    manager: source.manager ?? '',
    type: source.type ?? 'Investment Platform',
    subtype: source.subtype ?? '',
    rating: source.rating ?? 0,
    openForBusiness: source.openForBusiness ?? true,
    abn: source.abn ?? '',
    productSpin: source.productSpin ?? '',
    usi: source.usi ?? '',
    iressSpin: source.iressSpin ?? '',
    tmdStatus: source.tmdStatus ?? '',
    createdBy: source.createdBy ?? '',
    comments: source.comments ?? '',
    description: source.description ?? '',
    contributions: source.contributions ?? {
      employerSG: false, employerVoluntary: false, memberVoluntary: false,
      memberSalary: false, spouse: false, governmentCoContribution: false,
      rollover: false, downsizer: false,
    },
    payments: source.payments ?? {
      bpay: false, directDebit: false, cheque: false,
      eft: false, creditCard: false, eftpos: false,
    },
    investmentRules: source.investmentRules ?? {
      minInitial: 0, minOneOff: 0, minRegularContrib: 0,
      minOneOffWithdrawal: 0, minRegularWithdrawal: 0, minBalance: 0,
    },
    // Derive copies investment options, fees and documents; Add starts empty
    investmentOptions: isDerive
      ? props.sourcePlan.investmentOptions.map((o) => ({ ...o }))
      : [],
    fees: isDerive
      ? JSON.parse(JSON.stringify(props.sourcePlan.fees))
      : makeDefaultFees(),
    documents: isDerive
      ? props.sourcePlan.documents.map((d) => ({ ...d }))
      : [],
    changedFields: [],
  });

  const [nameError, setNameError] = useState('');

  function field<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === 'name') setNameError('');
  }

  function validate(): boolean {
    const trimmed = form.name.trim();
    if (!trimmed) {
      setNameError('Plan name is required.');
      return false;
    }
    // Name must be unique across all existing plans
    const duplicate = state.plans.find((p) => p.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setNameError(`A plan named "${duplicate.name}" already exists. Please use a unique name.`);
      return false;
    }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    const id = `ws-plan-${Date.now()}`;
    dispatch({
      type: 'ADD_PLAN',
      plan: {
        ...form,
        id,
        name: form.name.trim(),
        sortName: form.sortName || form.name.trim(),
        ...(isDerive ? { derivedFromId: props.sourcePlan.id } : {}),
      },
    });
    navigate(`/research/plans/${id}`);
  }

  const inputClass =
    'w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-0.5';

  function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-2 border-b border-border last:border-0">
        <label className={labelClass}>{label}</label>
        <div>{children}</div>
      </div>
    );
  }

  const SaveCancel = () => (
    <div className="flex items-center gap-2 py-3">
      <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-sm">
        Save
      </Button>
      <Button variant="outline" className="h-8 text-sm" onClick={() => navigate('/research/plans')}>
        Cancel
      </Button>
    </div>
  );

  const pageTitle = isDerive
    ? `Derive Plan from "${props.sourcePlan.name}"`
    : 'Add Plan';

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-base font-semibold mb-1">{pageTitle}</h2>
      {isDerive && (
        <p className="text-xs text-muted-foreground mb-4">
          A copy of <strong>{props.sourcePlan.name}</strong> will be created. Enter a unique name to
          continue.
        </p>
      )}

      <SaveCancel />

      {/* Plan Information */}
      <Section title="Plan Information">
        <FieldRow label="Name *">
          <input
            className={`${inputClass} ${nameError ? 'border-red-400 ring-1 ring-red-400' : ''}`}
            value={form.name}
            onChange={(e) => field('name', e.target.value)}
            placeholder={isDerive ? 'Enter a unique plan name…' : 'Plan name'}
            autoFocus
          />
          {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
        </FieldRow>
        <FieldRow label="Sort Name">
          <input className={inputClass} value={form.sortName} onChange={(e) => field('sortName', e.target.value)} />
        </FieldRow>
        <FieldRow label="Manager">
          <input className={inputClass} value={form.manager} onChange={(e) => field('manager', e.target.value)} />
        </FieldRow>
        <FieldRow label="ABN">
          <input className={inputClass} value={form.abn} onChange={(e) => field('abn', e.target.value)} />
        </FieldRow>
        <FieldRow label="Plan Subtype">
          <input className={inputClass} value={form.subtype} onChange={(e) => field('subtype', e.target.value)} />
        </FieldRow>
        <FieldRow label="Plan Type">
          <select className={inputClass} value={form.type} onChange={(e) => field('type', e.target.value as WsPlanType)}>
            {PLAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Rating">
          <select className={inputClass} value={form.rating} onChange={(e) => field('rating', Number(e.target.value))}>
            {[0, 1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} star{v !== 1 ? 's' : ''}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Open for New Business">
          <select className={inputClass} value={form.openForBusiness ? 'yes' : 'no'} onChange={(e) => field('openForBusiness', e.target.value === 'yes')}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </FieldRow>
        <FieldRow label="Iress SPIN">
          <input className={inputClass} value={form.iressSpin ?? ''} onChange={(e) => field('iressSpin', e.target.value)} />
        </FieldRow>
        <FieldRow label="Product SPIN">
          <input className={inputClass} value={form.productSpin ?? ''} onChange={(e) => field('productSpin', e.target.value)} />
        </FieldRow>
        <FieldRow label="USI">
          <input className={inputClass} value={form.usi ?? ''} onChange={(e) => field('usi', e.target.value)} />
        </FieldRow>
        <FieldRow label="TMD Status">
          <input className={inputClass} value={form.tmdStatus ?? ''} onChange={(e) => field('tmdStatus', e.target.value)} />
        </FieldRow>
        <FieldRow label="Created By">
          <input className={inputClass} value={form.createdBy ?? ''} onChange={(e) => field('createdBy', e.target.value)} />
        </FieldRow>
        <FieldRow label="Comments">
          <textarea className={inputClass} rows={2} value={form.comments ?? ''} onChange={(e) => field('comments', e.target.value)} />
        </FieldRow>
        <FieldRow label="General Description">
          <textarea className={inputClass} rows={4} value={form.description} onChange={(e) => field('description', e.target.value)} />
        </FieldRow>
      </Section>

      {/* Contributions */}
      <Section title="Contributions">
        {(Object.keys(form.contributions) as Array<keyof typeof form.contributions>).map((k) => (
          <CheckRow
            key={k}
            label={contribLabel(k)}
            checked={form.contributions[k]}
            onChange={(v) => field('contributions', { ...form.contributions, [k]: v })}
          />
        ))}
      </Section>

      {/* Payment Facilities */}
      <Section title="Payment Facilities">
        {(Object.keys(form.payments) as Array<keyof typeof form.payments>).map((k) => (
          <CheckRow
            key={k}
            label={paymentLabel(k)}
            checked={form.payments[k]}
            onChange={(v) => field('payments', { ...form.payments, [k]: v })}
          />
        ))}
      </Section>

      {/* Investment Rules */}
      <Section title="Investment Rules">
        {(Object.keys(form.investmentRules) as Array<keyof typeof form.investmentRules>).map((k) => (
          <FieldRow key={k} label={ruleLabel(k)}>
            <input
              type="number"
              className={inputClass}
              value={form.investmentRules[k]}
              onChange={(e) => field('investmentRules', { ...form.investmentRules, [k]: Number(e.target.value) })}
            />
          </FieldRow>
        ))}
      </Section>

      <SaveCancel />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-white bg-navy px-3 py-1.5 rounded-t">
        {title}
      </h3>
      <div className="border border-t-0 border-border rounded-b px-4 py-2">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 py-1.5 border-b border-border last:border-0 cursor-pointer">
      <input type="checkbox" className="accent-teal-700" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function contribLabel(k: string): string {
  const map: Record<string, string> = {
    employerSG: 'Employer SG', employerVoluntary: 'Employer Voluntary',
    memberVoluntary: 'Member Voluntary', memberSalary: 'Member Salary Sacrifice',
    spouse: 'Spouse', governmentCoContribution: 'Government Co-Contribution',
    rollover: 'Rollover', downsizer: 'Downsizer',
  };
  return map[k] ?? k;
}

function paymentLabel(k: string): string {
  const map: Record<string, string> = {
    bpay: 'BPAY', directDebit: 'Direct Debit', cheque: 'Cheque',
    eft: 'EFT', creditCard: 'Credit Card', eftpos: 'EFTPOS',
  };
  return map[k] ?? k;
}

function ruleLabel(k: string): string {
  const map: Record<string, string> = {
    minInitial: 'Min Initial ($)', minOneOff: 'Min One-Off ($)',
    minRegularContrib: 'Min Regular Contrib ($)', minOneOffWithdrawal: 'Min One-Off Withdrawal ($)',
    minRegularWithdrawal: 'Min Regular Withdrawal ($)', minBalance: 'Min Balance ($)',
  };
  return map[k] ?? k;
}
