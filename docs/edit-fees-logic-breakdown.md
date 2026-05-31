# Edit Fees — Full Data Model & Logic Breakdown

---

## 1. Component Hierarchy

```
EditFees (root, holds 2 state slots)
│
├── [editingFee === null]  FeeListPage
│     └── per-fee row: ✏️ Pencil → sets editingFee
│                       ↩️ Undo   → dispatch UNDO_DERIVED_PLAN_FEE_OVERRIDE
│                       📊 Chart  → sets calculatingFee (doesn't close list)
│
├── [editingFee !== null]  FeeEditPage
│     ├── Tab: Fee Value
│     ├── Tab: Investment Options
│     ├── Tab: Shares Exchanges
│     └── Tab: Fee Structure
│           Save → dispatch UPDATE_PLAN_FEES or OVERRIDE_DERIVED_PLAN_FEE
│           Cancel → clears editingFee
│
└── [calculatingFee !== null]  FeeCalculator  (modal overlay, stacks on top)
      Close → clears calculatingFee
```

Key design point: `calculatingFee` and `editingFee` are **independent** state slots. The calculator modal can stack on top of either the list or the edit page because it renders as a `fixed` overlay.

---

## 2. Data Model — Full Field-by-Field

### 2.1 WsFee (the top-level fee object)

```
xplanId: string          Unique identifier (e.g. "administration_fees", "brokerage_fee")
                         Matches across source plan and derived plans — used for propagation lookup

name: string             Display name ("Administration Fees", "Brokerage Fee")

isRebate: boolean        Determines which category bucket the fee lives in
isCommission: boolean    (used for section header labels, not for calculation)

isFlat: boolean          FALSE = Progressive  (each tier absorbs up to its limit, sequentially)
                         TRUE  = Flat rate    (single rate or dollar, applied to whole balance)

isDollar: boolean        FALSE = percentage fee  → tier.feePercent used
                         TRUE  = dollar fee      → tier.feeDollar used

baseDollar: number       A fixed dollar amount added before the tiered fee.
                         Displayed as "Base Fee" in Fee Value tab. Added to fee total.
                         Whether it counts toward min/max is controlled by includeBaseInMinMax.

feeBasis: string         Read-only. What the balance is drawn from:
                           "Account balance"     → the account's total value
                           "Investment balance"  → value of specific investment(s)
                           "Fixed"               → fee is a fixed dollar, not balance-driven

aggregationOption:       How balances are summed before tiers are applied.
                         One of 10 AGGREGATION_OPTIONS (see §5).
                         Also determines the "balance basis" label in the calculator header.

minMaxApplied: string    The scope at which min/max bounds are enforced:
                           "Option"     → per individual investment option input
                           "Set"        → per fee set (using feeSet.minDollar / feeSet.maxDollar)
                           "Plan"       → on the overall plan total (using fee.minDollar / fee.maxDollar)
                           "No min/max" → no capping

minDollar: number        Plan-level minimum fee amount (used when minMaxApplied = "Plan" or "Option")
maxDollar: number        Plan-level maximum fee amount (0 = no maximum)

minAggregated: number    Aggregated minimum (only relevant for BALANCE_AGGREGATION_TYPES)
maxAggregated: number    Aggregated maximum

includeBaseInMinMax:     Whether baseDollar counts toward the min/max comparison
basePerAccount:          Whether baseDollar is multiplied by the number of accounts
                         (only visible when aggregationOption is in BALANCE_AGGREGATION_TYPES)

defaultSetId: string     shortId of the set that new custom investment options are auto-assigned to.
                         Can also be "excluded" (meaning new options go to no set).

researchDescription:     User-written override for the auto-generated description text.
                         Blank = auto-generate via generateFeeDescription().

feeSets: WsFeeSet[]      The actual tier/rate data (1 or more sets). See §2.2.

prodCostDesc: string     Legacy display description. Not editable in UI, used for backwards compatibility.

overrideFee?: WsFee      Populated only on derived plan fees. Holds the diverged version.
                         undefined → fee inherits from source plan (propagation active)
                         WsFee     → this derived fee uses its own config (propagation blocked)
```

