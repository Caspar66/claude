# WealthSolver — Investment Research: Prototype Handoff

This document captures the complete workflow logic, data model, and interaction patterns for the **WealthSolver Investment Research** section. Its purpose is to give a developer enough context to recreate this as a standalone prototype without reading the source code.

---

## 1. Overview

WealthSolver is a tool for financial advisers to manage and research investment platforms (Super funds, Pension accounts, Investment Platforms). The Research section covers two concerns:

1. **Plan Research** — Browse, create, edit, and derive investment platform "plans". Each plan holds its fee structures, investment option assignments, and product documentation.
2. **Investment Data** — A global library of investment options (funds) that can be linked to plans.

The system is built in React with a single Context/Reducer store (`WealthSolverContext`). All plan data lives in memory; there is no backend.

### Route map

```
/research/plans                          List of all plans
/research/plans/new                      Create new plan
/research/plans/:planId                  Plan detail (read-only + sub-views via ?mode=)
/research/plans/:planId/derive           Create a derived copy of a plan
/research/investment-data                Global investment options library
```

Sub-views on the detail page are controlled by a `?mode=` query param — no route change:

| `?mode=`             | Sub-view loaded         |
|----------------------|-------------------------|
| *(none)*             | Read-only plan overview |
| `editResearch`       | Edit plan metadata      |
| `editFees`           | Fee management          |
| `editDocuments`      | Document upload/removal |
| `investmentOptions`  | Investment option CRUD  |

---

## 2. User Workflow

### 2.1 Plan List (`/research/plans`)

**What the user sees:**
- Left sidebar with filter controls
- Main area: table of all plans

**Table columns:** Product Name · Manager · Type · Subtype · Rating (1–5 stars) · Open for Business (Yes/No, coloured green/red)

**Filter sidebar controls:**
| Control | Options |
|---------|---------|
| Search | Free text (filters by plan name) |
| Plan Type | All / Investment Platform / Super / Pension |
| Plan Manager | All + dynamic list from data |
| Open for New Business | All / Yes / No |
| Sort | A-Z / Z-A / Rating High-Low / Rating Low-High |

**User actions:**
- Click any plan row → navigate to Plan Detail
- `+ Add Plan` button (top-right) → navigate to `/research/plans/new`

---

### 2.2 Add Plan (`/research/plans/new`)

A multi-section form to create a plan from scratch.

**Required field:** Name (must be unique across all plans)

**Sections:**

**Plan Information**
| Field | Type |
|-------|------|
| Name* | text input |
| Sort Name | text input |
| Manager | text input |
| ABN | text input |
| Plan Subtype | text input |
| Plan Type | dropdown: Investment Platform / Super / Pension |
| Rating | 0–5 star selector |
| Open for New Business | Yes / No |
| Iress SPIN | text input |
| Product SPIN | text input |
| USI | text input |
| TMD Status | text input |
| Created By | text input |
| Comments | textarea |
| General Description | textarea |

**Contributions** (8 checkboxes)
Employer SG · Employer Voluntary · Member Voluntary · Member Salary Sacrifice · Spouse · Government Co-Contribution · Rollover · Downsizer

**Payment Facilities** (6 checkboxes)
BPAY · Direct Debit · Cheque · EFT · Credit Card · EFTPOS

**Investment Rules** (6 dollar inputs)
Min Initial · Min One-Off · Min Regular Contrib · Min One-Off Withdrawal · Min Regular Withdrawal · Min Balance

**Actions:**
- Save → dispatches `ADD_PLAN`, navigates to new plan's detail page
- Cancel → returns to plan list

---

### 2.3 Plan Detail (`/research/plans/:planId`)

Read-only overview with collapsible sections. An **Edit** dropdown menu in the top-right switches the view via `?mode=`.

**If plan is derived:** blue info banner shows the source plan name with a link.

**Collapsible sections:**
1. **Product Overview** — Name, SPIN, USI, Iress SPIN, Subtype, Open for Business, linked documents, TMD Status, Created By, Comments, Description
2. **Product Details** — Contributions (8 fields), Payment Facilities (6 fields), Investment Rules (6 $ fields)
3. **Investment Options** — summary table (Name, APIR, Invest Fees %, Perf Fee %, Trans Cost %)
4. **Fees Overview** — summary by category (Ongoing Costs, Rebates, Transactional Costs, Commission Details)

