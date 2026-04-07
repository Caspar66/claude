import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, ArrowUp, Eye, RefreshCw, FileText, Copy, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { InsuranceProvider, DisplayOption } from './insuranceData';

interface Props {
  providers: InsuranceProvider[];
  onToggleProvider: (id: string) => void;
  premiumFrequency: 'Monthly Premium' | 'Annual Premium';
  onPremiumFrequencyChange: (v: 'Monthly Premium' | 'Annual Premium') => void;
  displayOptions: Set<DisplayOption>;
  onToggleDisplayOption: (opt: DisplayOption) => void;
  splitFrequency?: boolean;
  onViewFeatures?: () => void;
  onReport?: () => void;
  onCompareFeatures?: () => void;
}

const INSURER_ICONS = ({ hasIcons }: { hasIcons: boolean }) => {
  if (!hasIcons) return null;
  return (
    <div className="flex items-center gap-1 text-gray-400">
      <Eye size={14} />
      <RefreshCw size={14} />
      <FileText size={14} />
      <PlusCircle size={14} />
    </div>
  );
};

export function ProviderResultsTable({
  providers,
  onToggleProvider,
  premiumFrequency,
  onPremiumFrequencyChange,
  displayOptions,
  onToggleDisplayOption,
  onViewFeatures,
  onReport,
  onCompareFeatures,
}: Props) {
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);

  const sorted = [...providers].sort((a, b) =>
    sortDir === 'asc' ? a.premium - b.premium : b.premium - a.premium
  );

  const showLogos = !displayOptions.has('hideLogos');
  const showInsurer = !displayOptions.has('hideInsurerColumn');
  const showFeatureScores = !displayOptions.has('hideFeatureScores');
  const showCombinedScores = !displayOptions.has('hideCombinedScores');
  const showProductNames = !displayOptions.has('hideProductNames');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        {onCompareFeatures && (
          <Button variant="outline" size="sm" className="text-xs" onClick={onCompareFeatures}>
            Compare Features
          </Button>
        )}
        {onViewFeatures && (
          <Button variant="outline" size="sm" className="text-xs" onClick={onViewFeatures}>
            View Features
          </Button>
        )}
        {onReport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1">
                Report <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onReport}>Features Gained and Lost</DropdownMenuItem>
              <DropdownMenuItem>Premium Comparison</DropdownMenuItem>
              <DropdownMenuItem>Full Comparison Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Display Options */}
        <DropdownMenu open={displayMenuOpen} onOpenChange={setDisplayMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1 font-semibold">
              Display Options <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {([
              ['hideLogos', 'Hide Logos'],
              ['hideInsurerColumn', 'Hide Insurer Column'],
              ['hideFeatureScores', 'Hide Feature Scores'],
              ['hideCombinedScores', 'Hide Combined Scores'],
              ['hideUnmatchedProducts', 'Hide Unmatched Products'],
              ['hideProductNames', 'Hide Product Names'],
              ['showSuperAndNonSuper', 'Show Super and Non-Super'],
            ] as [DisplayOption, string][]).map(([key, label]) => (
              <DropdownMenuItem
                key={key}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleDisplayOption(key);
                }}
                className="gap-2"
              >
                <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${displayOptions.has(key) ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300'}`}>
                  {displayOptions.has(key) && <Check size={10} strokeWidth={3} />}
                </div>
                {key === 'showSuperAndNonSuper' ? (
                  <span className="text-teal-700 underline">{label}</span>
                ) : (
                  label
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              Graph <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Premium Comparison</DropdownMenuItem>
            <DropdownMenuItem>Feature Score</DropdownMenuItem>
            <DropdownMenuItem>Combined Score</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {/* Split Frequency / Premium toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              {premiumFrequency} <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPremiumFrequencyChange('Monthly Premium')}>Monthly Premium</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPremiumFrequencyChange('Annual Premium')}>Annual Premium</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="w-8 px-2 py-2">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              {showLogos && (
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-24">Logo</th>
              )}
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                {showProductNames ? 'Supplier Name' : 'Supplier'}
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-600 w-28">
                <button
                  className="flex items-center gap-1 hover:text-teal-700"
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                >
                  {sortDir === 'asc' ? <ArrowUp size={12} /> : <ChevronUp size={12} />}
                  Premium
                </button>
              </th>
              {showInsurer && (
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 w-20">Insurer</th>
              )}
              {showFeatureScores && (
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-center w-28">Feature Score</th>
              )}
              {showCombinedScores && (
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-center w-32">Combined Score</th>
              )}
              <th className="px-3 py-2 text-xs font-semibold text-slate-600 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${p.selected ? 'bg-teal-50/40' : ''}`}
              >
                <td className="px-2 py-3">
                  <button
                    onClick={() => onToggleProvider(p.id)}
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center ${p.selected ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300'}`}
                  >
                    {p.selected && <Check size={10} strokeWidth={3} />}
                  </button>
                </td>
                {showLogos && (
                  <td className="px-3 py-3">
                    <div className="font-bold text-base text-slate-700 tracking-tight">
                      {p.shortName === 'ZURICH' ? (
                        <span className="text-blue-800 italic">{p.shortName}</span>
                      ) : p.shortName === 'integrity.' ? (
                        <span className="text-slate-600 font-light tracking-wide">{p.shortName}</span>
                      ) : p.shortName === 'TAL' ? (
                        <span className="text-orange-600 font-black tracking-widest">{p.shortName}</span>
                      ) : p.shortName === 'NEOS' ? (
                        <span className="text-teal-700 font-bold tracking-wider">{p.shortName}</span>
                      ) : p.shortName === 'MLC' ? (
                        <span className="text-amber-700 font-bold">{p.shortName}</span>
                      ) : p.shortName === 'BT' ? (
                        <span className="text-emerald-700 font-black">{p.shortName}</span>
                      ) : p.shortName === 'AMP Life' || p.shortName === 'AMP' ? (
                        <span className="text-blue-900 font-bold">{p.shortName}</span>
                      ) : p.shortName === 'pps' ? (
                        <span className="text-green-800 font-medium">{p.shortName}</span>
                      ) : (
                        <span className="text-slate-700">{p.shortName}</span>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-3 py-3">
                  <span className="text-sm text-slate-800">
                    {p.name}
                    {showProductNames && p.product && (
                      <span className="text-slate-500 ml-1">{p.product}</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-3 font-semibold text-slate-800 text-center">
                  {p.premium > 0 ? (
                    `$${p.premium.toFixed(2)}`
                  ) : (
                    <span className="text-slate-400">$0.00 <span className="text-amber-500">&#9432;</span></span>
                  )}
                </td>
                {showInsurer && (
                  <td className="px-3 py-3 text-center">
                    <INSURER_ICONS hasIcons={p.hasIcons} />
                  </td>
                )}
                {showFeatureScores && (
                  <td className="px-3 py-3 text-center font-medium text-slate-700">
                    {p.featureScore > 0 ? p.featureScore : ''}
                  </td>
                )}
                {showCombinedScores && (
                  <td className="px-3 py-3 text-center font-medium text-slate-700">
                    {p.combinedScore > 0 ? p.combinedScore : ''}
                  </td>
                )}
                <td className="px-3 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                        Actions <ChevronDown size={10} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy size={12} className="mr-2" />
                        Compare Features
                      </DropdownMenuItem>
                      <DropdownMenuItem>View PDS</DropdownMenuItem>
                      <DropdownMenuItem>Add to Scenario</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
