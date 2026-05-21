# Insurance Research & Comparison Tool — Specification by Epic (21/05/2026)

This document organises all user stories into the SA-1 through SA-12 epic categories. Each story follows the format defined in the project's requirements writing guide. Stories marked **[NEW]** have been added based on features implemented on the branch but not present in the original outline. Missing details or information gaps are called out at the end of each epic.

---

## SA-1 — Identity & Access

> Must be delivered before any other story area — all API calls require a valid, authenticated adviser account.

### SA-1.1 Advisers can sign in to the application so that they can access insurance research features

<u>Acceptance Criteria</u>

* **[PLACEHOLDER — requires design and requirements input]**
* Advisers can authenticate using their organisation credentials
* Only authenticated advisers can access any application route
* Unauthenticated requests are redirected to a login screen
* Session tokens are issued on successful authentication and attached to subsequent API requests

<u>Designs</u>

* To be provided

<u>Security and Technical Considerations</u>

* Authentication mechanism, identity provider, and session management strategy need to be defined
* OmniLife API calls currently use shared Basic Auth credentials via server-side proxy; per-adviser credentials may be required for production

> **Missing details:** Authentication provider (OAuth2, SAML, custom?), session duration, MFA requirements, role-based access control model, relationship between adviser accounts and OmniLife API credentials.

---

## SA-2 — Client Setup

> Should be built together with or in close sequence to SA-3 — they form the input to the quote engine.

### SA-2.1 Advisers can view and manage insurance research scenarios so that they can organise insurance comparisons for clients

<u>Acceptance Criteria</u>

* Advisers can navigate to the Insurance Research page from the Scenario Details page or Client page
* The page displays a step progress bar showing 9 steps: About You, Scope, Research, Strategy, Product, Remuneration, Next Steps, Better Position, Presentation
  * The current step (Research) is highlighted
* Below the step bar, three sub-tabs are available:
  * Insurance (active by default)
  * Investment (placeholder)
  * Investment Commentary (placeholder)
* The Insurance tab displays a list of insurance scenarios in a table with columns:
  * Scenario Name (clickable teal link)
  * Source (e.g. "RiskResearcher - Finura Xplan", "Insurance Comparison")
  * Created (date and adviser name)
  * Last Modified (date and adviser name)
  * Include in Plan (checkbox toggle)
* Each scenario row has a dropdown menu with the following actions:
  * View Scenario
  * View Replacement
  * View Like for Like
  * View Alternatives
  * View Reports
  * View Needs Analysis
  * Edit Scenario (only if source is "Insurance Comparison") or Refresh Scenario (if different source)
  * Edit (rename)
  * Copy
  * Delete
* Advisers can add a new scenario by clicking the "Add" button
* Advisers can toggle "Include in Plan" to mark scenarios for inclusion in the advice plan
* Clicking a scenario name navigates to the scenario detail view
* If no scenarios exist, the message "No insurance scenarios. Click Add to create a comparison." is displayed

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### SA-2.2 Advisers can create an insurance comparison scenario so that they can configure client details and cover requirements

<u>Acceptance Criteria</u>

* When the adviser clicks "Add" from the Insurance Research page, a creation dialog opens
* The adviser must first configure the scenario:
  * Scenario Name
    * Mandatory
    * Text field
    * Empty by default
    * Must not duplicate an existing scenario name
  * For
    * Mandatory
    * Radio selection
    * Options: "Client Only"; if the client has a partner, also "Partner Only" and "Client & Partner"
    * Default: "Client & Partner" if partner exists, otherwise "Client Only"
* After creating, the adviser is taken to the Personal Details screen to enter client information

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### SA-2.3 Advisers can enter client personal details so that quotes can be generated based on accurate client information

<u>Acceptance Criteria</u>

* The Personal Details screen allows the adviser to enter information for each life insured (client and/or partner, based on case type)
* For each life insured, the following fields are available:
  * First Name
    * Mandatory
    * Text field
    * Default: pre-populated from Factfind data
  * Last Name
    * Mandatory
    * Text field
    * Default: pre-populated from Factfind data
  * Date of Birth
    * Mandatory
    * Date picker (DD/MM/YYYY format)
    * Default: pre-populated from Factfind data; calculated from age
  * Age
    * Read-only (calculated from Date of Birth)
    * Numeric display
  * Gender
    * Mandatory
    * Dropdown
    * Options: Male, Female
    * Default: pre-populated from Factfind data
  * State
    * Mandatory
    * Dropdown
    * Options: QLD, VIC, NSW, SA, WA, TAS, NT, ACT
    * Default: pre-populated from Factfind data
  * Smoker Status
    * Mandatory
    * Toggle (Yes/No)
    * Default: pre-populated from Factfind data
  * Occupation
    * Mandatory
    * Searchable autocomplete field
    * Shows loading spinner during API search
    * Default: null
  * Employment Status
    * Mandatory
    * Dropdown
    * Options: Employee, Sole Trader, Partnership, Business Owner, Home Duties, Retired, Pensioner, Unemployed, Student
    * Default: pre-populated from Factfind data for Employments where Main Occupation = Yes and mapped (Retired and Unemployed mapped as standard; Full-time, Part-time, and Casual mapped to Employee; Self Employed mapped to Business Owner); if no mapping, default to Employee
  * Health Discount
    * Mandatory
    * Toggle (Include/Exclude)
    * Default: Exclude
  * Annual Income
    * Mandatory
    * Currency field (AUD)
    * Default: pre-populated from Factfind data Income Sub Type "Ordinary Wages", else $0.00
  * Loadings (opens modal)
    * Per cover type (Life, TPD, Trauma, IP, Business Expenses)
    * Each has: Percentage (numeric), Dollar per $1,000 (numeric)
    * Default: all zeros

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Occupation search calls the OmniLife Occupations API; results should be debounced to avoid excessive API calls

---

### SA-2.4 Advisers can manage existing insurance policies so that current coverage can be considered during comparison

<u>Acceptance Criteria</u>

* The Current Situation section displays a collapsible panel showing existing policies
* Advisers can add an existing cover by clicking the "Add Existing Cover" button
* Existing policies are displayed in a table grouped by life insured (Client/Partner) with columns:
  * Policy Description (provider name and policy description, with green "Linked" badge if linked to a research portfolio)
  * Super (premium amount and frequency)
  * Non Super (premium amount and frequency)
  * Premium (pa) (annualised total)
  * Action (dropdown)
* Each policy row has the following actions:
  * Edit (pencil icon)
  * Remove (X icon)
  * Link to supplier/products (Link2 icon, opens the Map Product Modal)
* Policies that have been linked to a research portfolio display a green "Linked" badge and green Link2 icon
* The Action dropdown for each policy provides options: Not Considered, Review, Replace, Retain
* When expanded, each policy shows a sub-table of covers with columns:
  * Cover (cover type label e.g. Life, TPD, Trauma, Income Protection /month)
  * Ownership (read-only label derived from ownership code: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink)
  * Owner (editable dropdown — see Owner Dropdown below)
  * Benefit Amount (formatted currency, right-aligned)
  * Super (read-only checkbox, checked if cover super = 'Yes')
  * Life Insured (name of the life insured)
* If no existing policies exist, the message "No existing policies" is displayed

**Owner Dropdown (Current Situation Covers):**

* Each cover row has an editable Owner dropdown allowing the user to select any entity in the scenario
* Available options:
  * Client name
  * Partner name (if partner exists)
  * SMSF
  * Super Fund
  * Any previously added custom owners
  * "+ Add..." option (opens Add Owner Modal)
* Default: Life Insured name when a new policy is added
* Custom owners added via the modal are appended to the Owner list of all covers across all policies

**Add Owner Modal:**

* Triggered by selecting "+ Add..." from the Owner dropdown
* Modal with a single text input for the owner name
* Save button adds the new owner to the custom owners list and sets it as the owner for the target cover
* Cancel button closes without changes

**Adding/Editing an Existing Policy (Full-Page Form):**

* The Add/Edit Existing Cover screen is a full-page form (not a modal) with the same layout design as the Vary Existing Cover page
* The screen has a title bar with "Add Existing Cover" or "Edit Existing Cover" title and Save/Cancel buttons
* An error banner is displayed above the form when validation fails (dismissible)
* The following fields are available:
  * Provider
    * Optional
    * Searchable autocomplete input with dropdown suggestions
    * Fetches suppliers from useLegacySuppliers() on mount
    * Shows loading spinner while fetching
    * Typing filters suppliers (case-insensitive, max 20 shown)
    * Empty by default
  * Policy Description
    * Optional
    * Text field
    * Empty by default
  * Life Insured
    * Mandatory
    * Dropdown: Client name / Partner name
    * Partner option only shown if partner data exists
    * Default: Client

