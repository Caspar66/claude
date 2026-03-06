import { useState } from 'react';
import { Link } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { Platform } from '@/types/domain';

interface Props {
  scenarioId: string;
  platform: Platform;
}

interface BalanceRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  withLink?: boolean;
  note?: string;
}

function BalanceRow({ label, value, onChange, readOnly, withLink, note }: BalanceRowProps) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-border last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {note && <div className="text-xs text-blue-600 hover:underline cursor-pointer mt-0.5">{note}</div>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {withLink && <Link size={13} className="text-muted-foreground" />}
        {readOnly ? (
          <div className="text-sm font-medium tabular-nums w-36 text-right">{value}</div>
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 text-right text-sm w-36"
          />
        )}
      </div>
    </div>
  );
}

export function BalancesAggregationTab({ scenarioId, platform }: Props) {
  const { dispatch } = useAppContext();

  const [taxFree, setTaxFree] = useState(String(platform.taxFreeBalance ?? 0));
  const [otherClient, setOtherClient] = useState(String(platform.otherBalancesClient ?? 0));
  const [otherFamily, setOtherFamily] = useState(String(platform.otherBalancesFamily ?? 0));

  function commitField(field: keyof Platform, rawVal: string) {
    const n = parseFloat(rawVal.replace(/[^0-9.]/g, ''));
    if (!isNaN(n)) {
      dispatch({ type: 'UPDATE_PLATFORM', scenarioId, platformId: platform.id, patch: { [field]: n } });
    }
  }

  return (
    <div className="px-6 py-4 max-w-2xl">
      <BalanceRow
        label="Account Balance"
        value={formatCurrency(platform.balance)}
        onChange={() => {}}
        readOnly
      />

      <BalanceRow
        label="Tax-free Balance"
        value={taxFree}
        onChange={(v) => setTaxFree(v)}
        readOnly={false}
      />

      <div className="mt-4 mb-2 text-sm font-semibold text-muted-foreground">
        Other Balances for fee aggregation purposes
      </div>

      <BalanceRow
        label="Total balance of other accounts held by the client"
        value={otherClient}
        onChange={(v) => setOtherClient(v)}
        withLink
        note="Includes superannuation, pension and investment accounts"
      />

      <BalanceRow
        label="Total balance of other accounts held by family group members"
        value={otherFamily}
        onChange={(v) => setOtherFamily(v)}
        withLink
        note="Family group members include spouse, children, and dependants"
      />

      <div className="mt-4 flex gap-2">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => {
            commitField('taxFreeBalance', taxFree);
            commitField('otherBalancesClient', otherClient);
            commitField('otherBalancesFamily', otherFamily);
          }}
        >
          Apply changes
        </button>
      </div>
    </div>
  );
}
