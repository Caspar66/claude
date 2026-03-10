import React, { createContext, useContext, useReducer } from 'react';
import type { WsPlan, WsInvestmentOption, WsFee, WsDocument, WealthSolverState } from '@/types/wealthsolver';
import { seedPlans, globalOptions } from '@/data/wealthsolverSeed';

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_PLAN'; plan: WsPlan }
  | { type: 'UPDATE_PLAN'; planId: string; patch: Partial<WsPlan>; changedFields?: string[] }
  | { type: 'UPDATE_PLAN_FEES'; planId: string; category: 'ongoing' | 'rebates' | 'transactional' | 'commissions'; fee: WsFee }
  | { type: 'ADD_INVESTMENT_OPTION'; planId: string; option: WsInvestmentOption }
  | { type: 'REMOVE_INVESTMENT_OPTION'; planId: string; optionId: string }
  | { type: 'UPDATE_INVESTMENT_OPTION'; planId: string; option: WsInvestmentOption }
  | { type: 'ADD_DOCUMENT'; planId: string; doc: WsDocument }
  | { type: 'REMOVE_DOCUMENT'; planId: string; docId: number }
  | { type: 'ADD_GLOBAL_OPTION'; option: WsInvestmentOption };

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: WealthSolverState, action: Action): WealthSolverState {
  switch (action.type) {
    case 'ADD_PLAN':
      return { ...state, plans: [...state.plans, action.plan] };

    case 'UPDATE_PLAN':
      return {
        ...state,
        plans: state.plans.map((p) => {
          if (p.id !== action.planId) return p;
          const changedFields = action.changedFields
            ? [...new Set([...(p.changedFields ?? []), ...action.changedFields])]
            : p.changedFields;
          return { ...p, ...action.patch, changedFields };
        }),
      };

    case 'UPDATE_PLAN_FEES':
      return {
        ...state,
        plans: state.plans.map((p) => {
          if (p.id !== action.planId) return p;
          return {
            ...p,
            fees: {
              ...p.fees,
              [action.category]: p.fees[action.category].map((f) =>
                f.xplanId === action.fee.xplanId ? action.fee : f
              ),
            },
          };
        }),
      };

    case 'ADD_INVESTMENT_OPTION':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id !== action.planId
            ? p
            : { ...p, investmentOptions: [...p.investmentOptions, action.option] }
        ),
      };

    case 'REMOVE_INVESTMENT_OPTION':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id !== action.planId
            ? p
            : { ...p, investmentOptions: p.investmentOptions.filter((o) => o.id !== action.optionId) }
        ),
      };

    case 'UPDATE_INVESTMENT_OPTION':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id !== action.planId
            ? p
            : {
                ...p,
                investmentOptions: p.investmentOptions.map((o) =>
                  o.id === action.option.id ? action.option : o
                ),
              }
        ),
      };

    case 'ADD_DOCUMENT':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id !== action.planId ? p : { ...p, documents: [...p.documents, action.doc] }
        ),
      };

    case 'REMOVE_DOCUMENT':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id !== action.planId
            ? p
            : { ...p, documents: p.documents.filter((d) => d.id !== action.docId) }
        ),
      };

    case 'ADD_GLOBAL_OPTION':
      return { ...state, globalOptions: [...state.globalOptions, action.option] };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface WealthSolverContextValue {
  state: WealthSolverState;
  dispatch: React.Dispatch<Action>;
}

const WealthSolverContext = createContext<WealthSolverContextValue | null>(null);

export function WealthSolverProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    plans: seedPlans,
    globalOptions,
  });
  return (
    <WealthSolverContext.Provider value={{ state, dispatch }}>
      {children}
    </WealthSolverContext.Provider>
  );
}

export function useWealthSolver(): WealthSolverContextValue {
  const ctx = useContext(WealthSolverContext);
  if (!ctx) throw new Error('useWealthSolver must be used within WealthSolverProvider');
  return ctx;
}
