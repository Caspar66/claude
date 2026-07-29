import { useEffect, useState } from 'react';
import { fetchLegacySuppliers } from '@/services/omnilifeApi';
import type { LegacySupplier } from '@/services/omnilifeApi';

interface State {
  suppliers: LegacySupplier[];
  loading: boolean;
  error: string | null;
}

let cache: LegacySupplier[] | null = null;
let inflight: Promise<LegacySupplier[]> | null = null;

export function useLegacySuppliers(): State {
  const [state, setState] = useState<State>(() => ({
    suppliers: cache ?? [],
    loading: cache === null,
    error: null,
  }));

  useEffect(() => {
    if (cache) {
      setState({ suppliers: cache, loading: false, error: null });
      return;
    }

    let cancelled = false;
    if (!inflight) {
      inflight = fetchLegacySuppliers()
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
        setState({ suppliers: list, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ suppliers: [], loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
