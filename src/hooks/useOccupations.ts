import { useEffect, useState } from 'react';
import { fetchOccupations } from '@/services/omnilifeApi';
import type { OccupationOption } from '@/services/omnilifeApi';

// Fallback when the API can't be reached (CORS, offline, UAT down, etc.)
const FALLBACK_OCCUPATIONS: OccupationOption[] = [
  { code: '1P', label: '1P - Accounting Professionals' },
  { code: '1P', label: '1P - Actuarial Professionals' },
  { code: '2B', label: '2B - Clerical & Administration' },
  { code: '3A', label: '3A - Sales Representatives' },
  { code: '4A', label: '4A - Trades & Labour' },
];

interface State {
  options: OccupationOption[];
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
}

let cache: OccupationOption[] | null = null;
let inflight: Promise<OccupationOption[]> | null = null;

export function useOccupations(): State {
  const [state, setState] = useState<State>(() => ({
    options: cache ?? FALLBACK_OCCUPATIONS,
    loading: cache === null,
    error: null,
    usingFallback: cache === null,
  }));

  useEffect(() => {
    if (cache) {
      setState({ options: cache, loading: false, error: null, usingFallback: false });
      return;
    }

    let cancelled = false;
    if (!inflight) {
      inflight = fetchOccupations()
        .then((list) => {
          const result = list.length > 0 ? list : FALLBACK_OCCUPATIONS;
          cache = result;
          return result;
        })
        .catch((err) => {
          inflight = null;
          throw err;
        });
    }

    inflight
      .then((list) => {
        if (cancelled) return;
        setState({ options: list, loading: false, error: null, usingFallback: false });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({
          options: FALLBACK_OCCUPATIONS,
          loading: false,
          error: err.message,
          usingFallback: true,
        });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