**Edit menu options:**
- **Edit Research** → `?mode=editResearch`
- **Edit Fees** → `?mode=editFees`
- **Edit Product Documents** → `?mode=editDocuments`
- **Derive Plan** (only for non-derived plans) → `/research/plans/:planId/derive`

**Changed field tracking:** Fields modified via Edit Research show a red `*` asterisk next to the value in the read-only view. The `changedFields: string[]` array on the plan tracks which field keys have been changed.

---

### 2.4 Edit Research (`?mode=editResearch`)

Same layout as Add Plan but pre-populated. Newly changed fields show a red `*` in real time.

- Save → `UPDATE_PLAN` with a `changedFields` array, navigates back to detail
- Cancel → back to detail

---

### 2.5 Edit Documents (`?mode=editDocuments`)

Two areas:

**Existing documents table**
- Columns: Name (teal link) · Type · Remove (×)
- Remove dispatches `REMOVE_DOCUMENT`

**Upload section**
- File picker button
- Type dropdown (see `DOCUMENT_TYPES` constant)
- Upload button (disabled until file selected) → `ADD_DOCUMENT` with `{ id: Date.now(), name, type, size }`

---

### 2.6 Edit Fees (`?mode=editFees`)

Two-level view: **Fee List Page** → **Fee Edit Page** (navigated by clicking the pencil icon on a fee row).

#### 2.6.1 Fee List Page

Four collapsible sections: **Ongoing Costs · Rebates · Transactional Costs · Commission Details**

Each fee row shows:
| Element | Description |
|---------|-------------|
| ✏️ Pencil icon | Open Fee Edit Page for this fee |
| ↩️ Undo icon | *(Derived plans only, orange)* Undo custom override → `UNDO_DERIVED_PLAN_FEE_OVERRIDE` |
| Fee name | Display name |
| Research value | Auto-generated description from fee structure |
| Custom/Override | *(Derived plans only)* Description of the override if one exists |
| 📊 Chart icon | Open Fee Calculator modal (read-only test calculator) |

#### 2.6.2 Fee Edit Page

Header: `Edit Fee: [Fee Name]`

**Tabs:**

---

**Tab 1 — Fee Value** *(default)*

- **Base Fee** — dollar input
- **Fee minimum / maximum** — shown when `minMaxApplied` is `Option`, `Set`, or `Plan`
- **Fee minimum (aggregated) / Fee maximum (aggregated)** — shown when aggregation type is a balance-aggregation type (see `BALANCE_AGGREGATION_TYPES`)
- **Per fee set:** name label + tier table
  - Tier rows: `[tier#] | [fee % or $] | "for the first/next/remaining balance" | [limit input]`
  - Last tier always shows "for the remaining balance" with no limit input
- **Research Description** — textarea; if blank, description is auto-generated

---

**Tab 2 — Investment Options**

A radio-button matrix: every investment option in the plan vs every fee set + "Excluded".
Each option is assigned to exactly one set or Excluded.
Dispatched via fee save (modifies `feeSets[n].investmentOptionIds`).

---

**Tab 3 — Shares Exchanges**

Same radio-button matrix pattern but for share exchanges (ASX, AXW, FND, CASH, TD) vs fee sets + Excluded.
Dispatched via fee save (modifies `feeSets[n].shareExchanges`).

---

**Tab 4 — Fee Structure**

| Field | Type | Notes |
|-------|------|-------|
| Fee ID | read-only | `xplanId` |
| Fee basis | read-only | e.g., "Account balance" |
| Aggregation method | dropdown | `AGGREGATION_OPTIONS` |
| Tier type | dropdown | Progressive / Flat |
| Percent or dollar fee | dropdown | Percentage / Dollar |
| Min/max applies to | dropdown | Option / Set / Plan / No min/max |
| Include Base Fee in min/max? | Yes / No | |
| Base Fee applies per account? | Yes / No | only shown for balance-aggregation types |
| Default set for investment options | dropdown | Excluded + all fee set names |
| **Sets table** | | |
| — Set name | editable text | |
| — Short ID | editable text | e.g., A, B, C |
| — Number of tiers | dropdown | Flat rate / 2 Tiers … 10 Tiers |
| — × remove | button | disabled if only 1 set |
| — + add | button | appears in last row |

