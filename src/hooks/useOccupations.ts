import { useEffect, useState } from 'react';
import { fetchOccupations } from '@/services/omnilifeApi';
import type { OccupationOption } from '@/services/omnilifeApi';

interface State {
  options: OccupationOption[];
  loading: boolean;
  error: string | null;
}

let cache: OccupationOption[] | null = null;
let inflight: Promise<OccupationOption[]> | null = null;

export function useOccupations(): State {
  const [state, setState] = useState<State>(() => ({
    options: cache ?? [],
    loading: cache === null,
    error: null,
  }));

  useEffect(() => {
    if (cache) {
      setState({ options: cache, loading: false, error: null });
      return;
    }

    let cancelled = false;
    if (!inflight) {
      inflight = fetchOccupations()
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
        setState({ options: list, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ options: [], loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
