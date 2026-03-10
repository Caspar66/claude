// Shared components used across WealthSolver views

import { useState } from 'react';
import type { ReactNode } from 'react';

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= rating ? '#f59e0b' : 'none'} stroke={i <= rating ? '#f59e0b' : '#d1d5db'} strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export function YN({ value }: { value: boolean }) {
  return (
    <span className={value ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

export function ColHead({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded mb-3">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-700 to-teal-600 rounded-t"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${open ? '' : 'rotate-180'}`}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      {open && <div className="divide-y divide-border">{children}</div>}
    </div>
  );
}

export function DRow({ label, value, changed }: { label: string; value: ReactNode; changed?: boolean }) {
  return (
    <div className="flex items-start px-4 py-1.5 even:bg-gray-50 text-sm">
      <span className="w-48 flex-shrink-0 text-muted-foreground text-xs">
        {label}
        {changed && <span className="text-red-600 ml-0.5">✱</span>}
      </span>
      <span className="flex-1 text-xs">{value}</span>
    </div>
  );
}

export function SecLabel({ label }: { label: string }) {
  return (
    <div className="px-4 py-1 bg-gray-100 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {label}
    </div>
  );
}

export function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-AU')}`;
}

export function fmtPct(n: number | null | undefined, decimals = 2) {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(decimals)}%`;
}

export function fmtAssets(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}