**Save behaviour:**
- Source plan → `UPDATE_PLAN_FEES` (change propagates to all derived plans that have no override for this fee)
- Derived plan → `OVERRIDE_DERIVED_PLAN_FEE` (stores override, breaks propagation from source)

---

#### 2.6.3 Fee Calculator (modal overlay)

Opens from the 📊 chart icon on any fee row. **Read-only — no state writes.**

Header: `[Fee Name] — Fee Calculation Details (Test calculator)`

Sub-header: plan name + `<Derived>` label if applicable. "Unlock research" button (placeholder, no action).

**Table structure** — one block of rows per fee set:

| Row | Description |
|-----|-------------|
| Tier limit (flat/progressive) | Set name in col 2, then one column per tier showing the limit (`MAX` for last) |
| Tier fee | Fee rate per tier (% or $) |
| Balance in tier | Auto-calculated: how much of the entered balance falls in each tier |
| Tier amount | Auto-calculated: balance-in-tier × rate |
| Option | "Funds allocated to set" label + **yellow editable input** for test balance + calculated totals |
| Min/max (option) | *(shown when `minMaxApplied === 'Option'`)* Raw fee · Min · Max |
| Option fee | *(shown when `minMaxApplied === 'Option'`)* Fee after min/max applied |
| Min/max (set) | *(shown when `minMaxApplied === 'Set'`)* Raw fee · feeSet.minDollar · feeSet.maxDollar |
| Set balance | Sum of all option inputs for this set |
| Set total | Final fee for this set after any set-level min/max |

**Below all sets:**

| Row | Description |
|-----|-------------|
| Plan balance | Sum of all set balances |
| Min/max | *(shown when `minMaxApplied === 'Plan'`)* Raw total · fee.minDollar · fee.maxDollar |
| **Fee total** | Final fee after plan-level min/max, **bold** |

Inputs update all calculated values in real time.

---

### 2.7 Investment Options (`?mode=investmentOptions`)

**Top bar:** search input + "Add Investments" dropdown (Add Existing Option / Add Custom Option)

**Table columns:** Action (view icon, × remove) · Name · APIR · Type · Asset Allocation · Invest Fees % · Perf Fee % · Trans Cost % · Buy Cost % · Sell Cost % · Rebate %

**Click option name or view icon → Investment Details Modal (7 tabs):**

| Tab | Contents |
|-----|----------|
| Asset Allocation | Table + pie charts (Growth / Defensive / Other) |
| Fees | Plan fee assignments for this option + option-level fees |
| Past Performance | Chart with 8 period returns |
| Research Reports | Placeholder |
| Type | Cash account / Ethical / SMA boolean flags |
| Admin | Placeholder |
| TMD | File link placeholder |

Custom options have an 8th tab — **Edit Custom Fund** — that allows editing fees and asset allocation.

**Add Existing Option flow:**
1. Modal opens with global library (searchable/filterable)
2. User ticks checkboxes on one or more options
3. Confirm → `ADD_INVESTMENT_OPTION` dispatched for each selected option

**Add Custom Option flow:**
1. Enter Name and APIR/Code
2. Set fee fields (Invest Costs, Performance, Transaction, Buy, Sell)
3. Enter asset allocation (11 fields; validation: must sum to 100%)
4. Save → `ADD_INVESTMENT_OPTION` with `custom: true`
   - Side effect: option is auto-assigned to the default fee set in every fee on the plan (unless that fee uses share-exchange-based coverage)

**Remove:** confirmation prompt → `REMOVE_INVESTMENT_OPTION`

---

### 2.8 Derive Plan (`/research/plans/:planId/derive`)

Same form as Add Plan, pre-filled from the source plan. The Name field is cleared and must be filled with a unique value.

On Save:
- New plan created with `derivedFromId` pointing to the source plan's ID
- All investment options, fees, and documents are copied (deep copy, not references)
- Navigates to the new derived plan's detail page

