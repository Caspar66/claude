import { useState, useMemo } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface CoverAmounts {
  life: number;
  tpd: number;
  trauma: number;
}

export interface InsuranceSelection {
  life: boolean;
  tpd: boolean;
  trauma: boolean;
  incomeProtection: boolean;
  businessExpense: boolean;
}

export interface NeedsAnalysisEntity {
  capitalRequirements: {
    liabilitiesToClear: CoverAmounts;
    futureExpenditureRequired: CoverAmounts;
    futureEducationExpenses: CoverAmounts;
    medicalCostsRecovery: CoverAmounts;
    provisionForTax: CoverAmounts;
    other: CoverAmounts;
  };
  capitalProvisions: {
    disposableAssets: CoverAmounts;
    super: CoverAmounts;
    continuingIncome: CoverAmounts;
  };
  incomeProtection: number;
  businessExpenses: number;
}

export interface NeedsAnalysisData {
  insuranceSelection: InsuranceSelection;
  client: NeedsAnalysisEntity;
  partner: NeedsAnalysisEntity;
}

function emptyCovers(): CoverAmounts {
  return { life: 0, tpd: 0, trauma: 0 };
}

export function getDefaultNeedsAnalysis(): NeedsAnalysisData {
  return { insuranceSelection: getDefaultInsuranceSelection(), client: getDefaultEntity(), partner: getDefaultEntity() };
}

function getDefaultInsuranceSelection(): InsuranceSelection {
  return { life: true, tpd: true, trauma: true, incomeProtection: true, businessExpense: false };
}