### 2.2 WsFeeSet (a named group of tiers)

```
shortId: string          Single letter or short code: "A", "B", "C"
                         Used as the key for assignment lookups.

name: string             Full display name: "Managed investments incl term deposits", "Set C"

isDefault: boolean       Whether this set is the default for new investment options.
                         Must stay in sync with fee.defaultSetId (setDefaultSet() keeps both aligned).

minDollar: number        Set-level minimum (used when minMaxApplied = "Set")
maxDollar: number        Set-level maximum (used when minMaxApplied = "Set", 0 = no max)

numTiers: string         Display label for tier count: "Flat rate", "2 Tiers" ... "10 Tiers"
                         Used only for UI — the actual tier count is tiers.length.
                         changeNumTiers() resizes tiers[] to match this, preserving existing values.

tiers: WsFeeTier[]       The actual rate tiers. See §2.3.

shareExchanges:          Exchange codes assigned to this set: [{code:'ASX'}, {code:'FND'}]
  { code: string }[]     An investment option covered by an exchange (e.g. listed ASX stock)
                         is automatically charged at this set's rate without explicit assignment.
                         When any set has shareExchanges, ADD_INVESTMENT_OPTION skips manual
                         assignment for the whole fee (flagged by hasExchangeSets check).

investmentOptionIds:     Explicit assignment of investment options by ID to this set.
  string[]               Mutually exclusive: an optionId can only appear in one set's list.
                         If an option is not in any set's list AND not covered by shareExchanges,
                         it is "Excluded" from this fee.
```

### 2.3 WsFeeTier (a single rate band)

```
feePercent: number       Percentage rate for this tier (e.g. 0.533 means 0.533%)
                         Used when fee.isDollar === false

feeDollar: number        Dollar amount for this tier (e.g. 25 means $25.00)
                         Used when fee.isDollar === true

tierLimit: number        Upper balance boundary for this tier in dollars.
                         For all tiers except the last: the amount of balance absorbed at this rate.
                         For the last tier: always 99999999999 (the REMAINING sentinel),
                         meaning "apply this rate to whatever balance is left".

                         Progressive fee example with balance $400,000:
                           Tier 1: limit=100,000  → absorbs first $100k  at 0.533%
                           Tier 2: limit=150,000  → absorbs next  $150k  at 0.3998%
                           Tier 3: limit=500,000  → absorbs next  $150k  at 0.1999% (only $150k left)
                           Tier 4: limit=2250000  → absorbs $0           (nothing left)
                           Tier 5: limit=REMAINING → absorbs $0          (nothing left)
```

---

## 3. FeeListPage — Logic

The list is purely display. No fee values are edited here. It orchestrates navigation to the edit page and calculator, and handles the one in-place action (undo override).

**Column grid** adapts based on `isDerived`:
- Source plan: `48px 1fr 1fr 40px` (Action | Fee name | Value | Chart)
- Derived plan: `48px 1fr 1fr 1fr 40px` (adds Custom/Override column)

**`getResearchFee(fee, category)`**
For derived plans, looks up the matching fee in the source plan by `xplanId`. This is the "research" value — what the source plan says the fee should be. The derived plan's own config (possibly overridden) shows in the Value column.

**Display values:**
- `researchDesc` = `generateFeeDescription()` on the source plan's version of the fee (or current fee if not derived)
- `overrideDesc` = `generateFeeDescription()` on `fee.overrideFee` (only shown if override exists)
- The orange ↩️ undo button is only shown when `fee.overrideFee !== undefined`

**`handleUndo(fee, category)`**
Dispatches `UNDO_DERIVED_PLAN_FEE_OVERRIDE` → reducer sets `fee.overrideFee = undefined` → next `UPDATE_PLAN_FEES` from source will propagate to this fee again.

---

## 4. FeeEditPage — Local State & Mutation Logic

### 4.1 Initial state

```typescript
const startingFee: WsFee = isDerived
  ? JSON.parse(JSON.stringify(initialFee.overrideFee ?? initialFee))
  : JSON.parse(JSON.stringify(initialFee));
```

