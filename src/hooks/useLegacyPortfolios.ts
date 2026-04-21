import { useEffect, useState } from 'react';
import { fetchLegacyPortfolios } from '@/services/omnilifeApi';
import type { LegacyPortfolio } from '@/services/omnilifeApi';

interface State {
  portfolios: LegacyPortfolio[];
  loading: boolean;
  error: string | null;
}

let cache: LegacyPortfolio[] | null = null;
let inflight: Promise<LegacyPortfolio[]> | null = null;

export function useLegacyPortfolios(): State {
  const [state, setState] = useState<State>(() => ({
    portfolios: cache ?? [],
    loading: cache === null,
    error: null,
  }));

  useEffect(() => {
    if (cache) {
      setState({ portfolios: cache, loading: false, error: null });
      return;
    }

    let cancelled = false;
    if (!inflight) {
      inflight = fetchLegacyPortfolios()
        .then((list) => {
          cache = list;
          return list;
        })
        .catch((err) => {
          inflight = null;
          throw err;
        });
    }

    inflight
      .then((list) => {
        if (cancelled) return;
        setState({ portfolios: list, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ portfolios: [], loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
