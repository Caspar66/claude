# Scenarios Area — Assessment & Prototype Build Plan

**Target under review:** the `/scenarios` area of the deployed app (`https://claude-nu-kohl.vercel.app/scenarios`).
**Note on the live URL:** the Vercel deployment has Deployment Protection enabled (returns HTTP 403 to anonymous requests), so this assessment is written against the repository source — which is what that URL serves — rather than a scrape of the rendered page.

**Purpose of this document:** (1) assess the Scenario Modelling area as currently built, and (2) provide a phased build plan to recreate its screens and business logic as a Claude-designed prototype.

---

## PART 1 — ASSESSMENT

### 1.1 What the Scenarios area is

The Scenario Modelling area lets a financial adviser model advice "scenarios" for a client & partner. Each scenario captures a **current situation** (the accounts/platforms the household holds today) and one or more **proposals** (recommended changes — rollovers, switches, plan reviews). It is the advice-modelling half of the app; the other half is WealthSolver Research (`/research/*`), which supplies the product/plan catalogue this area reads from.

State is entirely **in-memory** via two React Context + `useReducer` stores (`AppContext` for scenarios, `WealthSolverContext` for the plan catalogue). There is no backend — data is seeded on load. This makes it well-suited to a self-contained prototype.

### 1.2 Screen inventory (11 routes)

| # | Route | Screen | Role |
|---|-------|--------|------|
| 1 | `/scenarios` | Scenario Index | List/create/delete/lock scenarios |
| 2 | `/scenarios/:id` | Scenario Details | Hub: personal details, current situation, proposals |
| 3 | `/scenarios/:id/plan/:platformId/edit` | Edit Existing Plan | Edit a platform's investments & balances |
| 4 | `/scenarios/:id/plan/:platformId/investments/add` | Add Investment | Add funds (catalogue search or manual entry) |
| 5 | `/scenarios/:id/plan/:platformId/fees` | Edit Fees | Fee editor (current-situation entry point) |
| 6 | `/scenarios/:id/proposals/:proposalId/fees/:platformId` | Edit Fees | Fee editor (proposal entry point, `?mode=proposed\|closing`) |
| 7 | `/scenarios/:id/add-existing` | Add Existing Plan | Plan catalogue picker (dual-mode: real add vs proposed) |
| 8 | `/scenarios/:id/add-proposal` | Add Proposal Type | Choose Plan Review vs Like-for-Like |
| 9 | `/scenarios/:id/proposals/plan-review/new` | Plan Review | Build a new plan-review proposal |
| 10 | `/scenarios/:id/proposals/plan-review/:proposalId` | Plan Review | Edit an existing plan-review proposal |

Scenario Details is the **hub**: every sub-flow's Cancel/Save returns to it.

### 1.3 Data model (the spine of the whole area)

```
ClientFile
 ├─ client, partner : PersonDetails { name, age, retirementDate, ordinaryWages }
 └─ scenarios : Scenario[]
      Scenario { id, name, created/lastChanged/implemented/locked: AdviserTimestamp,
                 isLocked, entities[], proposals[] }
       ├─ entities : Entity[]  (owner: Client | Partner | Joint, ownershipSplit?)
       │    └─ platforms : Platform[]  (Super | Investment | Pension | SMSF)
       │         ├─ balance, taxFreeBalance, otherBalancesClient/Family, hasWarning
       │         ├─ investments : Investment[] (amount, allocation%, cost fields, fundType)
       │         ├─ research? : PlatformResearch (rating, statusColor, documents)
       │         └─ wsPlanId?  → links to a WsPlan in WealthSolverContext
       └─ proposals : (Proposal | PlanReviewProposal)[]
            Proposal          { rows: ProposalRow[] (from→to platform, balance), status? }
            PlanReviewProposal{ kind:'plan-review', entries[] | entityReviews[], status? }
               PlanReviewEntry{ platform, recommendation, proposedInvestments[], proposedBalance }
```

**Two proposal shapes coexist** and the UI branches on them via the `isPlanReviewProposal` type guard:
- `Proposal` — simple from→to rows (rollover/switch style)
- `PlanReviewProposal` — richer; either single-entity (`entries`) or multi-entity/Joint (`entityReviews`)

`Recommendation` drives proposal math: `Hold | Close | Roll portion out | Switch/Rebalance | Roll portion in | Roll available balance in | New Plan`.

### 1.4 Business logic highlights (the parts worth getting right)