**Derived plan fee inheritance rules:**
- When a fee is saved on the **source plan** (`UPDATE_PLAN_FEES`), the change propagates to all derived plans **except** those that have an `overrideFee` set for that fee
- When a fee is saved on a **derived plan** (`OVERRIDE_DERIVED_PLAN_FEE`), it stores the modified fee in `overrideFee` and stops receiving propagated changes
- The undo icon on the fee list clears `overrideFee` (`UNDO_DERIVED_PLAN_FEE_OVERRIDE`), re-enabling propagation

---

### 2.9 Investment Data (`/research/investment-data`)

A two-panel view for managing the global investment options library.

**Left panel:** paginated list of global options
- Search by name or APIR
- Filter by asset class, type (Ethical, SMA, Cash)
- Pagination (20 per page)
- Click row → show details in right panel

**Right panel:** selected option details
- All fund attributes displayed in a structured grid
- Asset allocation breakdown
- Edit button → `InvestmentFormModal`
- Delete button → confirmation → `REMOVE_GLOBAL_OPTION`

**Add button (top):** `InvestmentFormModal` in create mode → `ADD_GLOBAL_OPTION`

The global library is separate from per-plan options. Users add from the global library into a plan via the "Add Existing Option" flow on the plan's Investment Options sub-view.

---

## 3. Data Model

### 3.1 WsAssetAllocation

```typescript
interface WsAssetAllocation {
  domEq: number;     // Domestic Equity %
  intlEq: number;    // International Equity %
  domProp: number;   // Domestic Property %
  intlProp: number;  // International Property %
  domFI: number;     // Domestic Fixed Interest %
  intlFI: number;    // International Fixed Interest %
  domCash: number;   // Domestic Cash %
  intlCash: number;  // International Cash %
  dirProp: number;   // Direct Property %
  alt: number;       // Alternatives %
  other: number;     // Other %
}
```

Helper functions:
- `allocGrowth(a)` → `domEq + intlEq + domProp + intlProp`
- `allocDefensive(a)` → `domFI + intlFI + domCash + intlCash + dirProp`
- `allocOther(a)` → `alt + other`
- `allocTotal(a)` → growth + defensive + other (should equal 100)

---

### 3.2 WsInvestmentOption

```typescript
interface WsInvestmentOption {
  id: string;
  name: string;
  apir: string;                  // e.g. "ACM0006AU"
  type: string;                  // "Ethical" | ""
  assetAllocation: string;       // primary class label, e.g. "Domestic Equity"
  investFees: number;            // %
  perfFees: number | null;
  transCost: number | null;
  buyCost: number | null;
  sellCost: number | null;
  custom: boolean;               // true = created for a specific plan
  broadObjectives: string;
  alloc: WsAssetAllocation;
  cashAccount: boolean;
  ethical: boolean;
  sma: boolean;                  // Separately Managed Account
  restricted: boolean;
  redemptionFreq: string;        // e.g. "Daily"
  netAssets: number;             // AUD
  incomeDistributions: string;   // e.g. "Semi-annual"
  managerBackground: string;
  investmentRebate?: number | null;
}
```

---

### 3.3 WsFeeTier

```typescript
interface WsFeeTier {
  feePercent: number;   // percentage rate for this tier
  feeDollar: number;    // dollar amount for this tier
  tierLimit: number;    // upper balance limit; 99999999999 = "Remaining" (last tier)
}
```

---

### 3.4 WsFeeSet

```typescript
interface WsFeeSet {
  shortId: string;                    // e.g. "A", "B", "C"
  name: string;                       // e.g. "Standard", "Premium"
  minDollar: number;                  // set-level minimum fee
  maxDollar: number;                  // set-level maximum fee (0 = no max)
  isDefault: boolean;
  numTiers: string;                   // "Flat rate" | "2 Tiers" | ... | "10 Tiers"
  tiers: WsFeeTier[];
  shareExchanges?: { code: string }[];      // exchange codes covered by this set
  investmentOptionIds?: string[];           // option IDs assigned to this set
}
```

---

### 3.5 WsFee

