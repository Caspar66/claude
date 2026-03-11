import React, { createContext, useContext, useReducer } from 'react';
import type { ClientFile, Platform, Investment, Scenario, Proposal, PlanReviewProposal, PlanReviewEntry, EntityOwner, ProposalStatus } from '@/types/domain';
import { isPlanReviewProposal } from '@/types/domain';
import { clientFile as seedData } from '@/data/seed';

interface AppState {
  clientFile: ClientFile;
  activeScenarioId: string | null;
}

type Action =
  | { type: 'CREATE_SCENARIO'; name: string }
  | { type: 'DELETE_SCENARIO'; id: string }
  | { type: 'LOCK_SCENARIO'; id: string }
  | { type: 'SET_ACTIVE_SCENARIO'; id: string }
  | { type: 'UPDATE_PLATFORM'; scenarioId: string; platformId: string; patch: Partial<Platform> }
  | { type: 'ADD_INVESTMENT'; scenarioId: string; platformId: string; investment: Investment }
  | { type: 'DELETE_INVESTMENT'; scenarioId: string; platformId: string; investmentId: string }
  | { type: 'UPDATE_INVESTMENT'; scenarioId: string; platformId: string; investment: Investment }
  | { type: 'ADD_PLATFORM'; scenarioId: string; entityOwner: import('@/types/domain').EntityOwner; platform: Platform }
  | { type: 'DELETE_PLATFORM'; scenarioId: string; platformId: string }
  | { type: 'RENAME_PROPOSAL'; scenarioId: string; proposalId: string; label: string }
  | { type: 'DELETE_PROPOSAL'; scenarioId: string; proposalId: string }
  | { type: 'COPY_PROPOSAL'; scenarioId: string; proposalId: string; newLabel: string }
  | { type: 'ADD_PROPOSAL_ANY'; scenarioId: string; proposal: Proposal | PlanReviewProposal }
  | { type: 'UPDATE_PLAN_REVIEW_PROPOSAL'; scenarioId: string; proposal: PlanReviewProposal }
  | { type: 'UPDATE_ENTITY_PLAN_REVIEW'; scenarioId: string; proposalId: string; entityOwner: EntityOwner; entries: PlanReviewEntry[] }
  | { type: 'SET_PROPOSAL_STATUS'; scenarioId: string; proposalId: string; status: ProposalStatus };

