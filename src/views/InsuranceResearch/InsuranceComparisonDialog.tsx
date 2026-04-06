import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (scenarioName: string) => void;
  clientName: string;
  partnerName: string;
}

type CoverType = 'Death' | 'TPD' | 'Trauma' | 'Income Protection';

interface CoverSelection {
  type: CoverType;
  selected: boolean;
  owner: string;
  amount: string;
  waitingPeriod?: string;
  benefitPeriod?: string;
}

interface Provider {
  id: string;
  name: string;
  product: string;
  premium: number;
  rating: number;
  features: string[];
  selected: boolean;
}

const COMPARISON_STEPS = [
  'Select Cover',
  'Cover Details',
  'Compare Providers',
  'Review & Save',
] as const;

type Step = (typeof COMPARISON_STEPS)[number];

const SAMPLE_PROVIDERS: Provider[] = [
  {
    id: 'p1',
    name: 'AIA Australia',
    product: 'Priority Protection',
    premium: 1245.0,
    rating: 4,
    features: ['Loyalty bonus', 'Future insurability', 'Accelerated cover'],
    selected: false,
  },
  {
    id: 'p2',
    name: 'MLC Life Insurance',
    product: 'MLC Protection',
    premium: 1180.5,
    rating: 4,
    features: ['Premium freeze', 'Rehabilitation benefit', 'Grief support'],
    selected: false,
  },
  {
    id: 'p3',
    name: 'TAL',
    product: 'Accelerated Protection',
    premium: 1320.0,
    rating: 5,
    features: ['Health sense benefit', 'Income booster', 'Built-in extras'],
    selected: false,
  },
  {
    id: 'p4',
    name: 'Zurich',
    product: 'Zurich Protection',
    premium: 1095.75,
    rating: 3,
    features: ['Needlestick benefit', 'Suspension option', 'Premium discount'],
    selected: false,
  },
  {
    id: 'p5',
    name: 'MetLife',
    product: 'Protect',
    premium: 1155.0,
    rating: 4,
    features: ['360Health program', 'Family support', 'Best doctors'],
    selected: false,
  },
];