* **Premium Details Section:**
  * Displayed in a grid with columns: Premium, Stamp Duty, Frequency
  * Super row:
    * Premium (currency input, decimal, default: '0')
    * Stamp Duty (currency input, decimal, default: '0')
    * Frequency (dropdown: Yearly, Half-yearly, Quarterly, Monthly, Fortnightly, Weekly; default: Monthly)
  * Non-Super row:
    * Premium (currency input, decimal, default: '0')
    * Stamp Duty (currency input, decimal, default: '0')
    * Frequency (dropdown: same options; default: Monthly)
  * Total Premium row:
    * Read-only calculated field
    * Annualises both premium rows using frequency multipliers then sums
    * If frequencies differ: displayed as annual
    * Otherwise: displayed in the original frequency
    * Format: "$X,XXX.XX / frequency_label"

* **Cover Details Table (Horizontal Scrolling):**
  * 8 fixed cover type rows displayed in order: Life, TPD, Trauma, IP, BE, SBI, ChildCover, Needlestick
  * Columns vary by cover type (conditional visibility):

  | Column | Life | TPD | Trauma | IP | BE | SBI | ChildCover | Needlestick |
  |--------|------|-----|--------|----|----|-----|------------|-------------|
  | Sum Insured | Y | Y | Y | Y | Y | Y | Y | Y |
  | Premium Style | Y | Y | Y | Y | Y | Y | - | - |
  | Ownership | Y | Y | - | Y | - | - | - | - |
  | Super (read-only) | Y | Y | - | Y | - | - | - | - |
  | Definition | - | Y | - | Y | - | - | - | - |
  | Stand Alone | - | Y | Y | - | - | - | - | - |
  | Flexi-Linked | - | Y | Y | - | - | - | - | - |
  | Super-Linked | - | - | - | Y | - | Y | - | - |
  | Waiting Period | - | - | - | Y | Y | - | - | - |
  | Benefit Period | - | - | - | Y | - | - | - | - |
  | Add. Death Cover | - | - | - | - | - | Y | - | - |

  * **Conditional logic:**
    * Super field: Derived from Ownership (S/J/K/M = Yes, O = No); read-only
    * Stand Alone and Flexi-Linked: Mutually exclusive (setting one to Yes forces the other to No)
    * TPD Ownership SMSF SuperLink (K): Only available when Trauma exists with Stand Alone = Yes
    * Definition options: TPD = Any, Own, Super-linked, ADL; IP = Indemnity, Agreed Value
    * Premium Style options: Life/TPD/Trauma = Variable age-stepped, Blended, Variable to age 65, Variable to age 70; IP/BE/SBI = Variable age-stepped, Blended, Variable to age
    * Waiting Period options: IP = 14-730 days; BE = 14-90 days
    * Benefit Period options: IP only = 1 year to age 70

* **SuperLink Cover Splitting (TPD and IP):**
  * When saving a policy where TPD or Income Protection has Ownership set to SuperLink (code J) or SMSF SuperLink (code K), the system automatically creates **two** cover records from the single form entry:
    * **Item 1:** Super = Yes, superLinked = Yes. For TPD: Definition is set to "Any"
    * **Item 2:** Super = No, superLinked = Yes. For TPD: Definition is set to "Own"
  * Both items copy all other details from the original cover (sum insured, premium style, waiting period, benefit period, etc.)
  * Each split item receives a unique ID (original ID with `-super` / `-nonsuper` suffix)
  * This splitting ensures correct representation in the Recommendations page where super-linked covers display as two separate line items with appropriate Super flags and definitions

* **Validation Rules:**
  * At least one premium (super or non-super) must be greater than 0
  * Ownership is required for cover types where ownership is visible (Life, TPD, IP) and sum insured > 0
  * Only covers with sum insured > 0 are included in the saved policy

* **Save Output:**
  * Creates an ExistingPolicy with a generated id (`pol-${Date.now()}`)
  * Action defaults to "Not Considered"
  * Provider defaults to "Unknown" if left empty

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* SMSF SuperLink ownership is only valid for TPD when Trauma has a value AND Stand Alone is set to Yes

---

### SA-2.5 Advisers can link existing policies to research portfolios so that existing coverage is included in quote comparisons

<u>Acceptance Criteria</u>

* Advisers can click the Link icon on an existing policy to open the Map Product Modal
* The modal has two operational modes: Auto-mode (default) and Manual-mode (toggled via checkbox)

**Supplier & Portfolio Selection:**

* Supplier filter
  * Optional
  * Text field
  * Placeholder: "Search Suppliers"
  * Filters the supplier dropdown as the user types (case-insensitive)
* Supplier
  * Mandatory
  * Dropdown (populated from Legacy Portfolios API)
  * Shows loading spinner while fetching
  * Shows error message if API fails
  * Selecting a supplier resets revision date, products, and selections