```typescript
interface WsFee {
  xplanId: string;              // unique fee identifier within the plan
  name: string;                 // e.g. "Administration Fee"
  isRebate: boolean;
  isCommission: boolean;
  isFlat: boolean;              // false = progressive, true = flat rate
  isDollar: boolean;            // false = percentage, true = dollar amount
  baseDollar: number;
  feeBasis: string;             // "Account balance" | "Investment balance" | "Fixed"
  aggregationOption: string;    // one of AGGREGATION_OPTIONS values
  minMaxApplied: string;        // "Option" | "Set" | "Plan" | "No min/max"
  minDollar: number;            // plan-level minimum
  maxDollar: number;            // plan-level maximum (0 = no max)
  minAggregated: number;        // aggregated minimum (balance-aggregation types only)
  maxAggregated: number;        // aggregated maximum
  includeBaseInMinMax: boolean;
  basePerAccount: boolean;      // base fee per account (balance-aggregation types only)
  defaultSetId: string;         // shortId of the default set for new investment options
  researchDescription: string;  // blank = auto-generate from tier structure
  feeSets: WsFeeSet[];
  prodCostDesc: string;         // legacy display description
  overrideFee?: WsFee;          // populated on derived plans when fee has been overridden
}
```

---

### 3.6 WsDocument

```typescript
interface WsDocument {
  id: number;
  name: string;
  type: string;       // one of DOCUMENT_TYPES
  size: number | null;
}
```

---

### 3.7 WsPlan

```typescript
interface WsPlan {
  id: string;
  name: string;
  sortName: string;
  manager: string;
  type: 'Investment Platform' | 'Pension' | 'Super';
  subtype: string;
  rating: number;          // 0–5
  openForBusiness: boolean;
  abn: string;
  productSpin?: string;
  usi?: string;
  iressSpin?: string;
  tmdStatus?: string;
  createdBy?: string;
  comments?: string;
  description: string;

  contributions: {
    employerSG: boolean;
    employerVoluntary: boolean;
    memberVoluntary: boolean;
    memberSalary: boolean;
    spouse: boolean;
    governmentCoContribution: boolean;
    rollover: boolean;
    downsizer: boolean;
  };

  payments: {
    bpay: boolean;
    directDebit: boolean;
    cheque: boolean;
    eft: boolean;
    creditCard: boolean;
    eftpos: boolean;
  };

  investmentRules: {
    minInitial: number;
    minOneOff: number;
    minRegularContrib: number;
    minOneOffWithdrawal: number;
    minRegularWithdrawal: number;
    minBalance: number;
  };

  fees: {
    ongoing: WsFee[];
    rebates: WsFee[];
    transactional: WsFee[];
    commissions: WsFee[];
  };

  investmentOptions: WsInvestmentOption[];
  documents: WsDocument[];
  changedFields?: string[];    // field keys modified via Edit Research
  derivedFromId?: string;      // set when derived from another plan
}
```

---

### 3.8 WealthSolverState

```typescript
interface WealthSolverState {
  plans: WsPlan[];
  globalOptions: WsInvestmentOption[];
}
```

---

## 4. State Management

All state lives in a single React Context with a `useReducer` hook. The context exposes `{ state, dispatch }`.

### 4.1 Action reference

#### Plan actions

| Action type | Payload (beyond `type`) | Effect |
|-------------|------------------------|--------|
| `ADD_PLAN` | `plan: WsPlan` | Appends plan to `state.plans` |
| `UPDATE_PLAN` | `planId, patch: Partial<WsPlan>, changedFields?: string[]` | Merges patch into plan; unions `changedFields` with existing |

#### Fee actions

| Action type | Payload | Effect |
|-------------|---------|--------|
| `UPDATE_PLAN_FEES` | `planId, category: FeeCategory, fee: WsFee` | Updates fee on source plan; propagates to derived plans that have no `overrideFee` for this fee |
| `OVERRIDE_DERIVED_PLAN_FEE` | `planId, category, feeId, override: WsFee` | Sets `overrideFee` on the matching fee in the derived plan |
| `UNDO_DERIVED_PLAN_FEE_OVERRIDE` | `planId, category, feeId` | Clears `overrideFee` (sets to `undefined`); re-enables propagation from source |

`FeeCategory = 'ongoing' | 'rebates' | 'transactional' | 'commissions'`

#### Investment option actions

