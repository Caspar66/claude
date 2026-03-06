import { formatCurrency } from '@/lib/utils';

export function CurrencyCell({ value }: { value: number }) {
  return <span className="font-mono text-right tabular-nums">{formatCurrency(value)}</span>;
}