function getDefaultEntity(): NeedsAnalysisEntity {
  return {
    capitalRequirements: {
      liabilitiesToClear: emptyCovers(),
      futureExpenditureRequired: emptyCovers(),
      futureEducationExpenses: emptyCovers(),
      medicalCostsRecovery: emptyCovers(),
      provisionForTax: emptyCovers(),
      other: emptyCovers(),
    },
    capitalProvisions: {
      disposableAssets: emptyCovers(),
      super: emptyCovers(),
      continuingIncome: emptyCovers(),
    },
    incomeProtection: 0,
    businessExpenses: 0,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

type ReqKey = keyof NeedsAnalysisEntity['capitalRequirements'];
type ProvKey = keyof NeedsAnalysisEntity['capitalProvisions'];
type CoverField = keyof CoverAmounts;

const COVER_FIELDS: CoverField[] = ['life', 'tpd', 'trauma'];
const COVER_LABEL: Record<CoverField, string> = { life: 'Life', tpd: 'TPD', trauma: 'Trauma' };

const REQ_ROWS: { key: ReqKey; label: string }[] = [
  { key: 'liabilitiesToClear', label: 'Liabilities to clear' },
  { key: 'futureExpenditureRequired', label: 'Future Expenditure Required' },
  { key: 'futureEducationExpenses', label: 'Future Education Expenses' },
  { key: 'medicalCostsRecovery', label: 'Medical costs/Recovery income' },
  { key: 'provisionForTax', label: 'Provision for Tax' },
  { key: 'other', label: 'Other' },
];

const PROV_ROWS: { key: ProvKey; label: string }[] = [
  { key: 'disposableAssets', label: 'Disposable Assets' },
  { key: 'super', label: 'Super' },
  { key: 'continuingIncome', label: 'Continuing Income' },
];

function fmtCurrency(n: number): string {
  const abs = Math.abs(n);
  const str = abs.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n < 0 ? `-$${str}` : `$${str}`;
}

// ── Shortfall computation (exported for use in NeedsEditor) ──────────────

export interface NeedsShortfall {
  life: number;
  tpd: number;
  trauma: number;
  incomeProtection: number;
  businessExpenses: number;
}

export function computeShortfalls(entity: NeedsAnalysisEntity): NeedsShortfall {
  let lifeReq = 0, tpdReq = 0, traumaReq = 0;
  let lifeProv = 0, tpdProv = 0, traumaProv = 0;
  for (const key of REQ_ROWS.map((r) => r.key)) {
    lifeReq += entity.capitalRequirements[key].life;
    tpdReq += entity.capitalRequirements[key].tpd;
    traumaReq += entity.capitalRequirements[key].trauma;
  }
  for (const key of PROV_ROWS.map((r) => r.key)) {
    lifeProv += entity.capitalProvisions[key].life;
    tpdProv += entity.capitalProvisions[key].tpd;
    traumaProv += entity.capitalProvisions[key].trauma;
  }
  return {
    life: lifeProv - lifeReq,
    tpd: tpdProv - tpdReq,
    trauma: traumaProv - traumaReq,
    incomeProtection: -entity.incomeProtection,
    businessExpenses: -entity.businessExpenses,
  };
}

type SideTab = 'client' | 'partner';

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  data: NeedsAnalysisData;
  onChange: (data: NeedsAnalysisData) => void;
  clientName: string;
  partnerName: string | null;
  onBack: () => void;
}

export function NeedsAnalysisPage({ data, onChange, clientName, partnerName, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<SideTab>('client');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const entity = activeTab === 'partner' ? data.partner : data.client;
  const sel = data.insuranceSelection;

  const visibleCoverFields = useMemo(() => COVER_FIELDS.filter((f) => sel[f]), [sel]);
  const showIP = sel.incomeProtection;
  const showBE = sel.businessExpense;
  const visibleColCount = visibleCoverFields.length + (showIP ? 1 : 0) + (showBE ? 1 : 0) + 1;

  function updateEntity(updated: NeedsAnalysisEntity) {
    onChange(activeTab === 'partner' ? { ...data, partner: updated } : { ...data, client: updated });
  }

  function updateInsuranceSelection(patch: Partial<InsuranceSelection>) {
    onChange({ ...data, insuranceSelection: { ...data.insuranceSelection, ...patch } });
  }

  function updateReq(key: ReqKey, field: CoverField, value: number) {
    updateEntity({
      ...entity,
      capitalRequirements: {
        ...entity.capitalRequirements,
        [key]: { ...entity.capitalRequirements[key], [field]: value },
      },
    });
  }

  function updateProv(key: ProvKey, field: CoverField, value: number) {
    updateEntity({
      ...entity,
      capitalProvisions: {
        ...entity.capitalProvisions,
        [key]: { ...entity.capitalProvisions[key], [field]: value },
      },
    });
  }

  const totalReq = useMemo(() => {
    const sums: CoverAmounts = { life: 0, tpd: 0, trauma: 0 };
    for (const key of REQ_ROWS.map((r) => r.key)) {
      for (const f of COVER_FIELDS) sums[f] += entity.capitalRequirements[key][f];
    }
    return sums;
  }, [entity.capitalRequirements]);

  const totalProv = useMemo(() => {
    const sums: CoverAmounts = { life: 0, tpd: 0, trauma: 0 };
    for (const key of PROV_ROWS.map((r) => r.key)) {
      for (const f of COVER_FIELDS) sums[f] += entity.capitalProvisions[key][f];
    }
    return sums;
  }, [entity.capitalProvisions]);

  const totalCoverRequired = useMemo(() => {
    const vals: number[] = [];
    for (const f of visibleCoverFields) vals.push(Math.max(0, totalReq[f] - totalProv[f]));
    if (showIP) vals.push(entity.incomeProtection);
    if (showBE) vals.push(entity.businessExpenses);
    return vals;
  }, [totalReq, totalProv, entity.incomeProtection, entity.businessExpenses, visibleCoverFields, showIP, showBE]);

  const surplusShortfall = useMemo(() => {
    const vals: number[] = [];
    for (const f of visibleCoverFields) vals.push(totalProv[f] - totalReq[f]);
    if (showIP) vals.push(-entity.incomeProtection);
    if (showBE) vals.push(-entity.businessExpenses);
    return vals;
  }, [totalReq, totalProv, entity.incomeProtection, entity.businessExpenses, visibleCoverFields, showIP, showBE]);

  const entityLabel = activeTab === 'partner' ? 'Partner' : 'Client';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <button className="flex items-center gap-1 text-sm text-teal-700 hover:underline font-medium" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Personal Details
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-200 bg-white flex flex-col py-3 px-3 gap-1 shrink-0">
          <button
            className={`text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'client' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('client')}
          >
            Client Needs
          </button>
          {partnerName && (
            <button
              className={`text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'partner' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('partner')}
            >
              Partner Needs
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {/* Header */}
          <div className="px-6 py-3 bg-slate-200 border-b border-slate-300">
            <h2 className="text-sm font-bold text-slate-700">{entityLabel} Needs</h2>
          </div>

          <div className="px-6 py-4">
            {/* Settings row */}
            <div className="flex items-center justify-between mb-5 py-2 border-b border-gray-200">
              <div className="text-sm text-slate-700 font-medium">
                Requirements - {entityLabel}
              </div>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                onClick={() => setOptionsOpen(true)}
              >
                <Settings size={13} /> Options
              </button>
            </div>

            {/* Options modal */}
            {optionsOpen && (
              <InsuranceOptionsModal
                selection={sel}
                onChange={updateInsuranceSelection}
                onClose={() => setOptionsOpen(false)}
              />
            )}

            {/* Table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="text-left px-3 py-2 min-w-[260px]" />
                  {visibleCoverFields.map((f) => (
                    <th key={f} className="text-right px-3 py-2 text-xs font-bold text-slate-700 min-w-[110px]">
                      {COVER_LABEL[f]}
                    </th>
                  ))}
                  {showIP && (
                    <th className="text-right px-3 py-2 text-xs font-bold text-slate-700 whitespace-pre-line min-w-[110px]">
                      {'Income\nProtection pa'}
                    </th>
                  )}
                  {showBE && (
                    <th className="text-right px-3 py-2 text-xs font-bold text-slate-700 whitespace-pre-line min-w-[110px]">
                      {'Business\nExpenses pa'}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Capital Requirements */}
                <tr className="bg-slate-100 border-b border-slate-200">
                  <td colSpan={visibleColCount} className="px-3 py-2 text-xs font-bold text-slate-800">
                    Capital Requirements
                  </td>
                </tr>
                {REQ_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-gray-100 hover:bg-slate-50/50">
                    <td className="px-3 py-1.5 text-xs text-slate-600">{row.label}</td>
                    {visibleCoverFields.map((f) => (
                      <td key={f} className="px-3 py-1.5 text-right">
                        <CurrencyInput
                          value={entity.capitalRequirements[row.key][f]}
                          onChange={(v) => updateReq(row.key, f, v)}
                        />
                      </td>
                    ))}
                    {showIP && <td className="px-3 py-1.5" />}
                    {showBE && <td className="px-3 py-1.5" />}
                  </tr>
                ))}

                {/* Total Capital Required */}
                <tr className="bg-slate-100 border-y border-slate-300">
                  <td className="px-3 py-2 text-xs font-bold text-slate-800">Total Capital Required</td>
                  {visibleCoverFields.map((f) => (
                    <td key={f} className="px-3 py-2 text-right text-xs font-bold text-slate-800">
                      {fmtCurrency(totalReq[f])}
                    </td>
                  ))}
                  {showIP && (
                    <td className="px-3 py-2 text-right">
                      <CurrencyInput
                        value={entity.incomeProtection}
                        onChange={(v) => updateEntity({ ...entity, incomeProtection: v })}
                      />
                    </td>
                  )}
                  {showBE && (
                    <td className="px-3 py-2 text-right">
                      <CurrencyInput
                        value={entity.businessExpenses}
                        onChange={(v) => updateEntity({ ...entity, businessExpenses: v })}
                      />
                    </td>
                  )}
                </tr>

                {/* Spacer */}
                <tr><td colSpan={visibleColCount} className="py-2" /></tr>

                {/* Capital Provisions */}
                <tr className="bg-slate-100 border-b border-slate-200">
                  <td colSpan={visibleColCount} className="px-3 py-2 text-xs font-bold text-slate-800">
                    Capital Provisions
                  </td>
                </tr>
                {PROV_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-gray-100 hover:bg-slate-50/50">
                    <td className="px-3 py-1.5 text-xs text-slate-600">{row.label}</td>
                    {visibleCoverFields.map((f) => (
                      <td key={f} className="px-3 py-1.5 text-right">
                        <CurrencyInput
                          value={entity.capitalProvisions[row.key][f]}
                          onChange={(v) => updateProv(row.key, f, v)}
                        />
                      </td>
                    ))}
                    {showIP && <td className="px-3 py-1.5" />}
                    {showBE && <td className="px-3 py-1.5" />}
                  </tr>
                ))}

                {/* Total Capital Available */}
                <tr className="bg-slate-100 border-y border-slate-300">
                  <td className="px-3 py-2 text-xs font-bold text-slate-800">Total Capital Available</td>
                  {visibleCoverFields.map((f) => (
                    <td key={f} className="px-3 py-2 text-right text-xs font-bold text-slate-800">
                      {fmtCurrency(totalProv[f])}
                    </td>
                  ))}
                  {showIP && <td className="px-3 py-2" />}
                  {showBE && <td className="px-3 py-2" />}
                </tr>

                {/* Spacer */}
                <tr><td colSpan={visibleColCount} className="py-2" /></tr>

                {/* Insurance Needs */}
                <tr className="bg-slate-100 border-b border-slate-200">
                  <td colSpan={visibleColCount} className="px-3 py-2 text-xs font-bold text-slate-800">
                    Insurance Needs
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 text-xs font-bold text-slate-700">Total Cover Required</td>
                  {totalCoverRequired.map((v, i) => (
                    <td key={i} className="px-3 py-2 text-right text-xs font-bold text-slate-800">
                      {fmtCurrency(v)}
                    </td>
                  ))}
                </tr>

                {/* Spacer */}
                <tr><td colSpan={visibleColCount} className="py-1" /></tr>

                {/* Surplus/Shortfall */}
                <tr className="border-t border-slate-300">
                  <td className="px-3 py-2 text-xs font-bold text-blue-700 underline">Surplus/Shortfall</td>
                  {surplusShortfall.map((v, i) => (
                    <td key={i} className={`px-3 py-2 text-right text-xs font-bold ${v < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                      {fmtCurrency(v)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Insurance Options Modal ──────────────────────────────────────────────

const INSURANCE_OPTIONS: { key: keyof InsuranceSelection; label: string }[] = [
  { key: 'life', label: 'Life Insurance' },
  { key: 'tpd', label: 'TPD Insurance' },
  { key: 'trauma', label: 'Trauma Insurance' },
  { key: 'incomeProtection', label: 'Income Protection' },
  { key: 'businessExpense', label: 'Business Expense' },
];

function InsuranceOptionsModal({
  selection,
  onChange,
  onClose,
}: {
  selection: InsuranceSelection;
  onChange: (patch: Partial<InsuranceSelection>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-[380px] max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-slate-50 rounded-t-lg">
          <h3 className="text-sm font-bold text-slate-700">Options</h3>
          <button className="text-slate-400 hover:text-slate-600 text-lg leading-none" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="px-5 py-4">
          <h4 className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">Insurance Selection</h4>
          <div className="flex flex-col gap-3">
            {INSURANCE_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  checked={selection[key]}
                  onChange={(e) => onChange({ [key]: e.target.checked })}
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-gray-200 bg-slate-50 rounded-b-lg">
          <button
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Currency input ────────────────────────────────────────────────────────

function CurrencyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');

  function handleFocus() {
    setFocused(true);
    setRaw(value === 0 ? '' : String(value));
  }

  function handleBlur() {
    setFocused(false);
    const parsed = parseFloat(raw.replace(/[^0-9.-]/g, ''));
    onChange(isNaN(parsed) ? 0 : parsed);
  }

  return (
    <input
      type="text"
      className="w-[100px] border border-slate-300 rounded px-2 py-1 text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
      value={focused ? raw : fmtCurrency(value)}
      onChange={(e) => setRaw(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