| Action type | Payload | Effect |
|-------------|---------|--------|
| `ADD_INVESTMENT_OPTION` | `planId, option: WsInvestmentOption` | Adds to `plan.investmentOptions`. If `option.custom === true`, also auto-assigns the option to the `defaultSetId` set in every fee (unless the fee uses share-exchange-based sets) |
| `UPDATE_INVESTMENT_OPTION` | `planId, option` | Replaces matching option by `id` |
| `REMOVE_INVESTMENT_OPTION` | `planId, optionId` | Removes option from plan |

#### Document actions

| Action type | Payload | Effect |
|-------------|---------|--------|
| `ADD_DOCUMENT` | `planId, doc: WsDocument` | Appends to `plan.documents` |
| `REMOVE_DOCUMENT` | `planId, docId: number` | Removes by `id` |

#### Global options actions

| Action type | Payload | Effect |
|-------------|---------|--------|
| `ADD_GLOBAL_OPTION` | `option: WsInvestmentOption` | Appends to `state.globalOptions` |
| `UPDATE_GLOBAL_OPTION` | `option` | Replaces matching option by `id` |
| `REMOVE_GLOBAL_OPTION` | `optionId` | Removes from `state.globalOptions` |

---

### 4.2 Fee propagation rules (derived plans)

```
Source plan fee updated (UPDATE_PLAN_FEES)
  → For each plan where plan.derivedFromId === source plan id:
      → For each fee in plan.fees[category]:
          → If fee.xplanId matches AND fee.overrideFee is undefined:
              → Replace fee with new version (propagate)
          → Else if fee.overrideFee is set:
              → Leave untouched (override blocks propagation)

Derived plan fee saved (OVERRIDE_DERIVED_PLAN_FEE)
  → Set fee.overrideFee = edited fee
  → Future UPDATE_PLAN_FEES from source will be ignored for this fee

Override undone (UNDO_DERIVED_PLAN_FEE_OVERRIDE)
  → Set fee.overrideFee = undefined
  → Next UPDATE_PLAN_FEES from source will propagate again
```

---

## 5. Constants

### AGGREGATION_OPTIONS (10 values)

```
investment_allocation  → Investment Allocation
set                    → Total allocation for set
plan_balance           → Plan balance
member_balance         → Balance of members accounts
family_balance         → Balance of family accounts
member_family_balance  → Balance of member and family accounts
member_family_excl_invest → Balance of member and family accounts excluding investments
member_family_super    → Balance of member and family super/pension/investment accounts
member_excl_balance    → Balance of member accounts less excluded balances
employer_plan          → Total assets of employer plan
```

### BALANCE_AGGREGATION_TYPES
When `fee.aggregationOption` is one of these, also show "Fee minimum/maximum (aggregated)" fields and the "Base Fee applies per account?" toggle:

```
member_balance · family_balance · member_family_balance ·
member_family_excl_invest · member_family_super · member_excl_balance
```

### TIER_COUNT_OPTIONS
```
Flat rate · 2 Tiers · 3 Tiers · 4 Tiers · 5 Tiers · 6 Tiers · 7 Tiers · 8 Tiers · 9 Tiers · 10 Tiers
```

`numTiersFromOption(opt)` → 1 for "Flat rate", else parseInt(opt)

### SHARE_EXCHANGES
```
ASX   → ASX - Australian Stock Exchange
AXW   → AXW - ASX Warrants
FND   → FND - Australian/New Zealand Managed Funds
CASH  → CASH - CASH
TD    → TD - Term Deposits
```

### DOCUMENT_TYPES
```
PDS · Investment · Additional · Insurance · FSG · Other · Fees · SMA · Annual Report · TMD
```

---

## 6. Fee Calculation Logic

The Fee Calculator computes a live dollar fee given a set of balance inputs.

### 6.1 Progressive fee (isFlat = false)

Each tier absorbs balance in order. The last tier takes whatever remains.

```
function calcProgressive(tiers, balance, isDollar):
  remaining = balance
  for each tier at index i:
    isLast = (i === tiers.length - 1)
    tierBalance = isLast ? remaining : min(remaining, tier.tierLimit)
    tierAmount  = isDollar ? tier.feeDollar : tierBalance * (tier.feePercent / 100)
    remaining  -= tierBalance
  return { tierBalance[], tierAmount[], total = sum(tierAmount[]) }
```