The deep copy (via JSON) is critical — it detaches the working copy from the store so edits don't mutate state directly. For derived plans, it starts from the existing override if one exists, otherwise from the current inherited fee. The user is always editing a local copy; nothing is saved until they click Save.

### 4.2 Conditional field visibility (derived before render)

```typescript
const isBalanceAggregation = BALANCE_AGGREGATION_TYPES.includes(fee.aggregationOption);
const showMinMax = fee.minMaxApplied === 'Option' || fee.minMaxApplied === 'Set' || fee.minMaxApplied === 'Plan';
const showAggregatedMinMax = showMinMax && isBalanceAggregation;
const showBasePerAccount = isBalanceAggregation;
```

These three booleans drive conditional sections in Fee Value and Fee Structure tabs. They re-evaluate on every render as the user changes dropdowns, so the UI responds immediately without extra state.

### 4.3 Save dispatch

```typescript
function handleSave() {
  if (isDerived) {
    dispatch({ type: 'OVERRIDE_DERIVED_PLAN_FEE', planId: plan.id, category,
               feeId: initialFee.xplanId, override: fee });
  } else {
    dispatch({ type: 'UPDATE_PLAN_FEES', planId: plan.id, category, fee });
  }
  onClose();
}
```

- **Source plan** → `UPDATE_PLAN_FEES`: updates the fee in the source plan AND propagates to any derived plans that have no override for this `xplanId`.
- **Derived plan** → `OVERRIDE_DERIVED_PLAN_FEE`: stores the edited fee in `overrideFee`, blocking future propagation from source. The `feeId` is `initialFee.xplanId` (not `fee.xplanId`) so the lookup is reliable even if the user changed the ID in the working copy.

---

## 5. Fee Value Tab — Detailed Logic

Layout: two-column grid (`160px label | flex-1 input`).

### Base Fee

```
[Base Fee input]  ← fee.baseDollar (always shown, even if 0)
PLUS              ← separator text
```

The base dollar is a flat addition to the final fee, before min/max is applied (unless `includeBaseInMinMax = true`).

### Conditional min/max fields (`showMinMax`)

Shown when `minMaxApplied` is Option, Set, or Plan:
```
[Fee minimum]  → fee.minDollar
[Fee maximum]  → fee.maxDollar  (0 = no ceiling)
```

Shown additionally when the aggregation type is a balance-aggregation type (`showAggregatedMinMax`):
```
[Fee minimum (aggregated)]  → fee.minAggregated
[Fee maximum (aggregated)]  → fee.maxAggregated
```

### Per fee set — tier table

For each `feeSet` in `fee.feeSets`:
- Header: `{feeSet.name}` + `(Default)` if `feeSet.isDefault`
- Column heading: "Fee amount ($)" if `fee.isDollar`, else "Fee percent"
- `tierCount = numTiersFromOption(feeSet.numTiers)` — used to conditionally show the "Amount" (tier limit) column only when `tierCount > 1`

Each tier row:
```
[tier#]  [rate input]  [position text]  [limit input (if not last)]
   1       0.533 %      for the first     100,000
   2       0.3998 %     for the next      150,000
   3       0.1999 %     for the next      500,000
   4       0.0666 %     for the next      2,250,000
   5       0.00 %       for the remaining balance   (no limit input)
```

`updateTier(setIdx, tierIdx, patch)`:
- Only writes `feePercent` if `!fee.isDollar`
- Only writes `feeDollar` if `fee.isDollar`
- The limit input is hidden for the last tier (its `tierLimit` stays at `REMAINING`)

### Research Description textarea

- Pre-populated from `fee.researchDescription`
- If left blank, the fee list will auto-generate via `generateFeeDescription()`
- If filled, the manual text is used verbatim as the displayed description

---

## 6. changeNumTiers — Tier Resize Logic

When the user changes the "Number of tiers" dropdown in Fee Structure tab:

