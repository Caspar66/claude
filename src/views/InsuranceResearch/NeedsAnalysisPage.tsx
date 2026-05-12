import { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface CoverAmounts {
  life: number;
  tpd: number;
  trauma: number;
}

export interface NeedsAnalysisEntity {
  analysisMode: 'simple' | 'splits';
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
  client: NeedsAnalysisEntity;
  partner: NeedsAnalysisEntity;
}

function emptyCovers(): CoverAmounts {
  return { life: 0, tpd: 0, trauma: 0 };
}

export function getDefaultNeedsAnalysis(): NeedsAnalysisData {
  return { client: getDefaultEntity(), partner: getDefaultEntity() };
}

function getDefaultEntity(): NeedsAnalysisEntity {
  return {
    analysisMode: 'simple',
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
const COL_LABELS = ['Life', 'TPD', 'Trauma', 'Income\nProtection pa', 'Business\nExpenses pa'];

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
  const entity = activeTab === 'partner' ? data.partner : data.client;

  function updateEntity(updated: NeedsAnalysisEntity) {
    onChange(activeTab === 'partner' ? { ...data, partner: updated } : { ...data, client: updated });
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
    for (const f of COVER_FIELDS) vals.push(Math.max(0, totalReq[f] - totalProv[f]));
    vals.push(entity.incomeProtection);
    vals.push(entity.businessExpenses);
    return vals;
  }, [totalReq, totalProv, entity.incomeProtection, entity.businessExpenses]);

  const surplusShortfall = useMemo(() => {
    const vals: number[] = [];
    for (const f of COVER_FIELDS) vals.push(totalProv[f] - totalReq[f]);
    vals.push(-entity.incomeProtection);
    vals.push(-entity.businessExpenses);
    return vals;
  }, [totalReq, totalProv, entity.incomeProtection, entity.businessExpenses]);

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
            <div className="text-sm text-slate-700 mb-1">
              Requirements - {entityLabel}
            </div>
            <div className="flex items-center gap-6 mb-5 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Analysis Mode</span>
                <select
                  className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={entity.analysisMode}
                  onChange={(e) => updateEntity({ ...entity, analysisMode: e.target.value as 'simple' | 'splits' })}
                >
                  <option value="simple">Simple</option>
                  <option value="splits">Splits</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="text-left px-3 py-2 min-w-[260px]" />
                  {COL_LABELS.map((label) => (
                    <th key={label} className="text-right px-3 py-2 text-xs font-bold text-slate-700 whitespace-pre-line min-w-[110px]">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Capital Requirements */}
                <tr className="bg-slate-100 border-b border-slate-200">
                  <td colSpan={6} className="px-3 py-2 text-xs font-bold text-slate-800">
                    Capital Requirements
                  </td>
                </tr>
                {REQ_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-gray-100 hover:bg-slate-50/50">
                    <td className="px-3 py-1.5 text-xs text-slate-600">{row.label}</td>
                    {COVER_FIELDS.map((f) => (
                      <td key={f} className="px-3 py-1.5 text-right">
                        <CurrencyInput
                          value={entity.capitalRequirements[row.key][f]}
                          onChange={(v) => updateReq(row.key, f, v)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-1.5" />
                    <td className="px-3 py-1.5" />
                  </tr>
                ))}

                {/* Total Capital Required */}
                <tr className="bg-slate-100 border-y border-slate-300">
                  <td className="px-3 py-2 text-xs font-bold text-slate-800">Total Capital Required</td>
                  {COVER_FIELDS.map((f) => (
                    <td key={f} className="px-3 py-2 text-right text-xs font-bold text-slate-800">
                      {fmtCurrency(totalReq[f])}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <CurrencyInput
                      value={entity.incomeProtection}
                      onChange={(v) => updateEntity({ ...entity, incomeProtection: v })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <CurrencyInput
                      value={entity.businessExpenses}
                      onChange={(v) => updateEntity({ ...entity, businessExpenses: v })}
                    />
                  </td>
                </tr>

                {/* Spacer */}
                <tr><td colSpan={6} className="py-2" /></tr>

                {/* Capital Provisions */}
                <tr className="bg-slate-100 border-b border-slate-200">
                  <td colSpan={6} className="px-3 py-2 text-xs font-bold text-slate-800">
                    Capital Provisions
                  </td>
                </tr>
                {PROV_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-gray-100 hover:bg-slate-50/50">
                    <td className="px-3 py-1.5 text-xs text-slate-600">{row.label}</td>
                    {COVER_FIELDS.map((f) => (
                      <td key={f} className="px-3 py-1.5 text-right">
                        <CurrencyInput
                          value={entity.capitalProvisions[row.key][f]}
                          onChange={(v) => updateProv(row.key, f, v)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-1.5" />
                    <td className="px-3 py-1.5" />
                  </tr>
                ))}

                {/* Total Capital Available */}
                <tr className="bg-slate-100 border-y border-slate-300">
                  <td className="px-3 py-2 text-xs font-bold text-slate-800">Total Capital Available</td>
                  {COVER_FIELDS.map((f) => (
                    <td key={f} className="px-3 py-2 text-right text-xs font-bold text-slate-800">
                      {fmtCurrency(totalProv[f])}
                    </td>
                  ))}
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" />
                </tr>

                {/* Spacer */}
                <tr><td colSpan={6} className="py-2" /></tr>

                {/* Insurance Needs */}
                <tr className="bg-slate-100 border-b border-slate-200">
                  <td colSpan={6} className="px-3 py-2 text-xs font-bold text-slate-800">
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
                <tr><td colSpan={6} className="py-1" /></tr>

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