1. **Balance is derived, not stored independently.** `ADD_INVESTMENT`/`DELETE_INVESTMENT` recompute `platform.balance = Σ investments.amount`. Notably `UPDATE_INVESTMENT` deliberately does *not* recompute.
2. **Proposed-balance rules** (Plan Review): `Hold → platform.balance`, `Close → 0`, otherwise `Σ proposedInvestments.amount`.
3. **Unallocated money** = `max(0, totalClosedBalance − totalAllocatedAboveBase)` — money freed by closing plans that hasn't been redeployed yet. Surfaced as an amber row and an "Add to plan" action that distributes proportionally.
4. **Like-for-Like generation:** for each account type with ≥2 plans, generate a proposal per candidate target: target gets `Roll available balance in` with investments scaled by `totalBalance / target.balance`; all others get `Close`.
5. **Asset-allocation current-vs-proposed:** weight each investment's allocation % by its amount, normalize to totals, and show Existing / Proposed / Variance rows (variance colour-coded).
6. **Local-reducer isolation:** Plan Review uses its own `useReducer` for the in-progress edit (with snapshot/undo) and only commits to `AppContext` on Save — a clean transactional-edit pattern.
7. **Dual-mode Add Existing Plan:** the same catalogue screen either adds a real platform (`ADD_PLATFORM` → edit) or acts as a picker that round-trips a `?addPlan=` back into Plan Review.

### 1.5 State & reducer surface

`AppContext` exposes **17 actions**: `SET_ACTIVE_SCENARIO`, `CREATE_SCENARIO`, `DELETE_SCENARIO`, `LOCK_SCENARIO`, `UPDATE_PLATFORM`, `ADD_INVESTMENT`, `DELETE_INVESTMENT`, `UPDATE_INVESTMENT`, `ADD_PLATFORM`, `DELETE_PLATFORM`, `RENAME_PROPOSAL`, `DELETE_PROPOSAL`, `COPY_PROPOSAL`, `ADD_PROPOSAL_ANY`, `UPDATE_PLAN_REVIEW_PROPOSAL`, `UPDATE_ENTITY_PLAN_REVIEW`, `SET_PROPOSAL_STATUS`. All mutations are immutable spreads; a shared `patchPlatformInScenario` helper handles the nested platform update.

### 1.6 Maturity — what works vs. what's a placeholder

**Fully functional:** scenario CRUD, lock/unlock, current-situation display & edit, add/remove/adjust investments (catalogue + manual), balances/aggregation edit, add existing plan (both modes), add proposal (Plan Review + Like-for-Like), the full Plan Review editor (recommendations, proposed amounts, unallocated redeployment, asset-allocation comparison), proposal rename/copy/delete/status, fee editor entry points.

**Intentional placeholders (no handler / "coming soon"):** Scenario Details "Actions" menu (Fact Find, Recommendation Reason, Insurance Needs, Quick Merge, Compliance), index Copy/Document icons, PlatformRow "Report", Edit-Plan stub tabs (Contribution Amounts, Pension Details, Insurance Premiums, Research Notes, Fee Research), Plan Review "Performance History"/"Fee Comparison" tabs and "Transfer/Transactional cost" rows ($0.00 stubs), "Insurance Review", "Replacement Advice", "Combine proposals".

**Behavioural notes to preserve or fix in a rebuild:**
- Prev/Next on Details uses **array order**, while the index table sorts a **copy** — orderings can diverge.
- `DELETE_SCENARIO`/`LOCK_SCENARIO` have no confirm; `DELETE_PLATFORM`/`DELETE_PROPOSAL` use `window.confirm`.
- New timestamps hardcode adviser `'Satchell, Aron'`; currency is AUD with **no decimals**; dates are `dd/mm/yyyy` (en-AU).
- `COPY_PROPOSAL` copies `entries`/`entityReviews` by reference (spread) for plan-review proposals — a latent shared-reference bug to fix on rebuild.

---

## PART 2 — PROTOTYPE BUILD PLAN

Goal: recreate the Scenarios area as a Claude-designed prototype. The plan is phased so each phase is independently demoable. Assumes a React + client-side-router + in-memory-store stack (adaptable to a single artifact if reducers and views are inlined).

