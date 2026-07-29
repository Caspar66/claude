import type { QuoteFormState } from './quoteFormTypes';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SavedQuoteSet {
  id: string;
  name: string;
  savedAt: string; // ISO date
  form: QuoteFormState;
}

// ── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'wealthsolver:savedQuoteSets';

// ── Persistence helpers ──────────────────────────────────────────────────────

export function loadSavedQuoteSets(): SavedQuoteSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedQuoteSet[];
  } catch {
    return [];
  }
}

export function persistSavedQuoteSets(sets: SavedQuoteSet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch {
    // storage full or unavailable — silently fail
  }
}

export function saveQuoteSet(name: string, form: QuoteFormState): SavedQuoteSet {
  const sets = loadSavedQuoteSets();
  const entry: SavedQuoteSet = {
    id: `qs-${Date.now()}`,
    name,
    savedAt: new Date().toISOString(),
    form: structuredClone(form),
  };
  sets.unshift(entry); // newest first
  persistSavedQuoteSets(sets);
  return entry;
}

export function deleteSavedQuoteSet(id: string): void {
  const sets = loadSavedQuoteSets().filter((s) => s.id !== id);
  persistSavedQuoteSets(sets);
}

// ── Auto-name generator ──────────────────────────────────────────────────────

export function generateQuoteName(form: QuoteFormState): string {
  const parts: string[] = [];
  const li = form.lifeInsured;
  parts.push(li.gender === 'Male' ? 'M' : 'F');
  parts.push(`Age${li.ageNextBirthday}`);
  parts.push(li.state.slice(0, 3));

  const covers: string[] = [];
  if (form.termLife.sumInsured) covers.push('Life');
  if (form.tpdExtension.sumInsured) covers.push('TPD');
  if (form.traumaExtension.sumInsured) covers.push('Trauma');
  if (form.incomeProtection.monthlyBenefit) covers.push('IP');
  if (form.businessExpenses.sumInsured) covers.push('BE');
  if (covers.length > 0) parts.push(covers.join('+'));

  const now = new Date();
  const ts = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  parts.push(ts);

  return parts.join(' — ');
}

// ── Dirty state detection ────────────────────────────────────────────────────

export function isFormDirty(current: QuoteFormState, saved: QuoteFormState | null): boolean {
  if (!saved) return true; // no saved baseline means always "unsaved"
  return JSON.stringify(current) !== JSON.stringify(saved);
}