```typescript
function changeNumTiers(setIdx: number, opt: string) {
  const count = numTiersFromOption(opt);      // "3 Tiers" → 3, "Flat rate" → 1
  const newTiers: WsFeeTier[] = [];

  for (let t = 0; t < count; t++) {
    const existing = s.tiers[t];              // reuse if present, else undefined
    if (t === count - 1) {
      // Last tier always gets REMAINING as its limit
      newTiers.push({
        feePercent: existing?.feePercent ?? 0,
        feeDollar: existing?.feeDollar ?? 0,
        tierLimit: REMAINING,
      });
    } else {
      newTiers.push({
        feePercent: existing?.feePercent ?? 0,
        feeDollar: existing?.feeDollar ?? 0,
        // Preserve existing limit, but if it was REMAINING (old last tier), reset to 100,000
        tierLimit: existing?.tierLimit !== REMAINING ? (existing?.tierLimit ?? 100000) : 100000,
      });
    }
  }
  return { ...s, numTiers: opt, tiers: newTiers };
}
```

Key rules:
1. Existing rates and limits are **preserved** where the tier index still exists (reducing 5→3 keeps tiers 1–3; adding 3→5 creates tiers 4–5 at 0)
2. When a previously-last tier (limit = REMAINING) becomes a middle tier, its limit resets to $100,000 as a sensible default
3. The new last tier **always** gets `REMAINING` regardless of what was there before

---

## 7. Investment Options Tab — Matrix Assignment Logic

```
Columns: Name | APIR | [Set A (Default)] | [Set B] | ... | Excluded
Rows:    one per plan.investmentOptions
```

**Current assignment lookup:**
```typescript
const assignedSet = fee.feeSets
  .find((s) => (s.investmentOptionIds ?? []).includes(opt.id))
  ?.shortId ?? 'excluded';
```

An option is considered "Excluded" if its `id` is not in any set's `investmentOptionIds`. This is the default state — an option not explicitly assigned is excluded.

**`assignOptionToSet(optId, targetSetId)`:**
```typescript
feeSets: f.feeSets.map((s) => ({
  ...s,
  investmentOptionIds:
    targetSetId === s.shortId
      // Add to target set (dedup: filter first, then append)
      ? [...(s.investmentOptionIds ?? []).filter((id) => id !== optId), optId]
      // Remove from all other sets
      : (s.investmentOptionIds ?? []).filter((id) => id !== optId),
}))
```

The filter-then-append pattern ensures:
- An option can only be in **one** set (mutual exclusion enforced here)
- Setting `targetSetId = 'excluded'` removes the option from all sets without adding it anywhere

Changes are held in local `fee` state until Save is clicked.

---

## 8. Shares Exchanges Tab — Exchange Assignment Logic

Identical structure to Investment Options tab but uses `SHARE_EXCHANGES` (5 fixed exchanges) instead of `plan.investmentOptions`.

**Key difference:** Share exchanges drive **automatic** fee coverage. If Set A has `shareExchanges: [{code:'ASX'}]`, then any investment option traded on ASX is covered by Set A's rates without needing to be in `investmentOptionIds`. The `ADD_INVESTMENT_OPTION` reducer checks `hasExchangeSets` and skips manual assignment when any set has exchange-based coverage.

**`assignExchangeToSet(code, targetSetId)`:** same mutual-exclusion pattern as options. Removes `code` from all sets, then adds to target (or nowhere if `'excluded'`).

---

## 9. Fee Structure Tab — Field Reference

| Field | Editable? | Effect |
|-------|-----------|--------|
| Fee ID | Read-only | `xplanId` — shown for debugging/reference |
| Fee basis | Read-only | `feeBasis` — set at creation, not configurable |
| Aggregation method | Dropdown | Changes `aggregationOption`; triggers BALANCE_AGGREGATION field visibility |
| Tier type | Dropdown | `isFlat` toggle; changes how calculation works |
| Percent or dollar fee | Dropdown | `isDollar` toggle; changes which tier field is displayed/used |
| Min/max applies to | Dropdown | `minMaxApplied`; drives `showMinMax` in Fee Value tab |
| Include Base Fee in min/max? | Dropdown | `includeBaseInMinMax` |
| Base Fee applies per account? | Dropdown | `basePerAccount`; only shown for BALANCE_AGGREGATION_TYPES |
| Default set for investment options | Dropdown | Calls `setDefaultSet()` — updates both `fee.defaultSetId` AND each set's `isDefault` |