### 6.2 Flat rate fee (isFlat = true)

```
function calcFlat(tiers, balance, isDollar):
  if isDollar:
    tierAmount[0] = tiers[0].feeDollar   // fixed dollar regardless of balance
    tierBalance[0] = balance
  else:
    tierAmount[0] = balance * (tiers[0].feePercent / 100)
    tierBalance[0] = balance
  # remaining tiers get 0
```

### 6.3 Min/max application

After calculating the raw fee for a scope, apply bounds:

```
function applyMinMax(amount, minDollar, maxDollar):
  if minDollar > 0: amount = max(amount, minDollar)
  if maxDollar > 0: amount = min(amount, maxDollar)
  return amount
```

**Scope determines when to apply:**

| `minMaxApplied` | When applied | Parameters used |
|-----------------|-------------|-----------------|
| `"Option"` | Per option input (per set in calculator) | `fee.minDollar`, `fee.maxDollar` |
| `"Set"` | Per fee set total | `feeSet.minDollar`, `feeSet.maxDollar` |
| `"Plan"` | Once, to the plan total | `fee.minDollar`, `fee.maxDollar` |
| `"No min/max"` | Never | — |

### 6.4 Full calculation flow

```
for each feeSet:
  balance = user input for this set
  tierCalcs = calcProgressive or calcFlat
  rawSetTotal = sum of tierCalcs.tierAmount[]

  if minMaxApplied === "Option": setFee = applyMinMax(rawSetTotal, fee.minDollar, fee.maxDollar)
  elif minMaxApplied === "Set":  setFee = applyMinMax(rawSetTotal, feeSet.minDollar, feeSet.maxDollar)
  else: setFee = rawSetTotal

planBalance = sum of all set balances
rawPlanFee  = sum of all setFee values

if minMaxApplied === "Plan": planFee = applyMinMax(rawPlanFee, fee.minDollar, fee.maxDollar)
else: planFee = rawPlanFee
```

---

## 7. Key UI Patterns

| Pattern | Description |
|---------|-------------|
| **Primary colour** | Teal-700 (`#0f766e`) for buttons, headers, active nav, links |
| **Two-column form** | `grid-cols-[160px_1fr]` — label left, input right |
| **Collapsible sections** | Teal gradient header with chevron toggle, content collapses |
| **Sub-view switching** | `?mode=editFees` etc. — query param swap, no route push |
| **Changed field asterisk** | Red `*` next to field label when `changedFields` includes that key |
| **Derived plan banner** | Blue info banner at top of detail page with link to source |
| **Fee set colour** | Yellow (`bg-yellow-100`) on editable balance inputs in calculator |
| **Stars rating** | Filled / unfilled SVG stars; amber fill for rated tiers |
| **Read-only vs editable** | Detail page is read-only; edit sub-views replace the content area inline |
| **Modal overlay** | Fee Calculator and Investment Details use fixed-position modals with dark backdrop |

---

## 8. Component Tree (reference)

```
WealthSolverProvider (Context)
│
├── /research/plans                 PlanListPage
│     └── PlanRow (click → detail)
│
├── /research/plans/new             AddPlanPage
│     └── PlanFormPage (mode="add")
│
├── /research/plans/:planId         PlanDetailPage
│     ├── ?mode=editResearch        EditResearch (PlanFormPage mode="edit")
│     ├── ?mode=editFees            EditFees
│     │     ├── FeeListPage
│     │     │     └── FeeCalculator (modal, per-fee)
│     │     └── FeeEditPage
│     │           ├── Tab: Fee Value
│     │           ├── Tab: Investment Options
│     │           ├── Tab: Shares Exchanges
│     │           └── Tab: Fee Structure
│     ├── ?mode=editDocuments       EditDocuments
│     └── ?mode=investmentOptions   InvestmentOptionsView
│           ├── InvestmentViewModal (7–8 tabs)
│           ├── AddExistingModal
│           └── AddCustomModal
│
├── /research/plans/:planId/derive  DerivePlanPage
│     └── PlanFormPage (mode="derive")
│
└── /research/investment-data       InvestmentDataPage
      ├── Left panel (list + search)
      └── Right panel (detail + edit)
```