export function InsuranceComparisonDialog({
  open,
  onClose,
  onComplete,
  clientName,
  partnerName,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [scenarioName, setScenarioName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'premium' | 'rating' | 'name'>('premium');

  const [covers, setCovers] = useState<CoverSelection[]>([
    { type: 'Death', selected: false, owner: clientName, amount: '' },
    { type: 'TPD', selected: false, owner: clientName, amount: '' },
    { type: 'Trauma', selected: false, owner: clientName, amount: '' },
    {
      type: 'Income Protection',
      selected: false,
      owner: clientName,
      amount: '',
      waitingPeriod: '30 days',
      benefitPeriod: '2 years',
    },
  ]);

  const [providers, setProviders] = useState<Provider[]>(SAMPLE_PROVIDERS);

  const selectedCovers = covers.filter((c) => c.selected);
  const selectedProviders = providers.filter((p) => p.selected);

  function resetState() {
    setCurrentStep(0);
    setScenarioName('');
    setSearchTerm('');
    setCovers([
      { type: 'Death', selected: false, owner: clientName, amount: '' },
      { type: 'TPD', selected: false, owner: clientName, amount: '' },
      { type: 'Trauma', selected: false, owner: clientName, amount: '' },
      {
        type: 'Income Protection',
        selected: false,
        owner: clientName,
        amount: '',
        waitingPeriod: '30 days',
        benefitPeriod: '2 years',
      },
    ]);
    setProviders(SAMPLE_PROVIDERS);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleNext() {
    if (currentStep < COMPARISON_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleComplete() {
    const name = scenarioName.trim() || `Insurance Comparison ${new Date().toLocaleDateString('en-AU')}`;
    onComplete(name);
    resetState();
  }

  function toggleCover(type: CoverType) {
    setCovers((prev) =>
      prev.map((c) => (c.type === type ? { ...c, selected: !c.selected } : c))
    );
  }

  function updateCover(type: CoverType, field: string, value: string) {
    setCovers((prev) =>
      prev.map((c) => (c.type === type ? { ...c, [field]: value } : c))
    );
  }

  function toggleProvider(id: string) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  }

  const filteredProviders = providers
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'premium') return a.premium - b.premium;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  const canProceed =
    currentStep === 0
      ? selectedCovers.length > 0
      : currentStep === 1
        ? selectedCovers.every((c) => c.amount.trim() !== '')
        : currentStep === 2
          ? selectedProviders.length >= 1
          : true;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-teal-700 text-white">
          <h2 className="text-base font-semibold">Insurance Comparison</h2>
          <button
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-border">
          <div className="flex items-center gap-2">
            {COMPARISON_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      i < currentStep
                        ? 'bg-teal-600 text-white'
                        : i === currentStep
                          ? 'bg-teal-700 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {i < currentStep ? <Check size={14} /> : i + 1}
                  </div>
                  <span
                    className={`text-sm ${
                      i === currentStep ? 'font-semibold text-teal-700' : 'text-muted-foreground'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < COMPARISON_STEPS.length - 1 && (
                  <ChevronRight size={16} className="mx-3 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {/* Step 1: Select Cover */}
          {currentStep === 0 && (
            <div>
              <h3 className="text-base font-semibold mb-1">Select Cover Types</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the types of insurance cover to compare for this scenario.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {covers.map((cover) => (
                  <button
                    key={cover.type}
                    onClick={() => toggleCover(cover.type)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-colors ${
                      cover.selected
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-border hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        cover.selected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {cover.selected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{cover.type}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {cover.type === 'Death' && 'Life insurance / death cover'}
                        {cover.type === 'TPD' && 'Total & permanent disability'}
                        {cover.type === 'Trauma' && 'Critical illness / recovery'}
                        {cover.type === 'Income Protection' && 'Salary continuance'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Cover Details */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-base font-semibold mb-1">Cover Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Specify the details for each selected cover type.
              </p>
              <div className="space-y-4">
                {selectedCovers.map((cover) => (
                  <div
                    key={cover.type}
                    className="border border-border rounded-lg p-4"
                  >
                    <h4 className="font-medium text-sm mb-3 text-teal-700">{cover.type}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Life Insured
                        </label>
                        <select
                          className="w-full border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                          value={cover.owner}
                          onChange={(e) => updateCover(cover.type, 'owner', e.target.value)}
                        >
                          <option value={clientName}>{clientName}</option>
                          <option value={partnerName}>{partnerName}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Sum Insured ($)
                        </label>
                        <input
                          type="text"
                          className="w-full border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                          placeholder="e.g. 500,000"
                          value={cover.amount}
                          onChange={(e) => updateCover(cover.type, 'amount', e.target.value)}
                        />
                      </div>
                      {cover.type === 'Income Protection' && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Waiting Period
                            </label>
                            <select
                              className="w-full border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                              value={cover.waitingPeriod ?? '30 days'}
                              onChange={(e) =>
                                updateCover(cover.type, 'waitingPeriod', e.target.value)
                              }
                            >
                              <option value="14 days">14 days</option>
                              <option value="30 days">30 days</option>
                              <option value="60 days">60 days</option>
                              <option value="90 days">90 days</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Benefit Period
                            </label>
                            <select
                              className="w-full border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                              value={cover.benefitPeriod ?? '2 years'}
                              onChange={(e) =>
                                updateCover(cover.type, 'benefitPeriod', e.target.value)
                              }
                            >
                              <option value="2 years">2 years</option>
                              <option value="5 years">5 years</option>
                              <option value="To age 65">To age 65</option>
                              <option value="To age 70">To age 70</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Compare Providers */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-base font-semibold mb-1">Compare Providers</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select providers to include in your comparison. Premiums are indicative based on selected covers.
              </p>

              {/* Search and sort */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    className="w-full border border-border rounded pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    placeholder="Search providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    setSortBy((prev) =>
                      prev === 'premium' ? 'rating' : prev === 'rating' ? 'name' : 'premium'
                    )
                  }
                >
                  <ArrowUpDown size={12} />
                  Sort: {sortBy === 'premium' ? 'Premium' : sortBy === 'rating' ? 'Rating' : 'Name'}
                </Button>
              </div>

              {/* Provider cards */}
              <div className="space-y-3">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      provider.selected
                        ? 'border-teal-600 bg-teal-50/50'
                        : 'border-border hover:border-teal-300'
                    }`}
                    onClick={() => toggleProvider(provider.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            provider.selected
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {provider.selected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{provider.name}</div>
                          <div className="text-xs text-muted-foreground">{provider.product}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i < provider.rating ? 'bg-amber-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-foreground">
                          ${provider.premium.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-muted-foreground">per annum</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3 ml-8">
                      {provider.features.map((f) => (
                        <span
                          key={f}
                          className="text-xs bg-gray-100 text-muted-foreground rounded-full px-2 py-0.5"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review & Save */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-base font-semibold mb-1">Review &amp; Save</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review your selections and save this insurance comparison scenario.
              </p>

              {/* Scenario name */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Scenario Name</label>
                <input
                  type="text"
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="e.g. Insurance Review - April 2026"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="space-y-4">
                {/* Selected covers */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-border">
                    <h4 className="text-sm font-semibold">Selected Covers</h4>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                          Cover Type
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                          Life Insured
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                          Sum Insured
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCovers.map((c) => (
                        <tr key={c.type} className="border-b border-border last:border-0">
                          <td className="px-4 py-2 font-medium">{c.type}</td>
                          <td className="px-4 py-2 text-muted-foreground">{c.owner}</td>
                          <td className="px-4 py-2 text-right">${c.amount}</td>
                          <td className="px-4 py-2 text-muted-foreground text-xs">
                            {c.type === 'Income Protection'
                              ? `Wait: ${c.waitingPeriod}, Benefit: ${c.benefitPeriod}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selected providers */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-border">
                    <h4 className="text-sm font-semibold">Selected Providers</h4>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                          Provider
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                          Product
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                          Annual Premium
                        </th>
                        <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProviders.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-2 font-medium">{p.name}</td>
                          <td className="px-4 py-2 text-muted-foreground">{p.product}</td>
                          <td className="px-4 py-2 text-right">
                            ${p.premium.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    i < p.rating ? 'bg-amber-400' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-gray-50">
          <div className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {COMPARISON_STEPS.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep > 0 && (
              <Button variant="outline" size="sm" className="gap-1" onClick={handleBack}>
                <ChevronLeft size={14} />
                Back
              </Button>
            )}
            {currentStep < COMPARISON_STEPS.length - 1 ? (
              <Button
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white gap-1"
                disabled={!canProceed}
                onClick={handleNext}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white gap-1"
                onClick={handleComplete}
              >
                <Check size={14} />
                Save Comparison
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
