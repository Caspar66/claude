import React, { createContext, useContext, useReducer } from 'react';
import type { WsPlan, WsInvestmentOption, WsFee, WsDocument, WealthSolverState } from '@/types/wealthsolver';
import { seedPlans, globalOptions } from '@/data/wealthsolverSeed';

// ── Actions ───────────────────────────────────────────────────────────────────

type FeeCategory = 'ongoing' | 'rebates' | 'transactional' | 'commissions';

type Action =
  | { type: 'ADD_PLAN'; plan: WsPlan }
  | { type: 'UPDATE_PLAN'; planId: string; patch: Partial<WsPlan>; changedFields?: string[] }
  | { type: 'UPDATE_PLAN_FEES'; planId: string; category: FeeCategory; fee: WsFee }
  | { type: 'OVERRIDE_DERIVED_PLAN_FEE'; planId: string; category: FeeCategory; feeId: string; override: WsFee }
  | { type: 'UNDO_DERIVED_PLAN_FEE_OVERRIDE'; planId: string; category: FeeCategory; feeId: string }
  | { type: 'ADD_INVESTMENT_OPTION'; planId: string; option: WsInvestmentOption }
  | { type: 'REMOVE_INVESTMENT_OPTION'; planId: string; optionId: string }
  | { type: 'UPDATE_INVESTMENT_OPTION'; planId: string; option: WsInvestmentOption }
  | { type: 'ADD_DOCUMENT'; planId: string; doc: WsDocument }
  | { type: 'REMOVE_DOCUMENT'; planId: string; docId: number }
  | { type: 'ADD_GLOBAL_OPTION'; option: WsInvestmentOption };

// ── Reducer ───────────────────────────────────────────────────────────────────

function updateFeeInCategory(fees: WsFee[], fee: WsFee): WsFee[] {
  return fees.map((f) => (f.xplanId === fee.xplanId ? fee : f));
}

function propagateFeeToCategory(fees: WsFee[], fee: WsFee): WsFee[] {
  return fees.map((f) => {
    if (f.xplanId !== fee.xplanId) return f;
    if (f.overrideFee) return f; // preserve override, don't propagate
    return { ...fee, overrideFee: undefined };
  });
}

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
      // Update source plan fee and propagate to derived plans (unless they have an override)
      return {
        ...state,
        plans: state.plans.map((p) => {
          if (p.id === action.planId) {
            return {
              ...p,
              fees: {
                ...p.fees,
                [action.category]: updateFeeInCategory(p.fees[action.category], action.fee),
              },
            };
          }
          // Propagate to derived plans
          if (p.derivedFromId === action.planId) {
            return {
              ...p,
              fees: {
                ...p.fees,
                [action.category]: propagateFeeToCategory(p.fees[action.category], action.fee),
              },
            };
          }
          return p;
        }),
      };

    case 'OVERRIDE_DERIVED_PLAN_FEE':
      return {
        ...state,
        plans: state.plans.map((p) => {
          if (p.id !== action.planId) return p;
          return {
            ...p,
            fees: {
              ...p.fees,
              [action.category]: p.fees[action.category].map((f) =>
                f.xplanId === action.feeId ? { ...f, overrideFee: action.override } : f
              ),
            },
          };
        }),
      };

    case 'UNDO_DERIVED_PLAN_FEE_OVERRIDE':
      return {
        ...state,
        plans: state.plans.map((p) => {
          if (p.id !== action.planId) return p;
          return {
            ...p,
            fees: {
              ...p.fees,
              [action.category]: p.fees[action.category].map((f) =>
                f.xplanId === action.feeId ? { ...f, overrideFee: undefined } : f
              ),
            },
          };
        }),
      };

    case 'ADD_INVESTMENT_OPTION': {
      const newOpt = action.option;
      return {
        ...state,
        plans: state.plans.map((p) => {
          if (p.id !== action.planId) return p;
          if (!newOpt.custom) {
            return { ...p, investmentOptions: [...p.investmentOptions, newOpt] };
          }
          // Custom option: assign to the default fee set for each fee,
          // unless the fee uses shareExchanges (exchange-based coverage).
          const assignToDefault = (fees: WsFee[]): WsFee[] =>
            fees.map((fee) => {
              const isOverridden = !!fee.overrideFee;
              const effectiveSets = isOverridden ? fee.overrideFee!.feeSets : fee.feeSets;
              const effectiveDefaultSetId = isOverridden
                ? fee.overrideFee!.defaultSetId
                : fee.defaultSetId;
              // Exchange-based fees cover options automatically; skip manual assignment
              const hasExchangeSets = effectiveSets.some(
                (s) => (s.shareExchanges ?? []).length > 0
              );
              if (hasExchangeSets) return fee;
              const updatedSets = effectiveSets.map((set) =>
                set.shortId === effectiveDefaultSetId
                  ? { ...set, investmentOptionIds: [...(set.investmentOptionIds ?? []), newOpt.id] }
                  : set
              );
              return isOverridden
                ? { ...fee, overrideFee: { ...fee.overrideFee!, feeSets: updatedSets } }
                : { ...fee, feeSets: updatedSets };
            });
          return {
            ...p,
            investmentOptions: [...p.investmentOptions, newOpt],
            fees: {
              ongoing: assignToDefault(p.fees.ongoing),
              rebates: assignToDefault(p.fees.rebates),
              transactional: assignToDefault(p.fees.transactional),
              commissions: assignToDefault(p.fees.commissions),
            },
          };
        }),
      };
    }

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