* PDS Issue Date
  * Mandatory
  * Dropdown (populated from selected supplier's revision dates, formatted as DD MMM YYYY)
  * Only shown when a supplier is selected
  * Selecting a date triggers product fetch via Legacy Products API
* Manually Link Cover
  * Optional
  * Checkbox toggle
  * Default: unchecked (auto-mode based on existing covers)
  * Only shown when supplier and date are selected
  * Toggling resets product selections

**Auto-Mode (Default):**

* Covers from the existing policy are automatically grouped into linked/standalone combinations:
  * Life Group: Life (TRM) as primary, with optional TPD Extension (TPE) if TPD exists and is not standalone, and optional Trauma Extension (TRE) if Trauma exists and is not standalone
  * Standalone Trauma + Linked TPD: Trauma Standalone (TRS) as primary with TPD Extension (TPR)
  * Individual Covers: All remaining covers mapped to their need codes (e.g. standalone TPD to TPS, IP to INC, BE to BUS)
* Active sections are filtered to match the policy's cover groups
* Products are filtered by ownership match and extension support
* Extension checkboxes are shown only if the selected product supports them

**Manual-Mode:**

* Shows all 7 cover type sections: Life, TPD, Trauma, Income Protection, Business Expenses, Needle Stick, Child Trauma
* Each section has a product dropdown populated from the Legacy Products API
* Extension checkboxes where applicable:
  * Life: "Include TPD Extension", "Include Trauma Extension"
  * Trauma: "Include Total and Permanent Disability extension"
* Products filtered to those supporting the section's cover type and all selected extensions

**Total Annual Premium:**

* Displayed when supplier and date are selected
* Table with columns: Super, Non Super, Premium (total)
* Rows: Premium, Stamp Duty
* Super and Non Super fields are editable currency inputs
* Premium column is calculated automatically (sum of Super + Non Super)
* Default values derived from the existing policy's annualised premiums

**Save & Validation:**

* The Add button is disabled until:
  * Auto-mode: All active sections have a product selected
  * Manual-mode: At least one product is selected
* All research portfolios have `existingCover` set to `true` regardless of mode
* Linked policies display a green "Linked" badge in the Current Situation table
* Only linked policies are included in the research portfolios sent to the quote API

**State Restoration:**

* When re-opening a previously linked policy, the modal restores:
  * Supplier selection, revision date, manual link mode
  * Product selections and extension flags
  * Premium and stamp duty values

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* The modal calls the OmniLife Legacy Suppliers, Legacy Portfolios, and Legacy Products APIs to populate dropdowns

---

### SA-2.6 Advisers can perform a needs analysis so that they can calculate insurance shortfalls and inform cover requirements

<u>Acceptance Criteria</u>

* Clicking "Launch Needs Analysis" from the Cover Selection action buttons opens the Needs Analysis page as a full-page view
* A "← Back to Personal Details" link at the top returns to the Personal Details page

**Sidebar Navigation:**

* A left sidebar (192px wide) displays tabs for each life insured:
  * Client Needs (always shown)
  * Partner Needs (only shown if partner data exists)
* The active tab is highlighted in blue; clicking a tab switches the main content area
* Default: Client Needs is active

**Requirements Header:**

* Displays "Requirements - [Client/Partner name]" as a section title
* An "Options" button (with a Settings icon) opens the Insurance Selection modal

**Insurance Selection Modal (Options):**

* A modal with checkboxes to toggle which insurance types are visible as table columns:
  * Life Insurance (default: checked)
  * TPD Insurance (default: checked)
  * Trauma Insurance (default: checked)
  * Income Protection (default: checked)
  * Business Expense (default: unchecked)
* Toggling a checkbox immediately shows/hides the corresponding column in the table
* A "Done" button closes the modal

**Requirements Table:**

* The table displays a row-label column on the left, followed by one column for each enabled insurance type (Life, TPD, Trauma, Income Protection pa, Business Expenses pa)
* All currency input cells are right-aligned, 100px wide, and format as Australian currency on blur

**Capital Requirements Section:**

* Section header: "Capital Requirements" (slate background)
* Editable rows for Life, TPD, and Trauma columns:
  * Liabilities to clear (Optional, Currency field, Default: $0)
  * Future Expenditure Required (Optional, Currency field, Default: $0)
  * Future Education Expenses (Optional, Currency field, Default: $0)
  * Medical costs/Recovery income (Optional, Currency field, Default: $0)
  * Provision for Tax (Optional, Currency field, Default: $0)
  * Other (Optional, Currency field, Default: $0)
* **Total Capital Required** (calculated summary row, slate background):
  * Life, TPD, Trauma columns: read-only, sum of all Capital Requirements rows for that column
  * Income Protection column: editable currency field (direct entry of annual income protection need)
    * Default: 70% of the client's annual income (auto-populated on first load if income > $0)
  * Business Expenses column: editable currency field (direct entry of annual business expenses need)
    * Default: $0

**Capital Provisions Section:**

* Section header: "Capital Provisions" (slate background)
* Editable rows for Life, TPD, and Trauma columns:
  * Disposable Assets (Optional, Currency field, Default: $0)
  * Super (Optional, Currency field, Default: $0)
  * Continuing Income (Optional, Currency field, Default: $0)
* **Total Capital Available** (calculated summary row, slate background):
  * Life, TPD, Trauma columns: read-only, sum of all Capital Provisions rows for that column
  * Income Protection and Business Expenses columns: not shown

**Insurance Needs Section:**

* Section header: "Insurance Needs" (slate background)
* **Total Cover Required** (calculated row):
  * Life, TPD, Trauma: Maximum of zero or (Total Capital Required minus Total Capital Available)
  * Income Protection: Direct value from the Income Protection input
  * Business Expenses: Direct value from the Business Expenses input

**Surplus/Shortfall Row:**

* Label displayed as underlined blue text ("Surplus/Shortfall")
* Calculation:
  * Life, TPD, Trauma: Total Capital Available minus Total Capital Required
  * Income Protection: Negated Income Protection value (always shown as shortfall)
  * Business Expenses: Negated Business Expenses value (always shown as shortfall)
* Negative values are displayed in red; non-negative values in default text colour

**Data Persistence:**

* All values are persisted in state and maintained when switching between Client and Partner tabs
* The computed shortfalls are passed to the Needs Editor as reference values when configuring quotes

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### SA-2.7 Advisers can view client information so that they can access insurance research from the client context

<u>Acceptance Criteria</u>

* Advisers can navigate to the Client page from the main navigation
* The page header displays:
  * Client avatar/icon
  * Client name(s) with status badge (e.g. Active)
  * Xplan ID
  * Last Import Date
  * More actions menu
* The page provides the following tabs:
  * Fact Find (placeholder)
  * Plans (placeholder)
  * Reviews (placeholder)
  * Related Entities (table with filters)
  * Research (with sub-tabs: Insurance, Investment)

**Research Tab — Insurance Sub-tab:**

* The Insurance sub-tab is active by default within the Research tab
* Displays the full Insurance Research content (same as the standalone Insurance Research page — see SA-2.1)
* Advisers can view, create, edit, and delete insurance comparison scenarios
* Scenario table columns, dropdown actions, and "Add" functionality are identical to the standalone Insurance Research page
* Advisers can navigate from a scenario row into the full insurance comparison workflow (Personal Details, Quote Configuration, Quote Results, Product Comparison)
* "Include in Plan" toggle is available on each scenario row

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

> **Missing details:** Factfind data import mechanism — how is client data sourced from Xplan? Is it a one-time import, periodic sync, or on-demand fetch? What fields are available from the Factfind? How are Related Entities populated?

---

## SA-3 — Cover Configuration

> Should be built together with or in close sequence to SA-2 — they form the input to the quote engine.

### SA-3.1 Advisers can manage quote sets in the Cover Selection panel so that they can define which covers to quote for each life insured

<u>Acceptance Criteria</u>

* The Cover Selection section is displayed below the Current Situation section on the Personal Details page
* The section has a collapsible header titled "Cover Selection" with a Settings icon and collapse/expand toggle
* When collapsed, only the header is visible; when expanded, the full quotes table and action buttons are shown
* The section defaults to expanded

**Quotes Table:**

* A "Quotes" label is displayed on the left with a "+ Add Quote" button on the right
* Quotes are displayed in a table with the following columns:
  * Actions (row action icons)
  * Quote Name (inline editable text field)
  * Life Insured (read-only, displays client or partner name)
  * Covers (read-only, comma-separated list of enabled cover types e.g. "Life, TPD Extension to Life, Income Protection")
  * Quoted (read-only, displays the date the quote was last generated, or an em-dash if not yet quoted)
  * Edit (button to open the quote configuration editor)
* If no quotes exist, the message "No quotes added yet. Click + Add Quote to begin." is displayed

**Row Actions:**

* Each quote row has three action icons:
  * Edit (pencil icon, blue) — opens the quote configuration editor for that quote
  * Copy (copy icon) — duplicates the quote with " (Copy)" appended to the name, inserted immediately after the original
  * Delete (trash icon) — removes the quote from the list without confirmation

**Inline Quote Name Editing:**

* Quote Name
  * Mandatory
  * Text field (inline, max width 200px)
  * Default: auto-incremented name (e.g. "Quote 1", "Quote 2")
  * Changes are applied immediately (no save button required)

**+ Add Quote Button:**

* Clicking "+ Add Quote" creates a new quote with:
  * A unique identifier
  * An auto-incremented name (e.g. "Quote 1", "Quote 2", based on current count)
  * Life Insured defaulting to Client
  * No covers enabled
  * Super and Non-Super frequency defaulting to Workspace defaults
* After creation, the quote configuration editor opens automatically for the new quote

**Edit Button:**

* Clicking "Edit" on a row opens the full-page quote configuration editor (NeedsEditor) for that quote
* The editor allows the adviser to configure cover types, sum insured amounts, and cover options
* The editor has Save and Cancel buttons; Save persists changes and returns to the Personal Details page, Cancel discards changes

**Action Buttons (below the quotes table):**

* Three action buttons are displayed in a centred row:
  * Launch Needs Analysis
    * Always enabled
    * Teal background button
  * Get Quotes
    * Teal background button
    * Disabled when no quotes exist in the Cover Selection table
    * Tooltip when disabled: "Add at least one quote to the Cover Selection section"
    * Reruns all quotes
  * Next
    * Outline button
    * Disabled until quotes have been generated (Get Quotes has been run)
    * Tooltip when disabled: "Run Get Quotes first to view results"
    * Navigates to the Quote Results page
    * Only runs quotes that have no Quote date set; does not rerun previously quoted quotes

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### SA-3.2 Advisers can configure quote covers via the Needs Editor so that they can specify which insurance needs to include in a quote

<u>Acceptance Criteria</u>

* Clicking "Edit" on a quote row in the Cover Selection table (or the pencil icon) opens the Needs Editor as a full-page view replacing the Personal Details page
* The page has a header bar titled "Needs Editor — [Quote Name]" with a back arrow to return without saving
* All dropdown and currency field defaults are populated from the Workspace Preferences (see SA-12.1); the values listed below are the system defaults when no preferences have been configured

**Header Fields:**

* Quote Name
  * Mandatory
  * Text field
  * Default: inherited from the quote (e.g. "Quote 1")
* Life Insured
  * Mandatory
  * Dropdown
  * Options: Client name, Partner name (partner only shown if partner data exists)
  * Default: Client
* Super Frequency
  * Mandatory
  * Dropdown
  * Options: Weekly, Fortnightly, Monthly, Quarterly, Half Yearly, Yearly
  * Default: Based on Workspace preferences
* Non-Super Frequency
  * Mandatory
  * Dropdown
  * Options: Weekly, Fortnightly, Monthly, Quarterly, Half Yearly, Yearly
  * Default: Based on Workspace preferences

**+ Add Need Button:**

* Displays a dropdown menu listing available need types that have not yet been added
* Available need types: Life, TPD Standalone, Trauma Standalone, Income Protection, Business Expenses, Needle Stick, Child Trauma
* The button is hidden when all 7 need types have been added
* Adding a need creates it with default values from Workspace preferences and automatically expands its section

**Need Sections:**

* Each added need is displayed as a collapsible card with:
  * A header showing the need type label (bold), with a chevron toggle and a trash icon to remove the need
  * Linked needs are indented below their parent with a teal left border and tinted background
  * A "Required Features" link below the fields showing selected feature count (opens a modal with feature checkboxes specific to the need type)
* Advisers can expand/collapse individual need sections by clicking the header

**Life (TRM):**

* Sum Insured (Mandatory, Currency field, Default: Based on Workspace preferences)
* Structure (Mandatory, Dropdown, Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70, Default: Based on Workspace preferences)
* Owner (Mandatory, Dropdown, Options: Non-Super, SMSF, Super, Default: Based on Workspace preferences)
* Rollover (Mandatory, Dropdown, Options: Include if possible, Exclude, Default: Based on Workspace preferences)
* Premium Waiver (Mandatory, Dropdown, Options: Include if possible, Include, Exclude, Default: Based on Workspace preferences)

**TPD Extension to Life (TPE) — linked to Life:**

* Sum Insured (Mandatory, Currency field, Default: Based on Workspace preferences)
* Structure (Mandatory, Dropdown, Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70, Default: Based on Workspace preferences)
* Owner (Mandatory, Dropdown, Options: Non-Super, SMSF, Super, SuperLink, Default: Based on Workspace preferences)
* Rollover (Mandatory, Dropdown, Options: Include if possible, Exclude, Default: Based on Workspace preferences)
* Occupation Type (Mandatory, Dropdown, Options: Any, Own, Homemaker, ADL, Best available, Default: Based on Workspace preferences)
* Life Buy Back (Mandatory, Dropdown, Options: Lowest premium, Fastest available, None, Immediate, 1 year, Default: Based on Workspace preferences)
* Double TPD (Mandatory, Dropdown, Options: Exclude if possible, Include, Exclude, Default: Based on Workspace preferences)
* Premium Waiver (Mandatory, Dropdown, Options: Include if possible, Include, Exclude, Default: Based on Workspace preferences)

**Trauma Extension to Life (TRE) — linked to Life:**

* Sum Insured (Mandatory, Currency field, Default: Based on Workspace preferences)
* Structure (Mandatory, Dropdown, Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70, Default: Based on Workspace preferences)
* Life Buy Back (Mandatory, Dropdown, Options: Lowest premium, Fastest available, None, 1 year, 3 years, Default: Based on Workspace preferences)
* Double Trauma (Mandatory, Dropdown, Options: Exclude if possible, Include, Exclude, Default: Based on Workspace preferences)
* Trauma Reinstatement (Mandatory, Dropdown, Options: Exclude if possible, Include, Exclude, Default: Based on Workspace preferences)
* Premium Waiver (Mandatory, Dropdown, Options: Include if possible, Include, Exclude, Default: Based on Workspace preferences)
* Baby Care (Mandatory, Dropdown, Options: Exclude if possible, Include if possible, Include, Exclude, Default: Based on Workspace preferences)
* Priority (Mandatory, Dropdown, Options: Cheapest, Best, Intermediate, Default: Based on Workspace preferences)

**TPD Standalone (TPS):**

* Sum Insured, Structure, Owner (Non-Super, SMSF, Super, SuperLink), Rollover, Occupation Type, Premium Waiver — all Mandatory, Dropdown, Default: Based on Workspace preferences

**Trauma Standalone (TRS):**

* Sum Insured, Structure, Trauma Reinstatement, Premium Waiver, Baby Care, Priority — all Mandatory, Dropdown, Default: Based on Workspace preferences

**TPD Extension to Trauma (TPR) — linked to Trauma Standalone:**

* Sum Insured, Structure, Owner (Non-Super, SMSF, Super, SuperLink, SMSF SuperLink), Rollover, Occupation Type, Premium Waiver — all Mandatory, Dropdown, Default: Based on Workspace preferences

**Income Protection (INC):**

* Monthly Benefit (Mandatory, Currency field, Default: Based on Workspace preferences)
* Super Contribution (Mandatory, Currency field, Default: $0)
* Structure (Options: Variable age-stepped, Blended, Variable)
* Owner (Options: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink)
* Rollover, Agreed Value, Accident Benefit, Increase Claim Benefit, Waiting Period, Benefit Period, Replacement Ratio, Priority — all Mandatory, Dropdown, Default: Based on Workspace preferences

**Business Expenses (BUS):**

* Monthly Benefit (Mandatory, Currency field, Default: Based on Workspace preferences)
* Structure (Options: Variable age-stepped, Blended, Variable)
* Waiting Period (Options: 14 days, 30 days, 60 days, 90 days)
* Benefit Period (Read-only, Fixed: 1 year)

**Needle Stick (NES):**

* Sum Insured (Mandatory, Currency field, Default: Based on Workspace preferences)
* Structure (Options: Variable age-stepped, Variable)

**Child Trauma (CHT):**

* Displays a list of children (maximum 9)
* Advisers can add a child by clicking "+ Add Child"
* Each child has: Sum Insured (Mandatory, Currency, Default: $0), Date of Birth (Mandatory, Date picker), Age (Read-only), Gender (Mandatory, Dropdown: Male/Female, Default: Male)
* Advisers can remove individual children via a trash icon

**Footer:**

* Preview JSON button (toggle) — shows the serialised needs payload in a dark code panel with a Copy button
* Cancel button — returns to the Cover Selection table without saving
* Save Quote button (teal) — saves the configured needs and returns to the Cover Selection table

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## SA-4 — APL Management

> Should be delivered before or alongside SA-5 — the supplier filter directly affects what the comparison table shows.

### SA-4.1 Advisers can configure the Approved Product List so that quotes only include authorised providers

<u>Acceptance Criteria</u>

* **[PLACEHOLDER — this store and area still needs to be created]**
* Advisers can access the APL configuration from the settings area
* The APL determines which insurance providers and products are eligible for quoting
* Two APL modes are available: Adviser (organisation-level) and User (individual)
* The active APL mode is selected in Workspace Preferences (Global Options tab)
* Providers not on the APL are excluded from quote results

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

> **Missing details:** Full APL management UI — how are providers added/removed? Is there a master list? Can individual products within a provider be toggled? How does the "Adviser" vs "User" APL mode work — is the Adviser APL centrally managed? What is the data model for storing APL selections?

---

## SA-5 — Quote Generation

> Tightly coupled with SA-6 (Scoring) and should be treated as a single delivery increment.

### SA-5.1 Advisers can view and compare insurance quotes so that they can identify the best products for their clients

<u>Acceptance Criteria</u>

The Quote Results screen is the primary workspace for reviewing generated quotes. It is composed of four distinct layout regions: a Client Summary Bar, a Navigation Bar, a Quote Details sidebar (left), and the Results Panel (centre/right). When a result row is selected, an Additional Information panel opens on the right.

**5.1.1 — Client Summary Bar**

* Contains toggle buttons for each life insured:
  * Client button — displays client first + last name; highlighted when active
  * Partner button — displays partner first + last name; highlighted when active; only shown for Client & Partner cases
* Toggling the active client:
  * Switches all quote results, quote cards, and sidebar data to the selected life insured
  * Resets the selected quote indices (returns to "All Quotes" view)
* Displays read-only attribute badges for the active life insured: Age, Gender, Smoker status, Annual income, Occupation

**5.1.2 — Navigation Bar**

* "← Personal Details" back link — returns to the Personal Details screen
* Loading indicator — shows a spinner and "Fetching quotes…" text while quotes are being generated
* Error indicator — shows "Quote error: [message]" in red when a quote request fails
* "Save to Scenario" button (right-aligned) — navigates to the Scenario Review page

**5.1.3 — Quote Details Sidebar (Left Panel)**

* Header: "Quote Details"
* **"All Quotes" Toggle:** clears selected quote indices, showing combined results for all quotes belonging to the active life insured
* **Quote Cards** (one per quote for the active life insured):
  * Card header: Checkbox, Quote name (bold, clickable), "Life Insured: [Name]" sub-label, Edit button (SquarePen icon)
  * Card content: Needs summary lines (one row per need with label, structure, and value), linked needs indented, "No needs configured" placeholder, premium frequency row, quote generated date with "Requote" button

**5.1.4 — Results Toolbar**

* "All GRAPHS" toggle button — toggles between table view and graph view
* "VIEW / COMPARE FEATURES" button — navigates to Features Comparison page; disabled when "All Quotes" is selected
* "DOWNLOAD REPORT" button — downloads reports of the current selected results (report format to be defined in separate story)
* Search field — filters results table and excluded products in real-time by supplier name, portfolio name, and product names (case-insensitive)

**5.1.5 — Results Table**

* Sortable columns: Checkbox, Insurer, Products, Premiums, [N]y Cumulative Premiums, Feature Score, Value Score, Rec
* Default sort: Premium ascending; existing cover rows always sorted to bottom
* Table rows show: checkbox, insurer logo (with initials fallback), product names, premium breakdown (Super/Non-Super with frequency), cumulative premiums (annualised), feature score badge (green > 80, yellow 50–80, red < 50), value score badge, Rec/Alt toggle buttons (hidden for existing cover rows)
* Row interaction: clicking opens Additional Information panel; selected row highlighted

**5.1.6 — Excluded Products Section**

* Collapsible section below results table (default: collapsed)
* Shows one row per excluded portfolio with: insurer info, "Reasons for Exclusion" link, error messages, PDS link, TMD link

**5.1.7 — Additional Information Panel (Right Sidebar)**

* Resizable (280px–600px, default 360px)
* Header: "Additional Information : [Supplier Name]"
* Supplier & Product section: logo, portfolio name, product names
* Details section: Occupation link (opens Occupation Details Modal), TPD Occ Class
* Tabs: Summary (default for new quotes, hidden for existing covers), Notes (shown when top/bottom features exist), Links (shown when PDS/TMD exist, default for existing covers)
* Summary Tab: Premium Breakdown (Super/Non-Super sections), Total Premium Footer (emerald when validated), Validate Premium button, Commissions Table (Upfront/Ongoing)
* Notes Tab: Strengths and Limitations lists
* Links Tab: PDS and TMD download links

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Premium annualisation uses frequency multipliers: Yearly=1, Half-yearly=2, Quarterly=4, Monthly=12, Fortnightly=26, Weekly=52
* When Super and Non-Super frequencies differ, each component is annualised separately before being summed
* Frequency-keyed premium maps (FreqPremiumMap) are used throughout
* Commission annualised values are calculated as: commission amount at the non-super frequency × the corresponding annual multiplier
* Premium validation calls the OmniLife Validation API with the portfolio code and full quote request body; "Success" response marks the row as validated

---

### SA-5.2 The system parses resolved needs from the quote API so that cover details reflect the actual product configuration

<u>Acceptance Criteria</u>

* The quote portfolio API response includes `resolvedNeeds` on each product within a portfolio
* Each resolved need is an object keyed by the need code (e.g. `{ TRM: { sumInsured: 500000, structure: "S", ... } }`)
* The system parses resolved needs into a `ResolvedCover` structure with the following fields:
  * needCode (TRM, TPE, TRE, TPS, TRS, TPR, INC, BUS, NES, CHT)
  * isLinked (true if this is a linked extension under a parent need)
  * parentNeedCode (the parent need code if linked)
  * sumInsured (numeric amount)
  * monthlyBenefit (numeric amount, for IP/BUS covers)
  * structure (S = Variable age-stepped, B = Blended, L = Level, 70 = Level to age 70)
  * owner (O = Non-Super, M = SMSF, S = Super, J = SuperLink, K = SMSF SuperLink)
  * occupationType (A = Any, O = Own, H = Homemaker, D = ADL, E = Best available)
  * waitingPeriod (days: 14, 30, 60, 90, 180, 365, 730)
  * benefitPeriod (years/age: 1, 2, 5, 55, 60, 65, 67, 70)
  * definition (cover definition text)
  * rollover, premiumWaiver, lifeBuyBack, doubleTPD, doubleTrauma, traumaReinstatement, babyCare, priority, agreedValue
* Linked needs are flattened alongside their parent needs (parsed from the `linkedNeeds` array within each resolved need)
* Resolved covers are stored on `QuoteResultRow.resolvedCovers`
* The Scenario Review page uses resolved covers to build richer cover details when available

<u>Designs</u>

* N/A — data layer only

<u>Security and Technical Considerations</u>

* None

---

## SA-6 — Scoring

> Tightly coupled with SA-5 and should be treated as a single delivery increment.

### SA-6.1 The system calculates feature and value scores so that advisers can objectively compare products

<u>Acceptance Criteria</u>

* **[PLACEHOLDER — scoring logic requires detailed specification]**
* Feature scores are displayed on the Quote Results table as colour-coded badges (green > 80, yellow 50–80, red < 50)
* Value scores combine feature scores with premium data to produce a cost-effectiveness ranking
* Existing cover rows display "N/A" for value score
* Scores are calculated from the OmniLife API response data (feature weightings, feature counts)
* The scoring weighting type is configurable (default: Balanced)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

> **Missing details:** Detailed scoring algorithm — how are feature scores calculated? What weighting types are available besides "Balanced"? How are value scores derived from feature scores and premiums? Is scoring performed client-side or returned by the API?

---

## SA-7 — Research

> Depends on SA-5 and requires the Research module to be licensed from Omnium. Should be treated as a second-phase feature.

### SA-7.1 Advisers can compare product features side by side so that they can evaluate insurance products in detail

<u>Acceptance Criteria</u>

* When viewing a single Quote, advisers can select multiple products from the quote results and click "View / Compare Features" to open the Features Comparison page
* The page calls the OmniLife Portfolio Features API with the selected products' supplier codes, product codes, and revision dates
* While loading, a spinner is displayed with the message "Fetching product features..."
* If the API call fails, an error message is displayed with a "Back to Quotes" button
* Features are displayed in a table with:
  * A sticky left column showing the feature name ("Comparison Parameter")
  * One column per selected product (180–260px wide) showing the supplier name, product names, annual premium, feature score badge, and PDS/SPDS date
  * Existing products are indicated with an "Existing" badge in the column header
* Features are grouped hierarchically:
  * Need Type level (collapsible, indigo background with white text, showing need type label and feature count)
  * Heading level (collapsible, slate background with weighting label: Lowest/Low/Moderate/High/Highest)
  * Feature level (individual rows with per-product cells)
* Each feature cell displays:
  * Strengths section
  * Limitations section
  * Commentary section
  * Feature Text section
  * A dash "---" if the product does not have the feature
* Advisers can search features by name using a text search field
* Advisers can toggle a Filters panel (slide-out from right, 320px wide) with:
  * Feature Text toggle (YES/NO) — shows/hides detailed feature text
  * Differences Only toggle (YES/NO) — filters to only show features that differ between products
  * Feature Score toggle (YES/NO) — shows/hides score badges in column headers
  * Show Profile Features checkbox
  * Show Benefit Features checkbox
  * Show Definition Features checkbox
  * Categories section: Search field, Select All checkbox, individual checkboxes per heading
  * Reset and Done buttons
* Advisers can collapse/expand individual need type and heading groups
* The bottom bar displays a summary: "Comparing X product(s) across Y feature(s) in Z cover(s)"
* Advisers can click "Download Report" to generate a printable report
* Advisers can click "Download and Save Report" to generate a printable report that will be saved against the scenario

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* The features API is called with query parameters: excludeSimilarities=false, coverNeedType=NeedType, scoreWeightingType=Balanced
* If Differences Only toggle is set to YES, change excludeSimilarities=true and rerun API call
* The PORTFOLIO_HEADING entry in the API response is skipped during parsing as it only contains portfolio names

---

### SA-7.2 Advisers can access supplier documents so that they can review PDS, adviser guides, and TMD documents

<u>Acceptance Criteria</u>

* The Documents dropdown is accessible from the top header bar of the Insurance Comparison dialog
* The dropdown provides four category options:
  * Documents — fetches PPDS documents with date filtering
  * Archived Documents — fetches PPDS documents without date filtering
  * Adviser Guides — fetches GUIDE documents
  * Target Market Determinations — fetches TMD documents
* Selecting a category opens the Supplier Documents Modal

**Supplier Documents Modal:**

* Modal displays a table of supplier documents fetched from the OmniLife Supplier Documents API
* The modal header shows the selected category name with navigation tabs for all four categories
* Active category tab is highlighted; clicking a different tab switches the category and re-fetches documents
* Table Columns: Supplier (sortable), Date Issued (DD/MM/YYYY, sortable — only for "Documents" category), Description (sortable), Link (external link icon)
* Sorting: clicking column header toggles ascending/descending; default sort by supplier ascending
* Pagination: page size selector (10, 25, 50), Previous/Next buttons, total document count
* Loading State: Spinner with "Fetching [category] documents..." message
* Error State: Red error message with document count showing 0
* Empty State: "No documents found." message

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Documents are fetched from the OmniLife Supplier Documents API via the proxy layer
* Document URLs are opened in new tabs; the application does not host document content

---

## SA-8 — Portfolio Selection

> Depends on SA-5 and SA-7 being present, or at minimum SA-5.

### SA-8.1 Advisers can review and finalise insurance recommendations so that they can save a complete scenario

<u>Acceptance Criteria</u>

* The Scenario Review page is accessed by clicking "Save to Scenario" from the quote results screen
* Product details are referenced back to the quoting system using the Quote ID and the Existing Cover
* Products are retained and are not removed or rerun when new quotes are created
* The page displays a header bar with breadcrumb "Insurance Research > Scenarios > [Scenario Name]" and a back button

**Top-Level Review Table:**

* Products are displayed in a table with columns:
  * Expand toggle (chevron icon to show/hide cover details)
  * Policy Details (insurer logo, policy name, insurer name)
  * Super (premium amount with frequency suffix; "N/A" if zero)
  * Non-Super (premium amount with frequency suffix; "N/A" if zero)
  * Premium (total premium amount with frequency suffix)
  * Status (inline editable dropdown with colour-coded pill)
  * View Details (Eye icon button, opens Product Details Modal)

* Products are grouped into sections with colour-coded headers:
  * Existing Covers (amber background, count shown)
  * Recommendations (emerald background, count shown)
  * Vary to Existing (purple background, count shown)
  * Alternatives (blue background, count shown)

* The Status dropdown options vary by item type:
  * Existing Policies: Hold, Replace, Cancel, Vary, Exclude
  * Recommended Products: Recommend, Not Accepted
  * Alternative Products: Alternative, Not Accepted, Like for Like
  * Varied Products: All statuses (Recommend, Not Accepted, Alternative, Hold, Replace, Cancel, Vary, Exclude, Vary to Existing)

* Status colours:
  * Recommend: Emerald, Not Accepted: Slate, Alternative: Blue, Hold: Amber, Replace: Red, Cancel: Red, Vary: Purple, Exclude: Slate, Vary to Existing: Purple, Like for Like: Indigo

* **Status-Triggered Actions:**
  * Setting an existing policy to "Vary" opens the Vary Existing Cover page
  * Setting an existing policy to "Replace" opens the Replacement Analysis Modal
  * All other statuses apply directly without triggering additional modals

* **Expandable Cover Details Sub-Table:**
  * Columns: Type, Description, Premium Structure, Cover Structure, Super (read-only checkbox), Owner (editable dropdown), Life Insured, Benefit Amount, Benefit Period, Waiting Period
  * Cover Structure Derivation for Existing Covers:
    * TPD: superLinked → "Super-Linked", standAlone → "Standalone", flexiLinked → "Flexi-linked", else → "Linked"
    * Trauma: no Life cover → "Standalone", standAlone → "Standalone", flexiLinked → "Flexi-linked", else → "Linked"
    * All others: superLinked → "Super-Linked", standAlone → "Standalone", flexiLinked → "Linked", else → "Standalone"
  * Cover Structure for Recommended/Quote Covers:
    * Linked extensions → "Linked", Standalone covers → "Standalone"
    * SuperLink owner TPD → Two records: (1) Super=True, Definition=Any, Super-Linked; (2) Super=False, Definition=Own, Super-Linked
    * SuperLink owner IP → Two records: (1) Super=True, Super-Linked; (2) Super=False, Super-Linked

* **Owner Management:** Owners flow from Current Situation; custom owners shared across all dropdowns

* **Action Menu (per item):** [NEW]
  * Dropdown (⋯ icon) with context-sensitive options:
    * Recommended/Alternative items: "Like for Like" option (opens Like for Like Modal)
    * Manual recommendation option (for adding manual entries)
  * Visibility rules: "Like for Like" shown only for `rec` or `alt` type items

* Footer: "Back to Quotes" and "Save to Scenario" buttons
* Empty state: "No products to review. Go back and tag products as Rec or Alt."

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Premium annualisation uses frequency multipliers consistent with the rest of the application

---

### SA-8.2 Advisers can view and edit product details so that they can review the full premium and cover breakdown

<u>Acceptance Criteria</u>

* Clicking the Eye icon on any review row opens the Product Details Modal (720px wide, max 85vh)
* The modal header displays "Product Details" with a close button (X)

**Top-Level Fields:**

* Policy Name (Editable text field, Default: item label)
* Policy Status (Read-only display field)
* Underwriter (Editable text field, Default: insurer name)

**Three-Tab Interface:**

*Details Tab:*

* Premium (Super) — Read-only
* Super Frequency — Dropdown selector
* Date Generated — Read-only (DD/MM/YYYY)
* Premium (Non-Super) — Read-only
* Non-Super Frequency — Dropdown selector
* Policy Fee — Read-only (only shown if > 0)
* Total Premium — Read-only calculated field
* Total Premium Frequency — Dropdown selector

*Cover Tab (Table):*

* Columns: Type, Description, Premium Structure, Cover Structure, Super (read-only checkbox), Owner, Life Insured, Benefit Amount, Benefit Period, Waiting Period, View (Eye icon)
* Eye icon opens Cover Details sub-modal

*Fees Tab (Read-Only Table):*

* Two rows: Premium Year 1, Premium Renewal
* Columns: Premium Period, Comm. Premium ($), Comm. Frequency, Comm. (%), Comm. ($), Include (checkmark)

**Footer:** Close button (outline), Save button (teal — saves Policy Name and Underwriter)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### SA-8.3 Advisers can view individual cover details so that they can inspect the full resolved needs data for each cover

<u>Acceptance Criteria</u>

* Clicking the Eye icon on a cover row in the Product Details Modal opens the Cover Details sub-modal (680px wide, z-index 60)
* All fields are read-only, displayed in a 3-column grid layout:
  * Row 1: Cover Type, Cover Structure, Owner
  * Row 2: Life Insured, Premium Structure, Is Super
  * Row 3: Benefit Amount, Definition, Benefit Status
  * Row 4: Benefit Frequency, Benefit Period, Waiting Period
* Occupation Type row is not shown for TPD or IP covers
* Footer contains a Close button only

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## SA-9 — Insurer Actions

> Depends on SA-5 and SA-8 — actions are performed on a selected portfolio.

### SA-9.1 Advisers can vary existing policies so that they can model changes to current coverage

<u>Acceptance Criteria</u>

* When an existing policy's status is set to "Vary" in the Scenario Review page, the Vary Existing Cover page replaces the review table (full-page layout, not a modal)
* The page has a title bar displaying "Vary Existing Policy" with Save and Cancel buttons

**Policy Header Fields (3-column grid):**

* Provider — Read-only text field showing existing policy provider
* Policy Description — Editable text field
* Life Insured — Read-only text field showing client or partner name

**Premium Details Section:**

* Grid layout with column headers: Premium, Stamp Duty, Frequency
* Super row: Premium (editable currency), Stamp Duty (editable currency), Frequency (dropdown)
* Non-Super row: Premium (editable currency), Stamp Duty (editable currency), Frequency (dropdown)
* Total Premium summary: Read-only calculated; annualises both rows, sums, converts back; if frequencies differ, defaults to annual

**Cover Details Table:**

* Same structure and conditional column visibility as Add Existing Cover table (see SA-2.4)
* 8 cover type rows: Life, TPD, Trauma, IP, BE, SBI, ChildCover, Needlestick
* All cover fields are editable
* Mutual exclusivity rules apply for Stand Alone / Flexi-Linked
* Super field is read-only (derived from Ownership)

**Validation:**

* At least one premium (super or non-super) must be greater than 0
* Error displayed in an amber dismissible banner above the form

**Save Behaviour:**

* Creates a new varied policy (new id: `vary-${Date.now()}`, action: "Review")
* Only includes covers with sum insured > 0
* The original existing policy status is set to "Vary"
* A new "Vary to Existing" item is added to the review table
* Returns to the Scenario Review table

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### SA-9.2 Advisers can analyse replacement options so that they can compare existing cover with recommended products

<u>Acceptance Criteria</u>

* When an existing policy's status is set to "Replace" in the Scenario Review page, the Replacement Analysis Modal opens (1050px wide, max 92vh)
* The modal header displays "Replacement Analysis" with a subtitle showing the existing policy details (insurer, label, life insured)

**Existing Cover Summary (Amber Background):**

* Displays: Insurer name, Life Insured name, Premium p.a. (formatted currency)
* Cover badges showing each cover type label with sum insured amount
* "Link Products" text link (placeholder for linking to Map Product Modal)

**Replacement Candidate Selection:**

* Section header: "Select Replacement Products (X available)"
* List of recommended and varied products for the same life insured (no scroll constraint — grows to show all)
* Each candidate row shows:
  * Checkbox (toggle selection)
  * Insurer logo
  * Product name and insurer name
  * Type badge: "Recommend" (emerald) or "Vary to Existing" (purple)
  * Premium p.a. (annualised, displayed next to the type badge)
  * Loading spinner while comparison data is fetching
  * Error message if API call fails
* When a candidate is selected and has covers, an expanded section below shows a cover table (Type, Definition, Owner, Life Insured, Benefit Amount)

**Three-Tab Interface:**

*Differences in Benefits Tab:*

* For each selected candidate, displays a comparison section with header "vs. [Insurer] — [Product Name]"
* Feature groups: Features Gained (emerald), Features Improved (blue), Features Lost (red), Features Decreased (amber)
* Each group: collapsible header with feature count (deduplicated by code)
* Features have:
  * Select/Unselect All checkbox (positioned on the left side of the group header)
  * Parent checkbox (toggles feature inclusion)
  * Feature name
  * Sub-feature value items — each compared value and recommended value is independently selectable:
    * "Existing: [Existing Insurer] — [compared value]" with its own checkbox
    * "New: [Recommended Insurer] — [recommended value]" with its own checkbox
* Deduplication: features with the same code across cover types are merged
* Sub-feature filtering: values only shown when non-blank
* Empty states: "Select a replacement product above..." / "No feature differences found."
* Loading state: "Loading comparison..." with spinner

*Costs of Replacement Tab:*

* Free-form editable textarea (200px height)
* Placeholder text: exit fees, loyalty benefits, waiting periods, exclusions, premium differences

*Reasons for Replacement Tab:*

* Free-form editable textarea (200px height)
* Placeholder text: changed needs, better features, cost savings, improved definitions, insurer financial strength

**Footer:** Close button (outline, saves state), Save button (teal)

**API Integration:**

* Selecting a candidate triggers a call to `postGainedAndLost()` with the existing item's supplier/revision/products and the candidate's supplier/revision/products
* Results are cached per candidate (subsequent toggle does not re-fetch)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* The gained-and-lost API is called with parameters: coverNeedType=NeedType, includeSubFeatures=true

---

### SA-9.3 [NEW] Advisers can perform Like for Like comparison so that they can evaluate recommended products against existing coverage

<u>Acceptance Criteria</u>

* Advisers can initiate a Like for Like comparison from the Action Menu (⋯) on any Recommended or Alternative product in the Scenario Review page
* The Like for Like Modal opens (two top-level tabs: Details and Compare)

**Details Tab:**

* Displays a summary of the recommended product (insurer, product name, premiums, covers)
* Lists all existing policies for the same life insured as selectable items
* Each existing policy has a collapsible panel showing:
  * Checkbox to include/exclude the existing product from the comparison
  * Premium editing fields:
    * Super Premium (editable currency input, default from existing policy)
    * Non-Super Premium (editable currency input, default from existing policy)
    * Super Frequency (dropdown, default from existing policy)
    * Non-Super Frequency (dropdown, default from existing policy)
  * Cover details table (read-only, derived from the recommended item's covers)
  * "Link Products" button to open MapProductModal for linking a research portfolio to the existing product
* Only existing products that have been linked to a research portfolio can be compared in the Compare tab
* Multiple existing products can be selected simultaneously

**Compare Tab:**

* Calls the OmniLife Similarities and Differences API (`/api/similarities-and-differences`) with a single request containing:
  * The recommended product as payload position P0
  * Each linked existing product as P1, P2, etc.
* The comparison table displays:
  * One row per feature difference
  * Grouped by cover type with dark blue section headers
  * Columns: Feature Name, Recommended product (tick/cross based on P0 suffix in featureIncluded/featureExcluded), one column per selected existing product (tick/cross based on P1/P2 suffix)
  * Ticks (green CheckCircle2) for included features, crosses (red XCircle) for excluded features
* Loading state: spinner while API call is in progress
* Error state: error message with retry option
* Empty state: "Link products in the Details tab to compare features"

**Save Behaviour:**

* Save button calls `onSave(state)` where state includes: selectedExistingIds, existingStates (premium edits, frequencies, linked portfolios), checkedDifferences
* On save, the system creates new Alternative items in the Scenario Review for each selected existing product:
  * ID format: `l4l-{recommendedItemId}-{existingItemId}`
  * Status: "Like for Like"
  * Premiums: from user's edited values in the Details tab
  * Covers: derived from the recommended item's covers
  * All previous Like for Like items for this recommended product are removed before creating new ones
* Close button (X or Close) dismisses the modal without creating items

**State Persistence:**

* Like for Like state is persisted per recommended item
* Re-opening the modal restores previous selections, premium edits, and linked portfolios

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* The Similarities and Differences API uses payload position suffixes (P0, P1, P2) in featureIncluded/featureExcluded arrays rather than actual product codes — the UI must match by suffix, not by code value

---

### SA-9.4 [NEW] Advisers can add manual recommendation items so that they can include products not returned by the quoting engine

<u>Acceptance Criteria</u>

* **[PLACEHOLDER — implemented in code but requires full specification]**
* Advisers can add a manual recommendation from the Action Menu on the Scenario Review page
* Manual items are added as Alternative products with user-specified details
* Manual items support the same status options as other Alternative products

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

> **Missing details:** Full manual recommendation workflow — what fields can the adviser specify? Can they set provider, premiums, and covers manually? Is there a dedicated form or modal for manual entry? How does a manual item interact with Like for Like and Replacement Analysis?

---

## SA-10 — Reports

> Depends on SA-5 as a minimum; research reports additionally depend on SA-7.

### SA-10.1 Advisers can download comparison reports so that they can share analysis with clients

<u>Acceptance Criteria</u>

* **[PLACEHOLDER — report formats and content need to be defined]**
* From the Quote Results toolbar, advisers can click "DOWNLOAD REPORT" to generate a report of selected results
* From the Features Comparison page, advisers can click "Download Report" to generate a printable features comparison report
* From the Features Comparison page, advisers can click "Download and Save Report" to generate and save a report against the scenario
* Report format, content, and styling to be specified in a separate story

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

> **Missing details:** Report format (PDF, Excel, HTML?), content layout, branding, what data is included, where saved reports are stored, how they are retrieved later, report naming convention.

---

## SA-11 — Quote Persistence

> Can be built alongside SA-5 — saving a quote ID is a natural extension of quote generation.

### SA-11.1 The system persists quote results so that advisers can return to previously generated comparisons

<u>Acceptance Criteria</u>

* **[PLACEHOLDER — persistence strategy needs to be defined]**
* When quotes are generated, the quote ID and results are saved
* Advisers can navigate away from the Quote Results page and return to the same results
* The Scenario Review page references products back to the quoting system using the Quote ID
* Products in the Scenario Review are retained and not removed or rerun when new quotes are created
* Quote generated dates are preserved and displayed on the Quote Details sidebar

<u>Designs</u>

* N/A — data layer

<u>Security and Technical Considerations</u>

* None

> **Missing details:** Storage mechanism (server-side database, localStorage, session storage?), data retention period, maximum number of saved quotes, conflict resolution when re-quoting, data model for persisted quotes.

---

## SA-12 — Configuration

> Foundational but low-risk to deliver incrementally — sensible defaults can be hardcoded early and made configurable in a later iteration.

### SA-12.1 Advisers can configure Workspace preferences so that default values are applied consistently when creating new quotes

<u>Acceptance Criteria</u>

* The Workspace Preferences modal is accessible from the Settings icon on the Cover Selection section header
* The modal displays a tabbed interface with the following tabs: General, Global Options, Commissions, Life, TPD Extension, Trauma Extension, TPD Standalone, Trauma Standalone, TPD Extension to Trauma, Income Protection, Business Expenses, Needle Stick
* Changes are saved when the adviser clicks "Save" and persist across all new quotes created within the workspace
* A "Reset to Defaults" button restores all preferences to the system defaults listed below
* Preferences control dropdown defaults only; currency amounts (Sum Insured, Monthly Benefit) are not included as they vary per client

**General Tab:**

* Super Frequency (Mandatory, Dropdown, Options: Weekly/Fortnightly/Monthly/Quarterly/Half Yearly/Yearly, Default: Monthly)
* Non-Super Frequency (Mandatory, Dropdown, same options, Default: Monthly)

**Global Options Tab:**

* Premium Projection Duration (Mandatory, Dropdown, Options: 3/5/10/15/20 Years, Default: 15 Years)
* Indexation (Mandatory, Number input with % suffix, Range: 0–100, Step: 0.01, Default: 0)
* Approved Product List (Mandatory, Dropdown, Options: Adviser/User, Default: Adviser)
* Minimum Commission Preference (Mandatory, Dropdown, Options: Yes/No, Default: No)
  * When Yes: all providers set to minimum (0%) commission; warning banner displayed on Commissions tab

**Commissions Tab:**

* Table of all available insurance providers with columns: Provider (logo + name), Commission Structure (editable dropdown), Initial (read-only %), Renewal (read-only %)
* Commission Structure options populated dynamically from Suppliers API (format: "[Structure] ([Upfront]% / [Ongoing]%): [Name]")
* Default: each provider's default commission code from the API
* When Minimum Commission Preference enabled: all dropdowns disabled, amber banner displayed
* Only fundType "Retail" providers are displayed

**Per-Cover Tabs (Life, TPD Extension, Trauma Extension, TPD Standalone, Trauma Standalone, TPD Extension to Trauma, Income Protection, Business Expenses, Needle Stick):**

* Each tab contains the dropdown defaults for the corresponding cover type's Needs Editor fields
* All fields are Mandatory, Dropdown, with system defaults as documented in SA-3.2

**Footer:** Reset to Defaults button (outline), Cancel button (outline), Save button (teal)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Workspace preferences are stored in localStorage and applied at quote creation time; they do not retroactively update existing quotes

---

### SA-12.2 Advisers can configure scenario settings so that quote generation uses the correct projection, commission, and campaign options

<u>Acceptance Criteria</u>

* The Scenario Settings modal is accessible from the Personal Details page (via a settings trigger in the client summary area)
* The modal has a header titled "Scenario Settings" with a close button (X)
* The modal displays a tabbed interface with tabs: Global, Commissions, General, Life, TPD Extension, Trauma Extension, TPD Standalone, Trauma Standalone, Income Protection, Business Expenses, Needle Stick, Campaigns
* All defaults are loaded from Workspace Preferences (SA-12.1) when a new scenario is created
* Changes are saved when the adviser clicks "Save" and applied to all subsequent quote operations within the scenario
* All settings match the Workspace Preferences structure but are maintained independently per scenario

**Campaigns Tab:**

* Displays a table of all available insurance providers
* Columns: Provider (logo + name), Campaigns (max 4, multi-select toggle buttons)
* Campaign options populated dynamically from the Suppliers API
* Selected campaigns show a teal background with a check icon
* Maximum 4 campaigns per provider; unselected buttons disabled at max with tooltip
* Counter displays "[selected]/4" below the buttons

**Footer:** Cancel button (outline), Save button (teal)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Commission and campaign options are loaded and validated from the Suppliers API; the table displays a loading spinner while fetching and an error message if the API call fails
* Only fundType "Retail" products are displayed and checked

---

## SA-INFRA — API Integration & Infrastructure

> Cross-cutting concern supporting all epics.

### SA-INFRA.1 The system proxies API requests to the OmniLife platform so that client-side code can access data without CORS issues

<u>Acceptance Criteria</u>

* All API requests are proxied through `/api/*` endpoints:
  * Dev: Vite dev server proxy (vite.config.ts)
  * Production: Single consolidated Vercel serverless function (`api/proxy.ts`) with a rewrite rule in `vercel.json`
* The serverless function consolidation keeps the deployment under the Vercel Hobby plan limit of 12 functions
* The Vercel rewrite rule maps `/api/:path(.*)` to `/api/proxy?_path=:path` for reliable path routing

**API Endpoints:**

| Client Route | Upstream OmniLife Route | Method | Cache |
|---|---|---|---|
| `/api/occupations` | `/occupations` | GET | 3600s |
| `/api/occupation-mappings/{id}` | `/occupations/{id}/mappings` | GET | 3600s |
| `/api/legacy-suppliers` | `/legacy/suppliers` | POST | 3600s |
| `/api/legacy-portfolios` | `/legacy/portfolios` | POST | 3600s |
| `/api/legacy-products` | `/legacy/products` | POST | 3600s |
| `/api/suppliers` | `/suppliers` | GET | 3600s |
| `/api/supplier-occupations/{code}/occupations` | `/suppliers/{code}/occupations` | GET | 300s |
| `/api/supplier-documents` | `/suppliers/documents` | GET | 3600s |
| `/api/quote-portfolio` | `/quote/portfolio` | POST | None |
| `/api/quote-portfolio/{code}/quoteValidation` | `/quote/portfolio/{code}/quoteValidation` | POST | None |
| `/api/quote-portfolio-features` | `/quote/portfolio/{codes}/features` | POST | None |
| `/api/product-options` | `/quote/portfolio/{portfolioCode}/productOptions` | POST | None |
| `/api/similarities-and-differences` | `/research/portfolio/similaritiesAndDifferences` | POST | None |
| `/api/gained-and-lost` | `/research/portfolio/gainedAndLost` | POST | None |
| `/api/portfolio-features` | `/research/portfolio/features` | POST | None |

* Authentication: Basic Auth credentials (USERNAME/PASSWORD from environment variables) forwarded to OmniLife UAT base URL
* Static data endpoints (occupations, suppliers, legacy data, supplier documents) are cached for 3600 seconds
* Supplier occupation search is cached for 300 seconds
* Quote and research operation endpoints have no caching

<u>Designs</u>

* N/A — infrastructure only

<u>Security and Technical Considerations</u>

* API credentials are stored as environment variables and never exposed to the client
* The proxy pattern prevents CORS issues and keeps the OmniLife base URL hidden from the browser

---

### SA-INFRA.2 Advisers can navigate between application areas so that they can efficiently manage their workflow

<u>Acceptance Criteria</u>

* The top navigation bar displays:
  * Application logo
  * Navigation links: Dashboard, Plans, Reviews, Clients
  * Version stamp
  * Help, Link, and Notification bell icons
  * User profile (name, role, avatar)
* The following routes are available:
  * /scenarios — Scenario Index
  * /scenarios/:id — Scenario Details
  * /scenarios/:id/research/insurance — Insurance Research
  * /scenarios/:id/plan/:platformId/edit — Edit Existing Plan
  * /scenarios/:id/plan/:platformId/investments/add — Add Investment
  * /scenarios/:id/plan/:platformId/fees — Edit Fees
  * /scenarios/:id/add-existing — Add Existing Plan
  * /scenarios/:id/add-proposal — Add Proposal Type
  * /scenarios/:id/proposals/plan-review/new — New Plan Review
  * /scenarios/:id/proposals/plan-review/:proposalId — Edit Plan Review
  * /research/plans — Plan List
  * /research/plans/new — Add Plan
  * /research/plans/:planId — Plan Detail
  * /research/plans/:planId/derive — Derive Plan
  * /research/investment-data — Investment Data
  * /clients — Client Page
  * /management/reference-data/investment-research — Management Portal

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## Summary — Story Cross-Reference

| Epic | Story | Title |
|------|-------|-------|
| SA-1 | SA-1.1 | Advisers can sign in to the application |
| SA-2 | SA-2.1 | View and manage insurance research scenarios |
| SA-2 | SA-2.2 | Create an insurance comparison scenario |
| SA-2 | SA-2.3 | Enter client personal details |
| SA-2 | SA-2.4 | Manage existing insurance policies |
| SA-2 | SA-2.5 | Link existing policies to research portfolios |
| SA-2 | SA-2.6 | Perform a needs analysis |
| SA-2 | SA-2.7 | View client information / Client page |
| SA-3 | SA-3.1 | Manage quote sets in Cover Selection |
| SA-3 | SA-3.2 | Configure quote covers via Needs Editor |
| SA-4 | SA-4.1 | Configure the Approved Product List |
| SA-5 | SA-5.1 | View and compare insurance quotes |
| SA-5 | SA-5.2 | Parse resolved needs from quote API |
| SA-6 | SA-6.1 | Calculate feature and value scores |
| SA-7 | SA-7.1 | Compare product features side by side |
| SA-7 | SA-7.2 | Access supplier documents |
| SA-8 | SA-8.1 | Review and finalise recommendations |
| SA-8 | SA-8.2 | View and edit product details |
| SA-8 | SA-8.3 | View individual cover details |
| SA-9 | SA-9.1 | Vary existing policies |
| SA-9 | SA-9.2 | Analyse replacement options |
| SA-9 | SA-9.3 | **[NEW]** Like for Like comparison |
| SA-9 | SA-9.4 | **[NEW]** Manual recommendation items |
| SA-10 | SA-10.1 | Download comparison reports |
| SA-11 | SA-11.1 | Persist quote results |
| SA-12 | SA-12.1 | Configure Workspace preferences |
| SA-12 | SA-12.2 | Configure scenario settings |
| INFRA | SA-INFRA.1 | API proxy infrastructure |
| INFRA | SA-INFRA.2 | Navigation & application shell |

---

## Gaps & Missing Information Summary

| Area | Gap | Priority |
|------|-----|----------|
| **SA-1 (Identity & Access)** | No authentication/authorisation design exists. Need: identity provider, session management, role model, per-adviser OmniLife credentials strategy | High — blocker for production |
| **SA-4 (APL Management)** | Entire epic is a placeholder. Need: APL data model, management UI, Adviser vs User mode behaviour, how APL filters interact with quote results | High — affects quote results |
| **SA-6 (Scoring)** | Scoring algorithm undefined. Need: feature score calculation method, weighting types, value score derivation formula, client-side vs API-side scoring | Medium |
| **SA-9.4 (Manual Recommendations)** | Partial implementation exists in code but no formal specification. Need: full workflow design, form fields, interaction with other SA-9 actions | Medium |
| **SA-10 (Reports)** | Report formats, content, and styling undefined. Need: supported export formats, content layout, branding, saved report storage | Medium |
| **SA-11 (Quote Persistence)** | Storage mechanism undefined. Need: server-side vs client-side persistence, data model, retention policy, conflict resolution | High — affects data durability |
| **SA-2.3 (Personal Details)** | Factfind data mapping partially defined. Need: complete field mapping from Xplan, import trigger mechanism, data freshness strategy | Medium |
| **SA-2.7 (Client Page)** | Related Entities data source and filtering undefined. Factfind, Plans, and Reviews tabs are placeholders | Low — can be incrementally defined |
| **Graph View** | "All GRAPHS" toggle in SA-5.1 Results Toolbar referenced but graph view format not specified | Low |
| **Exclusion Reasons Modal** | Referenced in SA-5.1 (Excluded Products Section) but not specified as a separate story | Low |
| **Occupation Details Modal** | Referenced in SA-5.1 (Additional Information Panel) but not specified as a separate story | Low |
