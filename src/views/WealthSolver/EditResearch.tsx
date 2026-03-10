import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWealthSolver } from '@/context/WealthSolverContext';
import type { WsPlan } from '@/types/wealthsolver';

interface Props {
  plan: WsPlan;
}

const PLAN_TYPES = ['Investment Platform', 'Super', 'Pension'] as const;

export function EditResearch({ plan }: Props) {
  const { dispatch } = useWealthSolver();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...plan });
  const [changed, setChanged] = useState<Set<string>>(new Set(plan.changedFields ?? []));

  function field<K extends keyof WsPlan>(key: K, value: WsPlan[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setChanged((s) => new Set([...s, key]));
  }

  function handleSave() {
    dispatch({
      type: 'UPDATE_PLAN',
      planId: plan.id,
      patch: form,
      changedFields: Array.from(changed),
    });
    navigate(`/research/plans/${plan.id}`);
  }

  function isChanged(key: string) {
    return changed.has(key);
  }

  const labelClass = 'block text-xs font-medium text-muted-foreground mb-0.5';
  const inputClass = 'w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600';

  function FieldRow({ label, k, children }: { label: string; k: string; children: React.ReactNode }) {
    return (
      <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-2 border-b border-border last:border-0">
        <label className={labelClass}>
          {label}
          {isChanged(k) && <span className="text-red-600 ml-0.5 font-bold">✱</span>}
        </label>
        <div>{children}</div>
      </div>
    );
  }

  const SaveCancel = () => (
    <div className="flex gap-2 py-3">
      <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-sm">Save</Button>
      <Button variant="outline" className="h-8 text-sm" onClick={() => navigate(`/research/plans/${plan.id}`)}>Cancel</Button>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Edit Research — {plan.name}</h2>
      </div>

      <SaveCancel />

      {/* Plan Information */}
      <Section title="Plan Information">
        <FieldRow label="Name" k="name">
          <input className={inputClass} value={form.name} onChange={(e) => field('name', e.target.value)} />
        </FieldRow>
        <FieldRow label="Sort Name" k="sortName">
          <input className={inputClass} value={form.sortName} onChange={(e) => field('sortName', e.target.value)} />
        </FieldRow>
        <FieldRow label="Manager" k="manager">
          <input className={inputClass} value={form.manager} onChange={(e) => field('manager', e.target.value)} />
        </FieldRow>
        <FieldRow label="ABN" k="abn">
          <input className={inputClass} value={form.abn} onChange={(e) => field('abn', e.target.value)} />
        </FieldRow>
        <FieldRow label="Plan Subtype" k="subtype">
          <input className={inputClass} value={form.subtype} onChange={(e) => field('subtype', e.target.value)} />
        </FieldRow>
        <FieldRow label="Plan Type" k="type">
          <select className={inputClass} value={form.type} onChange={(e) => field('type', e.target.value as WsPlan['type'])}>
            {PLAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Rating" k="rating">
          <select className={inputClass} value={form.rating} onChange={(e) => field('rating', Number(e.target.value))}>
            {[0, 1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} star{v !== 1 ? 's' : ''}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Open for New Business" k="openForBusiness">
          <select className={inputClass} value={form.openForBusiness ? 'yes' : 'no'} onChange={(e) => field('openForBusiness', e.target.value === 'yes')}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </FieldRow>
        <FieldRow label="Iress SPIN" k="iressSpin">
          <input className={inputClass} value={form.iressSpin ?? ''} onChange={(e) => field('iressSpin', e.target.value)} />
        </FieldRow>
        <FieldRow label="Product SPIN" k="productSpin">
          <input className={inputClass} value={form.productSpin ?? ''} onChange={(e) => field('productSpin', e.target.value)} />
        </FieldRow>
        <FieldRow label="USI" k="usi">
          <input className={inputClass} value={form.usi ?? ''} onChange={(e) => field('usi', e.target.value)} />
        </FieldRow>
        <FieldRow label="TMD Status" k="tmdStatus">
          <input className={inputClass} value={form.tmdStatus ?? ''} onChange={(e) => field('tmdStatus', e.target.value)} />
        </FieldRow>
        <FieldRow label="Created By" k="createdBy">
          <input className={inputClass} value={form.createdBy ?? ''} onChange={(e) => field('createdBy', e.target.value)} />
        </FieldRow>
        <FieldRow label="Comments" k="comments">
          <textarea className={inputClass} rows={2} value={form.comments ?? ''} onChange={(e) => field('comments', e.target.value)} />
        </FieldRow>
        <FieldRow label="General Description" k="description">
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
            changed={isChanged('contributions')}
            onChange={(v) => { field('contributions', { ...form.contributions, [k]: v }); }}
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
            changed={isChanged('payments')}
            onChange={(v) => { field('payments', { ...form.payments, [k]: v }); }}
          />
        ))}
      </Section>

      {/* Investment Rules */}
      <Section title="Investment Rules">
        {(Object.keys(form.investmentRules) as Array<keyof typeof form.investmentRules>).map((k) => (
          <FieldRow key={k} label={ruleLabel(k)} k="investmentRules">
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
      <h3 className="text-sm font-semibold text-white bg-gradient-to-r from-teal-700 to-teal-600 px-3 py-1.5 rounded-t">{title}</h3>
      <div className="border border-t-0 border-border rounded-b px-4 py-2">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, changed, onChange }: { label: string; checked: boolean; changed: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 py-1.5 border-b border-border last:border-0 cursor-pointer">
      <input type="checkbox" className="accent-teal-700" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}{changed && <span className="text-red-600 ml-0.5">✱</span>}</span>
    </label>
  );
}

function contribLabel(k: string): string {
  const map: Record<string, string> = {
    employerSG: 'Employer SG',
    employerVoluntary: 'Employer Voluntary',
    memberVoluntary: 'Member Voluntary',
    memberSalary: 'Member Salary Sacrifice',
    spouse: 'Spouse',
    governmentCoContribution: 'Government Co-Contribution',
    rollover: 'Rollover',
    downsizer: 'Downsizer',
  };
  return map[k] ?? k;
}

function paymentLabel(k: string): string {
  const map: Record<string, string> = {
    bpay: 'BPAY',
    directDebit: 'Direct Debit',
    cheque: 'Cheque',
    eft: 'EFT',
    creditCard: 'Credit Card',
    eftpos: 'EFTPOS',
  };
  return map[k] ?? k;
}

function ruleLabel(k: string): string {
  const map: Record<string, string> = {
    minInitial: 'Min Initial ($)',
    minOneOff: 'Min One-Off ($)',
    minRegularContrib: 'Min Regular Contrib ($)',
    minOneOffWithdrawal: 'Min One-Off Withdrawal ($)',
    minRegularWithdrawal: 'Min Regular Withdrawal ($)',
    minBalance: 'Min Balance ($)',
  };
  return map[k] ?? k;
}
