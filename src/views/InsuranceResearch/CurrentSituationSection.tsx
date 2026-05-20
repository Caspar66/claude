import { useState } from 'react';
import { ChevronUp, ChevronDown, Settings, Move, SquarePen, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExistingPolicy, ExistingCoverType, ResearchPortfolio } from './insuranceData';
import { COVER_TYPE_LABELS, OWNERSHIP_OPTIONS_BY_TYPE, PREMIUM_FREQUENCY_LABELS, totalPolicyPremiumPerAnnum } from './insuranceData';
import { MapProductModal } from './MapProductModal';

type ActionStatus = 'Not Considered' | 'Review';
const ACTIONS: ActionStatus[] = ['Not Considered', 'Review'];

function AddOwnerModal({ onSave, onClose }: { onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl w-80 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Add Custom Owner</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>
        <input
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          placeholder="Owner name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()); }}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs"
            onClick={() => { if (name.trim()) onSave(name.trim()); }}
            disabled={!name.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  policies: ExistingPolicy[];
  clientName: string;
  partnerName: string | null;
  onAddCover: () => void;
  onChangePolicies: (policies: ExistingPolicy[]) => void;
}

function ownershipLabel(coverType: ExistingCoverType, code: string | undefined): string {
  if (!code) return '';
  return OWNERSHIP_OPTIONS_BY_TYPE[coverType].find((o) => o.code === code)?.label ?? '';
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSum(s: string): string {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (isNaN(n) || n === 0) return 'N/A';
  return `$${n.toLocaleString('en-AU')}`;
}

export function CurrentSituationSection({ policies, clientName, partnerName, onAddCover, onChangePolicies }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [reviewPolicyId, setReviewPolicyId] = useState<string | null>(null);
  const [customOwners, setCustomOwners] = useState<string[]>([]);
  const [addOwnerTarget, setAddOwnerTarget] = useState<{ policyId: string; coverId: string } | null>(null);

  const groupedByInsured: Record<'client' | 'partner', ExistingPolicy[]> = { client: [], partner: [] };
  for (const p of policies) groupedByInsured[p.lifeInsured].push(p);

  function updateAction(policyId: string, action: ActionStatus) {
    onChangePolicies(policies.map((p) => p.id === policyId ? { ...p, action } : p));
    if (action === 'Review') setReviewPolicyId(policyId);
  }

  function removePolicy(policyId: string) {
    onChangePolicies(policies.filter((p) => p.id !== policyId));
  }

  function saveResearchPortfolio(portfolio: ResearchPortfolio) {
    if (!reviewPolicyId) return;
    onChangePolicies(policies.map((p) => p.id === reviewPolicyId ? { ...p, researchPortfolio: portfolio } : p));
  }

  function updateCoverOwner(policyId: string, coverId: string, owner: string) {
    onChangePolicies(policies.map((p) => {
      if (p.id !== policyId) return p;
      return { ...p, covers: p.covers.map((c) => c.id === coverId ? { ...c, owner } : c) };
    }));
  }

  function handleOwnerChange(policyId: string, coverId: string, value: string) {
    if (value === '__add__') {
      setAddOwnerTarget({ policyId, coverId });
      return;
    }
    updateCoverOwner(policyId, coverId, value);
  }

  function handleAddOwnerSave(name: string) {
    if (!addOwnerTarget) return;
    setCustomOwners((prev) => prev.includes(name) ? prev : [...prev, name]);
    updateCoverOwner(addOwnerTarget.policyId, addOwnerTarget.coverId, name);
    setAddOwnerTarget(null);
  }

  function buildOwnerOptions(): string[] {
    const opts: string[] = [clientName];
    if (partnerName && !opts.includes(partnerName)) opts.push(partnerName);
    if (!opts.includes('SMSF')) opts.push('SMSF');
    if (!opts.includes('Super Fund')) opts.push('Super Fund');
    for (const co of customOwners) {
      if (!opts.includes(co)) opts.push(co);
    }
    return opts;
  }

  const ownerOptions = buildOwnerOptions();
  const reviewPolicy = reviewPolicyId ? policies.find((p) => p.id === reviewPolicyId) ?? null : null;

  return (
    <div className="mx-5 my-4 border border-gray-200 rounded overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-400/70 text-white"
      >
        <span className="text-sm font-bold">Current Situation</span>
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-white/80" />
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!collapsed && (
        <div className="bg-white">
          {/* Add button row */}
          <div className="flex items-center justify-end border-b border-gray-200 px-2">
              <div className="flex items-center gap-2 py-2">
                <Button
                  size="sm"
                  className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs h-8 px-3"
                  onClick={onAddCover}
                >
                  Add Existing Cover
                </Button>
              </div>
          </div>

          {/* Existing policies content */}
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_130px] gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50 text-xs font-bold text-slate-700">
                <div />
                <div>Policy Description</div>
                <div>Super</div>
                <div>Non-Super</div>
                <div>Premium (pa)</div>
                <div>Action</div>
              </div>

              {policies.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-slate-400">
                  No existing policies. Click "Add Existing Cover" to begin.
                </div>
              )}

              {/* Grouped by life insured */}
              {(['client', 'partner'] as const).map((who) => {
                const list = groupedByInsured[who];
                if (list.length === 0) return null;
                const name = who === 'client' ? clientName : (partnerName ?? 'Partner');
                return (
                  <div key={who}>
                    <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
                      <Move size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Life Insured: {name}</span>
                    </div>
                    {list.map((p) => {
                      const totalPa = totalPolicyPremiumPerAnnum(p);
                      const superPremium = p.premiumSuper > 0 ? formatMoney(p.premiumSuper) : 'N/A';
                      const nonSuperPremium = p.premiumNonSuper > 0 ? formatMoney(p.premiumNonSuper) : 'N/A';
                      const superFreqSuffix = `/${PREMIUM_FREQUENCY_LABELS[p.superFrequency].toLowerCase()}`;
                      const nonSuperFreqSuffix = `/${PREMIUM_FREQUENCY_LABELS[p.nonSuperFrequency].toLowerCase()}`;
                      return (
                        <div key={p.id}>
                          {/* Policy header row */}
                          <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_130px] gap-2 px-3 py-2 border-b border-gray-100 items-start">
                            <div className="flex items-center gap-1 pt-0.5">
                              <SquarePen size={12} className="text-blue-500 cursor-pointer" />
                              <button className="text-slate-400 hover:text-red-500" onClick={() => removePolicy(p.id)}>×</button>
                              <button
                                className={p.researchPortfolio ? 'text-emerald-600 hover:text-emerald-800' : 'text-blue-500 hover:text-blue-700'}
                                title={p.researchPortfolio ? 'Linked — click to edit' : 'Map supplier and products'}
                                onClick={() => setReviewPolicyId(p.id)}
                              >
                                <Link2 size={12} />
                              </button>
                            </div>
                            <div className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">{p.provider}</span>
                                {p.researchPortfolio && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                    Linked
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-700">{p.policyDescription}</div>
                            </div>
                            <div className="text-xs text-slate-700">{p.premiumSuper > 0 ? `${superPremium} ${superFreqSuffix}` : 'N/A'}</div>
                            <div className="text-xs text-slate-700">{p.premiumNonSuper > 0 ? `${nonSuperPremium} ${nonSuperFreqSuffix}` : 'N/A'}</div>
                            <div className="text-xs text-slate-700 font-medium">{formatMoney(totalPa)}</div>
                            <div>
                              <select
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={p.action}
                                onChange={(e) => updateAction(p.id, e.target.value as ActionStatus)}
                              >
                                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Covers sub-table */}
                          {p.covers.length > 0 && (
                            <div className="bg-gray-50/60 border-b border-gray-200 px-3 py-2">
                              <div className="grid grid-cols-[100px_1fr_1fr_140px_60px_1fr] gap-2 text-[11px] font-bold text-slate-600 pb-1 border-b border-gray-200">
                                <div>Cover</div>
                                <div>Ownership</div>
                                <div>Owner</div>
                                <div className="text-right">Benefit Amount</div>
                                <div className="text-center">Super</div>
                                <div>Life Insured</div>
                              </div>
                              {p.covers.map((cov) => {
                                const currentOwner = cov.owner || name;
                                return (
                                  <div key={cov.id} className="grid grid-cols-[100px_1fr_1fr_140px_60px_1fr] gap-2 py-1 text-[11px] text-slate-700 items-center">
                                    <div className="font-medium">{COVER_TYPE_LABELS[cov.coverType]}</div>
                                    <div>{ownershipLabel(cov.coverType, cov.ownership) || '—'}</div>
                                    <div>
                                      <select
                                        className="border border-gray-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer w-full"
                                        value={currentOwner}
                                        onChange={(e) => handleOwnerChange(p.id, cov.id, e.target.value)}
                                      >
                                        {ownerOptions.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        {!ownerOptions.includes(currentOwner) && (
                                          <option value={currentOwner}>{currentOwner}</option>
                                        )}
                                        <option value="__add__">+ Add...</option>
                                      </select>
                                    </div>
                                    <div className="text-right">{formatSum(cov.sumInsured)}</div>
                                    <div className="text-center">
                                      <input type="checkbox" disabled checked={cov.super === 'Yes'} />
                                    </div>
                                    <div>{name}</div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
        </div>
      )}

      <MapProductModal
        open={reviewPolicy !== null}
        onClose={() => setReviewPolicyId(null)}
        policy={reviewPolicy}
        onSave={saveResearchPortfolio}
      />

      {addOwnerTarget && (
        <AddOwnerModal
          onSave={handleAddOwnerSave}
          onClose={() => setAddOwnerTarget(null)}
        />
      )}
    </div>
  );
}