function patchPlatformInScenario(scenario: Scenario, platformId: string, patch: Partial<Platform>): Scenario {
  return {
    ...scenario,
    entities: scenario.entities.map((entity) => ({
      ...entity,
      platforms: entity.platforms.map((p) =>
        p.id === platformId ? { ...p, ...patch } : p
      ),
    })),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_SCENARIO':
      return { ...state, activeScenarioId: action.id };

    case 'CREATE_SCENARIO': {
      const newScenario: Scenario = {
        id: `scenario-${Date.now()}`,
        name: action.name,
        created: { date: new Date().toISOString().slice(0, 10), adviser: 'Satchell, Aron' },
        lastChanged: { date: new Date().toISOString().slice(0, 10), adviser: 'Satchell, Aron' },
        isLocked: false,
        entities: [],
        proposals: [],
      };
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: [...state.clientFile.scenarios, newScenario],
        },
      };
    }

    case 'DELETE_SCENARIO':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.filter((s) => s.id !== action.id),
        },
      };

    case 'LOCK_SCENARIO':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) =>
            s.id === action.id
              ? {
                  ...s,
                  isLocked: !s.isLocked,
                  locked: !s.isLocked
                    ? { date: new Date().toISOString().slice(0, 10), adviser: 'Satchell, Aron' }
                    : undefined,
                }
              : s
          ),
        },
      };

    case 'UPDATE_PLATFORM':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) =>
            s.id === action.scenarioId
              ? patchPlatformInScenario(s, action.platformId, action.patch)
              : s
          ),
        },
      };

    case 'ADD_INVESTMENT':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) => {
            if (s.id !== action.scenarioId) return s;
            const platform = s.entities.flatMap((e) => e.platforms).find((p) => p.id === action.platformId);
            const investments = [...(platform?.investments ?? []), action.investment];
            const balance = investments.reduce((sum, inv) => sum + inv.amount, 0);
            return patchPlatformInScenario(s, action.platformId, { investments, balance });
          }),
        },
      };

    case 'DELETE_INVESTMENT':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) => {
            if (s.id !== action.scenarioId) return s;
            const platform = s.entities.flatMap((e) => e.platforms).find((p) => p.id === action.platformId);
            if (!platform) return s;
            const investments = platform.investments.filter((inv) => inv.id !== action.investmentId);
            const balance = investments.reduce((sum, inv) => sum + inv.amount, 0);
            return patchPlatformInScenario(s, action.platformId, { investments, balance });
          }),
        },
      };

    case 'UPDATE_INVESTMENT':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) => {
            if (s.id !== action.scenarioId) return s;
            const platform = s.entities.flatMap((e) => e.platforms).find((p) => p.id === action.platformId);
            if (!platform) return s;
            return patchPlatformInScenario(s, action.platformId, {
              investments: platform.investments.map((inv) =>
                inv.id === action.investment.id ? action.investment : inv
              ),
            });
          }),
        },
      };

    case 'DELETE_PLATFORM':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) => {
            if (s.id !== action.scenarioId) return s;
            return {
              ...s,
              entities: s.entities.map((e) => ({
                ...e,
                platforms: e.platforms.filter((p) => p.id !== action.platformId),
              })),
            };
          }),
        },
      };

    case 'ADD_PLATFORM': {
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) => {
            if (s.id !== action.scenarioId) return s;
            const hasEntity = s.entities.some((e) => e.owner === action.entityOwner);
            if (hasEntity) {
              return {
                ...s,
                entities: s.entities.map((e) =>
                  e.owner === action.entityOwner
                    ? { ...e, platforms: [...e.platforms, action.platform] }
                    : e
                ),
              };
            }
            return {
              ...s,
              entities: [
                ...s.entities,
                {
                  id: `entity-${action.entityOwner.toLowerCase()}-${Date.now()}`,
                  owner: action.entityOwner,
                  platforms: [action.platform],
                },
              ],
            };
          }),
        },
      };
    }

    case 'ADD_PROPOSAL_ANY':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) =>
            s.id !== action.scenarioId ? s : {
              ...s,
              proposals: [...s.proposals, action.proposal],
            }
          ),
        },
      };

    case 'UPDATE_PLAN_REVIEW_PROPOSAL':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) =>
            s.id !== action.scenarioId ? s : {
              ...s,
              proposals: s.proposals.map((p) =>
                p.id === action.proposal.id ? action.proposal : p
              ),
            }
          ),
        },
      };

    case 'UPDATE_ENTITY_PLAN_REVIEW':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) =>
            s.id !== action.scenarioId ? s : {
              ...s,
              proposals: s.proposals.map((p) => {
                if (p.id !== action.proposalId || !isPlanReviewProposal(p) || !p.entityReviews) return p;
                return {
                  ...p,
                  entityReviews: p.entityReviews.map((er) =>
                    er.owner !== action.entityOwner ? er : { ...er, entries: action.entries }
                  ),
                };
              }),
            }
          ),
        },
      };

    case 'RENAME_PROPOSAL':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) =>
            s.id !== action.scenarioId ? s : {
              ...s,
              proposals: s.proposals.map((p) =>
                p.id === action.proposalId ? { ...p, label: action.label } : p
              ),
            }
          ),
        },
      };

    case 'SET_PROPOSAL_STATUS':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) =>
            s.id !== action.scenarioId ? s : {
              ...s,
              proposals: s.proposals.map((p) =>
                p.id === action.proposalId ? { ...p, status: action.status } : p
              ),
            }
          ),
        },
      };

    case 'DELETE_PROPOSAL':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) =>
            s.id !== action.scenarioId ? s : {
              ...s,
              proposals: s.proposals.filter((p) => p.id !== action.proposalId),
            }
          ),
        },
      };

    case 'COPY_PROPOSAL':
      return {
        ...state,
        clientFile: {
          ...state.clientFile,
          scenarios: state.clientFile.scenarios.map((s) => {
            if (s.id !== action.scenarioId) return s;
            const source = s.proposals.find((p) => p.id === action.proposalId);
            if (!source) return s;
            const rows = 'rows' in source
              ? source.rows.map((r) => ({ ...r, id: `${r.id}-copy-${Date.now()}` }))
              : [];
            const copy = { ...source, id: `proposal-copy-${Date.now()}`, label: action.newLabel, rows } as typeof source;
            return { ...s, proposals: [...s.proposals, copy] };
          }),
        },
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    clientFile: seedData,
    activeScenarioId: seedData.scenarios[0]?.id ?? null,
  });

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