**`setDefaultSet(shortId)`:**
```typescript
setFee((f) => ({
  ...f,
  defaultSetId: shortId,
  feeSets: f.feeSets.map((s) => ({ ...s, isDefault: s.shortId === shortId })),
}));
```

Two places stay in sync: `fee.defaultSetId` (used by ADD_INVESTMENT_OPTION reducer) and `feeSet.isDefault` (used for UI "(Default)" labels). When `shortId === 'excluded'`, no set gets `isDefault: true`.

**Sets table:**
- **Remove (×):** `removeSet(si)` — filters by index; disabled when only 1 set remains
- **Add (+):** `addSet()` — appends new set with next letter shortId, single flat-rate tier at 0, not default
- Name / ShortId / NumTiers are all editable inline; `changeNumTiers()` handles tier array resize

---

## 10. Fee Calculation Logic — Full Detail

### 10.1 Progressive (isFlat = false)

The classic "tiered progressive" model — each dollar of balance is charged at the rate for the bracket it falls in.

```
function calcProgressive(tiers, balance, isDollar):
  remaining = balance

  for i, tier in tiers:
    isLast = (i === tiers.length - 1)

    tierBalance = isLast
      ? remaining                          ← last tier takes everything left
      : min(remaining, tier.tierLimit)     ← earlier tiers capped at their limit

    tierAmount = isDollar
      ? tier.feeDollar                     ← fixed dollar per tier (unusual for progressive)
      : tierBalance × (tier.feePercent / 100)

    remaining -= tierBalance               ← reduce remaining pool

  total = Σ tierAmount[]
```

**Example — Administration Fees, Set A ("Managed investments incl term deposits"), balance = $400,000:**

| Tier | Limit | Rate | Balance in tier | Tier amount |
|------|-------|------|-----------------|-------------|
| 1 | $100,000 | 0.533% | $100,000 | $533.00 |
| 2 | $150,000 | 0.3998% | $150,000 | $599.70 |
| 3 | $500,000 | 0.1999% | $150,000 | $299.85 |
| 4 | $2,250,000 | 0.0666% | $0 | $0.00 |
| 5 | MAX | 0.00% | $0 | $0.00 |
| **Set total** | | | **$400,000** | **$1,432.55** |

Tiers 4 and 5 get $0 balance because the $400k is exhausted after tier 3.

### 10.2 Flat rate (isFlat = true)

```
function calcFlat(tiers, balance, isDollar):
  if isDollar:
    tierAmount[0] = tiers[0].feeDollar   ← fixed dollar regardless of balance
    tierBalance[0] = balance
  else:
    tierAmount[0] = balance × (tiers[0].feePercent / 100)
    tierBalance[0] = balance
  # All other tiers get 0
```

**Example — Expense Recovery Fee, $25.00 flat, balance = $100,000:**

| Tier | Limit | Fee | Balance in tier | Tier amount |
|------|-------|-----|-----------------|-------------|
| 1 | MAX | $25.00 | $100,000 | $25.00 |
| **Set total** | | | **$100,000** | **$25.00** |

The balance amount is irrelevant for dollar flat fees — the fee is always $25 regardless of whether the balance is $100k or $10m.

### 10.3 Min/max scoping

After the raw tier calculation, a min/max clamp may be applied:

```
function applyMinMax(amount, minDollar, maxDollar):
  if minDollar > 0: amount = max(amount, minDollar)   ← floor
  if maxDollar > 0: amount = min(amount, maxDollar)   ← ceiling
  return amount
```

The scope determines **when and with what parameters** this is applied:

| `minMaxApplied` | Applied after | Parameters |
|-----------------|--------------|------------|
| `"Option"` | Each option input (per-set in calculator) | `fee.minDollar`, `fee.maxDollar` |
| `"Set"` | Each set's raw total | `feeSet.minDollar`, `feeSet.maxDollar` |
| `"Plan"` | Sum of all set fees | `fee.minDollar`, `fee.maxDollar` |
| `"No min/max"` | Never | — |