### Tech & conventions to lock first
- **State:** two reducers — `AppContext` (scenarios) and `WealthSolverContext` (plan catalogue, read-only from this area). Keep them separate; the platform↔plan link is `Platform.wsPlanId → WsPlan.id`.
- **Formatting:** `formatCurrency` = AUD, 0 decimals; `formatDate` = en-AU `dd/mm/yyyy`; `fmtPct` = 2 dp for integers else 4 dp, strip trailing zeros.
- **Seed data:** ~10 scenarios, an investment catalogue (~15 funds with allocation/costs/past-performance), platform templates (HUB24 Super, PortfolioCare, etc.), client/partner details.
- **Design language:** teal-700 section headers, zebra-striped tables, right-aligned currency, amber warning affordances, collapsible cards.

### Phase 0 — Foundations
**Build:** domain types (`domain.ts`), both context reducers with all actions, seed data, formatting helpers, `AppShell` layout (header + left nav) and the 10 routes as empty shells.
**Acceptance:** app boots to `/scenarios`; store is populated; navigating between empty routes works.
**Depends on:** nothing.

### Phase 1 — Scenario Index (Screen 1)
**Build:** `ScenarioSelectionPanel` (create), `ScenarioTable` (sortable columns, zebra rows, Actions cell with delete/edit/lock + visual-only copy/document, locked tag, empty state).
**Logic:** `CREATE_SCENARIO` (new id, today's timestamps), `DELETE_SCENARIO`, `LOCK_SCENARIO` toggle; client-side sort of a copied array by column.
**Acceptance:** create/delete/lock work; sorting flips direction; row/name click → details.
**Depends on:** Phase 0.

### Phase 2 — Scenario Details hub (Screen 2, read-only sections)
**Build:** `ScenarioDetailsPage` (prev/next nav, not-found guard, static badges, Actions dropdown as placeholders), `PersonalDetailsSection`, `CurrentSituationSection` with `EntityGroup`/`PlatformRow` (collapsible entity groups, per-entity totals, platform dropdown, remove-plan confirm, Plan Research modal), `ProposalsSection` scaffolding (tabs + `UnifiedProposalTable` render of existing proposals).
**Logic:** entity ordering `[Client, Partner, Joint]`; entity totals; `getEntityData` to flatten both proposal shapes into a unified table; `DELETE_PLATFORM`; proposal status/rename/copy/delete.
**Acceptance:** a seeded scenario renders fully; platforms expand/collapse; proposals display in tabs; remove-plan works with confirm.
**Depends on:** Phase 1.

### Phase 3 — Current-situation editing (Screens 3 & 4)
**Build:** `EditExistingPlanPage` (tabs: Investment Funds + Balances/Aggregation + 3 stub tabs), `InvestmentFundsTab` (live-editing amounts, delete, add), `BalancesAggregationTab` (tax-free & aggregation balances), `AddInvestmentPage` with `InvestmentSearchPanel` (catalogue search, SMA styling) and `ManualFundEntryPanel` (name/costs + growth/defensive/other allocation with live totals), `InvestmentDetailsDialog`.
**Logic:** live `UPDATE_PLATFORM` on amount edits with recomputed balance; `ADD_INVESTMENT`/`DELETE_INVESTMENT` (balance recompute in reducer); catalogue = plan-specific (via `wsPlanId → WsPlan.investmentOptions`, mapped by `wsOptionToCatalogueItem`) falling back to global seed; manual allocation record keeps only `>0` fields.
**Acceptance:** editing amounts updates totals/balance immediately; adding from catalogue and manually both persist and return to the plan.
**Depends on:** Phase 2.

### Phase 4 — Add Existing Plan catalogue (Screen 7)
**Build:** `AddExistingPlanPage` with `FilterPanel` (keyword, plan type, subtype, manager, sort, 24 advanced feature checkboxes, min-investment-options), star-rating rows, closed-for-business dot.
**Logic:** read `WealthSolverContext.plans`, map WS types → UI plan types, filter+sort pipeline; **dual mode** — `ADD_PLATFORM` (+ seed cash holding) → edit route, OR proposed mode round-tripping `?addPlan=` back to Plan Review.
**Acceptance:** filters narrow the list; selecting in normal mode creates a platform and opens its editor; selecting in proposed mode returns to Plan Review with the plan added.
**Depends on:** Phase 3 (edit route) and a seeded plan catalogue.

### Phase 5 — Proposals: Add Proposal + Plan Review (Screens 8, 9, 10)
**Build:** `AddProposalTypePage` (Plan Review & Like-for-Like cards with filter tabs); `PlanReviewPage` with its **local `useReducer`** and three sub-views — main list (recommendation selects, proposed balances, unallocated row, asset-allocation table), Edit Plan panel (proposed amounts, %, fees, net, unallocated "Add to plan"), and an in-page Add Investment panel.
**Logic:** `buildInitialEntries` (new vs edit vs `addPlan`); `computeProposedBalance`, `unallocatedAmount`, proportional distribution for `Roll available balance in`/`Add to plan`; snapshot/undo; asset-allocation weighting & variance; **Like-for-Like** generation (scale factor, target `Roll available balance in`, others `Close`); commit on Save via `ADD_PROPOSAL_ANY` / `UPDATE_PLAN_REVIEW_PROPOSAL` / `UPDATE_ENTITY_PLAN_REVIEW`; add-Joint proposal built client-side in `ProposalsSection`.
**Acceptance:** create a Plan Review from scratch, change recommendations, redeploy unallocated funds, see asset-allocation variance, Save and see it back on Details; Like-for-Like produces correct consolidations.
**Depends on:** Phases 2 & 4.

### Phase 6 — Fees & polish (Screens 5 & 6)
**Build:** wire the Edit Fees entry points from both current-situation and proposal contexts (the fee editor logic itself is documented separately in `docs/edit-fees-logic-breakdown.md`); tidy warnings, confirms, and any placeholder tabs you choose to promote.
**Acceptance:** fee editor opens with correct context (`?mode=proposed|closing`) and returns to the hub.
**Depends on:** Phase 5.

### Build sequence (dependency graph)
```
Phase 0 ─▶ Phase 1 ─▶ Phase 2 ─▶ Phase 3 ─▶ Phase 4 ─▶ Phase 5 ─▶ Phase 6
                         │                     ▲          ▲
                         └──── plan catalogue ─┴──────────┘
```

### Business-logic reference (implement exactly)
- **Platform balance:** `Σ investments.amount` (recompute on add/delete; not on plain update).
- **Proposed balance:** `Hold→balance`, `Close→0`, else `Σ proposedInvestments.amount`.
- **Unallocated:** `max(0, Σ closedBalances − Σ max(0, proposedBalance − platformBalance) over non-Close/non-Hold)`.
- **Proportional redeploy:** distribute `amount` across proposed investments weighted by current amounts.
- **Like-for-Like scale:** `scaleFactor = totalBalance / target.balance` (guard `target.balance>0`, else 1).
- **Asset-allocation:** per investment, `amount × pct/100` into named buckets; normalize by total; variance = proposed − existing.

### Prototype-specific guidance
- **Scope the placeholders out** of v1 (see §1.6) — build them as visible-but-disabled to match the real app's feel without the work.
- **Keep the two-store split**; it mirrors the real separation of advice modelling vs product research and keeps the catalogue reusable.
- **Preserve the transactional edit pattern** in Plan Review (local reducer + commit-on-save) — it's the cleanest part of the design and demos well (undo included).
- **Fix on rebuild:** deep-clone entries in `COPY_PROPOSAL`; unify index/Details ordering; add confirms consistently.
- If targeting a single Claude artifact, inline the reducers and seed, and use hash-based routing or a `view` state machine instead of a router — the screen/logic contract above is unchanged.

---

## Appendix — file map of the current implementation (reference for parity)
- Index: `src/views/ScenarioIndex/{ScenarioIndexPage,ScenarioSelectionPanel,ScenarioTable}.tsx`
- Details: `src/views/ScenarioDetails/{ScenarioDetailsPage,PersonalDetailsSection,CurrentSituationSection,PlatformRow,ProposalsSection}.tsx`
- Edit plan: `src/views/EditExistingPlan/{EditExistingPlanPage,InvestmentFundsTab,BalancesAggregationTab,InvestmentDetailsDialog}.tsx`
- Add investment: `src/views/AddInvestment/{AddInvestmentPage,InvestmentSearchPanel,ManualFundEntryPanel}.tsx`
- Add existing plan: `src/views/AddExistingPlan/AddExistingPlanPage.tsx`
- Add proposal: `src/views/AddProposal/AddProposalTypePage.tsx`
- Plan review: `src/views/PlanReview/PlanReviewPage.tsx`
- State/types/data: `src/context/AppContext.tsx`, `src/types/domain.ts`, `src/data/{seed,planCatalogue}.ts`
- Fee editor (separate doc): `docs/edit-fees-logic-breakdown.md`