**The critical distinction between Option and Plan:**
- `"Option"` applies the minimum to **each individual allocation separately** — 5 sets each with $200 raw fee and a $300 minimum → each floored to $300 → $1,500 total
- `"Plan"` applies the minimum **once to the aggregate** — same scenario → $1,000 total floored to $300

**Administration Fees example** (Plan-level min = $540):
- 5 sets, total raw fee = $8,548.20
- Since $8,548.20 > $540, the minimum has no effect → Fee total = $8,548.20
- If balance were very small and raw total = $200, it would be raised to $540

**Brokerage Fee example** (Option-level min = $25):
- Set A, balance = $20,000
- Raw tier calculation: $20,000 × 0.08333% on first $30k = $16.67
- Min/max (option): raw = $16.67, min = $25.00, max = $0 (no max) → floored to $25.00
- Option fee = $25.00

### 10.4 Full calculation flow

```
for each feeSet:
  balance = user input for this set (from balances state)
  tierCalcs = fee.isFlat
    ? calcFlat(feeSet.tiers, balance, fee.isDollar)
    : calcProgressive(feeSet.tiers, balance, fee.isDollar)

  rawSetTotal = Σ tierCalcs.tierAmount[]

  setFee = match(fee.minMaxApplied):
    "Option" → applyMinMax(rawSetTotal, fee.minDollar, fee.maxDollar)
    "Set"    → applyMinMax(rawSetTotal, feeSet.minDollar, feeSet.maxDollar)
    default  → rawSetTotal    ← Plan and No min/max both pass through here

planBalance = Σ balance[all sets]
rawPlanFee  = Σ setFee[all sets]

planFee = (fee.minMaxApplied === "Plan")
  ? applyMinMax(rawPlanFee, fee.minDollar, fee.maxDollar)
  : rawPlanFee
```

---

## 11. FeeCalculator UI — Row-by-Row

The modal renders one block of rows per fee set, then summary rows at the bottom. Column count is dynamic: `maxTiers = max(feeSet.tiers.length across all sets)`.

**Per-set row types:**

| Row | Col 1 | Col 2 | Cols 3…N+2 | Notes |
|-----|-------|-------|------------|-------|
| Tier limit | "Tier limit (flat/progressive)" | Set name | one per tier: limit or "MAX" | MAX on last tier |
| Tier fee | "Tier fee" | *(empty)* | rate per tier (% or $) | |
| Balance in tier | "Balance in tier" | *(empty)* | `tierCalcs[i].tierBalance` | auto-calculated |
| Tier amount | "Tier amount" | *(empty)* | `tierCalcs[i].tierAmount` | auto-calculated |
| Option | "Option" | "Funds allocated to set" | **yellow input** + 1.0 + rawTotal + % | user types here |
| Min/max (option) | shown only if `minMaxApplied === "Option"` | | raw \| min \| max/$0 | |
| Option fee | shown only if `minMaxApplied === "Option"` | | fee after clamp + % | |
| Min/max (set) | shown only if `minMaxApplied === "Set"` | | raw \| feeSet.min \| feeSet.max | |
| Set balance | "Set balance" | *(empty)* | balance input value | |
| Set total | "Set total" | Set name | final setFee + % | bold set name |

**Bottom summary rows:**

| Row | Description |
|-----|-------------|
| Plan balance | Sum of all balance inputs |
| Min/max | Shown if `minMaxApplied === "Plan"` and min or max > 0. Shows rawPlanFee \| minDollar \| maxDollar |
| **Fee total** | `planFee` (after plan-level min/max if applicable) + %, **bold** |

**State:** `balances: Record<shortId, string>` — keyed by set shortId, value is the string from the input (parsed to float on read). Initialised to `'0'` for each set. No state is written back to the store — pure test calculator.

---

## 12. generateFeeDescription — Auto-description Logic

Called on every fee row in the list to produce the "Value" or "Research" column text.

```
if fee.researchDescription is non-empty:
  return it verbatim

if feeSets.length === 1 AND feeSets[0].tiers.length === 1:
  // Simple flat/single-tier case
  desc = formatValue(tiers[0])   // e.g. "0.25%" or "$25.00"
  if minMaxApplied === "Plan" AND minDollar > 0:
    desc += "\nMinimum $540.00"
  return desc

// Multi-set or multi-tier progressive
lines = ["Fee calculated on {aggregationLabel}"]
for each set:
  lines += ""
  lines += "{setName}[(Default)]:"
  for each tier:
    if last: lines += "{rate} for the remaining balance"
    else:    lines += "{rate} for the first/next ${tierLimit}"
if minMaxApplied === "Plan" AND minDollar > 0:
  lines += ""
  lines += "Minimum ${minDollar}"
return lines.join("\n")
```

**Example output for Administration Fees:**

```
Fee calculated on Balance of member accounts less excluded balances

Managed investments incl term deposits (Default):
0.533% for the first $100,000
0.3998% for the next $150,000
0.1999% for the next $500,000
0.0666% for the next $2,250,000
0% for the remaining balance

Listed securities only fee:
0.572% for the first $100,000
0.4291% for the next $150,000
0.2145% for the next $500,000
0.0715% for the next $2,250,000
0% for the remaining balance

Minimum $540.00
```

---

## 13. Fee Propagation — Derived Plan System

```
Source plan fee saved (UPDATE_PLAN_FEES):
  reducer.plans.map(plan):
    if plan.id === source:
      update fee by xplanId in category              ← direct update

    if plan.derivedFromId === source:
      propagateFeeToCategory(plan.fees[category], fee):
        plan.fees[category].map(f):
          if f.xplanId !== fee.xplanId: return f     ← different fee, untouched
          if f.overrideFee: return f                 ← has override, skip propagation
          return { ...fee, overrideFee: undefined }  ← propagate, clear any old override

Derived plan fee saved (OVERRIDE_DERIVED_PLAN_FEE):
  find plan by planId
  find fee by feeId (xplanId)
  set fee.overrideFee = action.override               ← blocks all future propagation

Override undone (UNDO_DERIVED_PLAN_FEE_OVERRIDE):
  set fee.overrideFee = undefined                     ← next UPDATE_PLAN_FEES will propagate again
```

The inheritance model is **per-fee**: each individual fee on a derived plan can independently be overridden or inherit from the source. A derived plan can have 5 fees unchanged (propagating from source) and 2 fees overridden, all independently.

---

## 14. Conditional Field Summary (quick reference)

| Condition | Fields shown |
|-----------|-------------|
| Always | Base Fee, tier table, Research Description, Fee ID (RO), Fee basis (RO), Aggregation method, Tier type, Percent/Dollar, Min/max applies to, Include Base Fee in min/max, Default set, Sets table |
| `minMaxApplied` ≠ `"No min/max"` | Fee minimum, Fee maximum (in Fee Value tab) |
| `minMaxApplied` ≠ `"No min/max"` AND aggregation in BALANCE_AGGREGATION_TYPES | Fee minimum (aggregated), Fee maximum (aggregated) |
| aggregation in BALANCE_AGGREGATION_TYPES | Base Fee applies per account? |
| Derived plan, fee has `overrideFee` | ↩️ Undo icon in list |
| `minMaxApplied === "Option"` | Min/max (option) row + Option fee row in calculator |
| `minMaxApplied === "Set"` | Min/max (set) row in calculator |
| `minMaxApplied === "Plan"` AND (`minDollar > 0` OR `maxDollar > 0`) | Min/max row in calculator footer |

---

## 15. AGGREGATION_OPTIONS Reference

| Value | Label |
|-------|-------|
| `investment_allocation` | Investment Allocation |
| `set` | Total allocation for set |
| `plan_balance` | Plan balance |
| `member_balance` | Balance of members accounts |
| `family_balance` | Balance of family accounts |
| `member_family_balance` | Balance of member and family accounts |
| `member_family_excl_invest` | Balance of member and family accounts excluding investments |
| `member_family_super` | Balance of member and family super/pension/investment accounts |
| `member_excl_balance` | Balance of member accounts less excluded balances |
| `employer_plan` | Total assets of employer plan |

**BALANCE_AGGREGATION_TYPES** (trigger aggregated min/max and basePerAccount fields):

```
member_balance · family_balance · member_family_balance ·
member_family_excl_invest · member_family_super · member_excl_balance
```
