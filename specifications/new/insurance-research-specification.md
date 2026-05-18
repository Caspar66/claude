# Insurance Research & Comparison Tool — Insurance Research Specification

---

## 2. Insurance Research

### 2.1 Advisers can view and manage insurance research scenarios so that they can organise insurance comparisons for clients

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

### 2.2 Advisers can create an insurance comparison scenario so that they can configure client details and cover requirements

<u>Acceptance Criteria</u>

* When the adviser clicks "Add" from the Insurance Research page, a creation dialog opens
* The adviser must first configure the scenario:
  * Scenario Name
    * Mandatory
    * Text field
    * Empty by default
    * Must not duplicate an existing scenario name
  * Case Type
    * Mandatory
    * Radio selection
    * Options: "Client Only", "Partner Only", "Client & Partner"
    * No default
* After creating, the adviser is taken to the Personal Details screen to enter client information

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### 2.3 Advisers can enter client personal details so that quotes can be generated based on accurate client information

<u>Acceptance Criteria</u>

* The Personal Details screen allows the adviser to enter information for each life insured (client and/or partner, based on case type)
* For each life insured, the following fields are available:
  * First Name
    * Mandatory
    * Text field
    * Default: pre-populated from scenario data
  * Last Name
    * Mandatory
    * Text field
    * Default: pre-populated from scenario data
  * Date of Birth
    * Mandatory
    * Date picker (DD/MM/YYYY format)
    * Default: calculated from age
  * Age
    * Read-only (calculated from Date of Birth)
    * Numeric display
  * Gender
    * Mandatory
    * Dropdown
    * Options: Male, Female
    * Default: Male
  * State
    * Mandatory
    * Dropdown
    * Options: QLD, VIC, NSW, SA, WA, TAS, NT, ACT
    * Default: QLD
  * Smoker Status
    * Mandatory
    * Toggle (Yes/No)
    * Default: No
  * Occupation
    * Mandatory
    * Searchable autocomplete field
    * Shows loading spinner during API search
    * Default: Accountant
  * Employment Status
    * Mandatory
    * Dropdown
    * Options: Employee, Sole Trader, Partnership, Business Owner, Home Duties, Retired, Pensioner, Unemployed, Student
    * Default: Employee
  * Health Discount
    * Mandatory
    * Toggle (Include/Exclude)
    * Default: Exclude
  * Annual Income
    * Mandatory
    * Currency field (AUD)
    * Default: $100,000
  * Loadings (opens modal)
    * Per cover type (Life, TPD, Trauma, IP, Business Expenses)
    * Each has: Percentage (numeric), Dollar per $1,000 (numeric)
    * Default: all zeros

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Occupation search calls the OmniLife Occupations API; results should be debounced to avoid excessive API calls

---

### 2.4 Advisers can manage existing insurance policies so that current coverage can be considered during comparison

<u>Acceptance Criteria</u>

* The Current Situation section displays a collapsible panel showing existing policies
* Advisers can add an existing cover by clicking the "Add Existing Cover" button
* Existing policies are displayed in a table grouped by life insured (Client/Partner) with columns:
  * Policy Description (provider name and policy description)
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
* When expanded, each policy shows a sub-table of covers with:
  * Cover type (Life, TPD, Trauma, IP, etc.)
  * Owner
  * Benefit Amount
  * Super indicator
  * Super-Link indicator
  * Life Insured name
* If no existing policies exist, the message "No existing policies" is displayed

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

### 2.5 Advisers can link existing policies to research portfolios so that existing coverage is included in quote comparisons

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

### 2.6 Advisers can manage quote sets in the Cover Selection panel so that they can define which covers to quote for each life insured

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
  * Super and Non-Super frequency defaulting to Monthly
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
  * Next
    * Outline button
    * Disabled until quotes have been generated (Get Quotes has been run)
    * Tooltip when disabled: "Run Get Quotes first to view results"
    * Navigates to the Quote Results page

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### 2.7 Advisers can configure quote covers via the Needs Editor so that they can specify which insurance needs to include in a quote

<u>Acceptance Criteria</u>

* Clicking "Edit" on a quote row in the Cover Selection table (or the pencil icon) opens the Needs Editor as a full-page view replacing the Personal Details page
* The page has a header bar titled "Needs Editor — [Quote Name]" with a back arrow to return without saving
* All dropdown and currency field defaults are populated from the Workspace Preferences (see story 2.9); the values listed below are the system defaults when no preferences have been configured

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
* Sum Insured
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Based on Workspace preferences
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super
  * Default: Based on Workspace preferences
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Based on Workspace preferences
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Based on Workspace preferences

**TPD Extension to Life (TPE) — linked to Life:**
* Added via "+ Add Need" or by linking from the Life section
* Sum Insured
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Based on Workspace preferences
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink
  * Default: Based on Workspace preferences
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Based on Workspace preferences
* Occupation Type
  * Mandatory, Dropdown
  * Options: Any, Own, Homemaker, ADL, Best available
  * Default: Based on Workspace preferences
* Life Buy Back
  * Mandatory, Dropdown
  * Options: Lowest premium, Fastest available, None, Immediate, 1 year
  * Default: Based on Workspace preferences
* Double TPD
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Based on Workspace preferences

**Trauma Extension to Life (TRE) — linked to Life:**
* Sum Insured
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Based on Workspace preferences
* Life Buy Back
  * Mandatory, Dropdown
  * Options: Lowest premium, Fastest available, None, 1 year, 3 years
  * Default: Based on Workspace preferences
* Double Trauma
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Trauma Reinstatement
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Baby Care
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Priority
  * Mandatory, Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Based on Workspace preferences

**TPD Standalone (TPS):**
* Sum Insured
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Based on Workspace preferences
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink
  * Default: Based on Workspace preferences
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Based on Workspace preferences
* Occupation Type
  * Mandatory, Dropdown
  * Options: Any, Own, Homemaker, ADL, Best available
  * Default: Based on Workspace preferences
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Based on Workspace preferences

**Trauma Standalone (TRS):**
* Sum Insured
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Based on Workspace preferences
* Trauma Reinstatement
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Baby Care
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Priority
  * Mandatory, Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Based on Workspace preferences

**TPD Extension to Trauma (TPR) — linked to Trauma Standalone:**
* Sum Insured
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Based on Workspace preferences
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink
  * Default: Based on Workspace preferences
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Based on Workspace preferences
* Occupation Type
  * Mandatory, Dropdown
  * Options: Any, Own, Homemaker, ADL, Best available
  * Default: Based on Workspace preferences
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Based on Workspace preferences

**Income Protection (INC):**
* Monthly Benefit
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Super Contribution
  * Mandatory, Currency field, Default: $0
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable
  * Default: Based on Workspace preferences
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink
  * Default: Based on Workspace preferences
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Based on Workspace preferences
* Agreed Value
  * Mandatory, Dropdown
  * Options: Indemnity if possible, Indemnity
  * Default: Based on Workspace preferences
* Accident Benefit
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Increase Claim Benefit
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Based on Workspace preferences
* Waiting Period
  * Mandatory, Dropdown
  * Options: 14 days, 30 days, 60 days, 90 days, 180 days, 1 year, 2 years
  * Default: Based on Workspace preferences
* Benefit Period
  * Mandatory, Dropdown
  * Options: 1 year, 2 years, 5 years, To age 55, To age 60, To age 65, To age 67, To age 70
  * Default: Based on Workspace preferences
* Replacement Ratio
  * Mandatory, Dropdown
  * Options: Any, Greater than 75%, 70% to 75%, 60% to 69%, Less than 60%
  * Default: Based on Workspace preferences
* Priority
  * Mandatory, Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Based on Workspace preferences

**Business Expenses (BUS):**
* Monthly Benefit
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable
  * Default: Based on Workspace preferences
* Waiting Period
  * Mandatory, Dropdown
  * Options: 14 days, 30 days, 60 days, 90 days
  * Default: Based on Workspace preferences
* Benefit Period
  * Read-only
  * Fixed: 1 year

**Needle Stick (NES):**
* Sum Insured
  * Mandatory, Currency field, Default: Based on Workspace preferences
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Variable
  * Default: Based on Workspace preferences

**Child Trauma (CHT):**
* Displays a list of children (maximum 9)
* Advisers can add a child by clicking "+ Add Child"
* Each child has:
  * Sum Insured
    * Mandatory, Currency field, Default: $0
  * Date of Birth
    * Mandatory, Date picker (YYYY-MM-DD format)
  * Age
    * Read-only (calculated from Date of Birth)
  * Gender
    * Mandatory, Dropdown
    * Options: Male, Female
    * Default: Male
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

### 2.8 Advisers can perform a needs analysis so that they can calculate insurance shortfalls and inform cover requirements

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
  * Life Insurance
    * Checkbox, Default: checked
  * TPD Insurance
    * Checkbox, Default: checked
  * Trauma Insurance
    * Checkbox, Default: checked
  * Income Protection
    * Checkbox, Default: checked
  * Business Expense
    * Checkbox, Default: unchecked
* Toggling a checkbox immediately shows/hides the corresponding column in the table
* A "Done" button closes the modal

**Requirements Table:**
* The table displays a row-label column on the left, followed by one column for each enabled insurance type (Life, TPD, Trauma, Income Protection pa, Business Expenses pa)
* All currency input cells are right-aligned, 100px wide, and format as Australian currency on blur

**Capital Requirements Section:**
* Section header: "Capital Requirements" (slate background)
* Editable rows for Life, TPD, and Trauma columns:
  * Liabilities to clear
    * Optional, Currency field, Default: $0
  * Future Expenditure Required
    * Optional, Currency field, Default: $0
  * Future Education Expenses
    * Optional, Currency field, Default: $0
  * Medical costs/Recovery income
    * Optional, Currency field, Default: $0
  * Provision for Tax
    * Optional, Currency field, Default: $0
  * Other
    * Optional, Currency field, Default: $0
* **Total Capital Required** (calculated summary row, slate background):
  * Life, TPD, Trauma columns: read-only, sum of all Capital Requirements rows for that column
  * Income Protection column: editable currency field (direct entry of annual income protection need)
    * Default: 70% of the client's annual income (auto-populated on first load if income > $0)
  * Business Expenses column: editable currency field (direct entry of annual business expenses need)
    * Default: $0

**Capital Provisions Section:**
* Section header: "Capital Provisions" (slate background)
* Editable rows for Life, TPD, and Trauma columns:
  * Disposable Assets
    * Optional, Currency field, Default: $0
  * Super
    * Optional, Currency field, Default: $0
  * Continuing Income
    * Optional, Currency field, Default: $0
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

### 2.9 Advisers can configure Workspace preferences so that default values are applied consistently when creating new quotes

<u>Acceptance Criteria</u>

* The Workspace Preferences modal is accessible from the Settings icon on the Cover Selection section header
* The modal displays a tabbed interface with the following tabs: General, Global Options, Commissions, Life, TPD Extension, Trauma Extension, TPD Standalone, Trauma Standalone, TPD Extension to Trauma, Income Protection, Business Expenses, Needle Stick
* Changes are saved when the adviser clicks "Save" and persist across all new quotes created within the workspace
* A "Reset to Defaults" button restores all preferences to the system defaults listed below
* Preferences control dropdown defaults only; currency amounts (Sum Insured, Monthly Benefit) are not included as they vary per client

**General Tab:**
* Super Frequency
  * Mandatory, Dropdown
  * Options: Weekly, Fortnightly, Monthly, Quarterly, Half Yearly, Yearly
  * Default: Monthly
* Non-Super Frequency
  * Mandatory, Dropdown
  * Options: Weekly, Fortnightly, Monthly, Quarterly, Half Yearly, Yearly
  * Default: Monthly

**Global Options Tab:**
* Premium Projection Duration
  * Mandatory, Dropdown
  * Options: 3 Years, 5 Years, 10 Years, 15 Years, 20 Years
  * Default: 15 Years
  * Controls the number of years used for premium projection calculations
* Indexation
  * Mandatory, Number input with % suffix
  * Range: 0 to 100 (step 0.01)
  * Default: 0
  * Annual indexation rate applied to premiums
* Approved Product List
  * Mandatory, Dropdown
  * Options: Adviser, User
  * Default: Adviser
  * Determines which APL is used for quoting
* Minimum Commission Preference
  * Mandatory, Dropdown
  * Options: Yes, No
  * Default: No
  * When set to Yes, all providers are automatically assigned their minimum (0%) commission structure
  * A warning banner is displayed on the Commissions tab when enabled

**Commissions Tab:**
* Displays a table of all available insurance providers with one row per provider
* Table columns:
  * Provider (logo and name)
  * Commission Structure (editable dropdown per provider)
  * Initial (read-only percentage display)
  * Renewal (read-only percentage display)
* Commission Structure
  * Mandatory, Dropdown per provider
  * Options: populated dynamically from the Suppliers API (each provider's `commissionOptions`)
  * Options display format: "[Structure] ([Upfront]% / [Ongoing]%): [Name]"
  * Default: each provider's default commission code from the API
* When Minimum Commission Preference is enabled:
  * All dropdowns are disabled (greyed out)
  * All providers are set to their minimum commission code (0% upfront / 0% ongoing)
  * An amber banner displays: "Minimum Commission Preference is enabled — all providers set to minimum (0%) commission."
* Initial and Renewal columns display the upfront and ongoing commission percentages (2 decimal places)
* A dash "—" is shown if the rate is not available
* These defaults are applied to the Scenario Settings when a new scenario is created

**Life Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Variable age-stepped
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super
  * Default: Non-Super
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Exclude
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Include if possible

**TPD Extension Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Variable age-stepped
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink
  * Default: Non-Super
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Exclude
* Occupation Type
  * Mandatory, Dropdown
  * Options: Any, Own, Homemaker, ADL, Best available
  * Default: Any
* Life Buy Back
  * Mandatory, Dropdown
  * Options: Lowest premium, Fastest available, None, Immediate, 1 year
  * Default: Lowest premium
* Double TPD
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Exclude if possible
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Include if possible

**Trauma Extension Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Variable age-stepped
* Life Buy Back
  * Mandatory, Dropdown
  * Options: Lowest premium, Fastest available, None, 1 year, 3 years
  * Default: Lowest premium
* Double Trauma
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Exclude if possible
* Trauma Reinstatement
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Exclude if possible
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Include if possible
* Baby Care
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Include if possible
* Priority
  * Mandatory, Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Cheapest

**TPD Standalone Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Variable age-stepped
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink
  * Default: Non-Super
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Exclude
* Occupation Type
  * Mandatory, Dropdown
  * Options: Any, Own, Homemaker, ADL, Best available
  * Default: Any
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Include if possible

**Trauma Standalone Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Variable age-stepped
* Trauma Reinstatement
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Exclude if possible
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Include if possible
* Baby Care
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Include if possible
* Priority
  * Mandatory, Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Cheapest

**TPD Extension to Trauma Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable to age 65, Variable to age 70
  * Default: Variable age-stepped
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink
  * Default: Non-Super
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Exclude
* Occupation Type
  * Mandatory, Dropdown
  * Options: Any, Own, Homemaker, ADL, Best available
  * Default: Any
* Premium Waiver
  * Mandatory, Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Include if possible

**Income Protection Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable
  * Default: Variable age-stepped
* Owner
  * Mandatory, Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink
  * Default: Non-Super
* Rollover
  * Mandatory, Dropdown
  * Options: Include if possible, Exclude
  * Default: Exclude
* Agreed Value
  * Mandatory, Dropdown
  * Options: Indemnity if possible, Indemnity
  * Default: Indemnity
* Accident Benefit
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Exclude if possible
* Increase Claim Benefit
  * Mandatory, Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Exclude if possible
* Waiting Period
  * Mandatory, Dropdown
  * Options: 14 days, 30 days, 60 days, 90 days, 180 days, 1 year, 2 years
  * Default: 30 days
* Benefit Period
  * Mandatory, Dropdown
  * Options: 1 year, 2 years, 5 years, To age 55, To age 60, To age 65, To age 67, To age 70
  * Default: To age 65
* Replacement Ratio
  * Mandatory, Dropdown
  * Options: Any, Greater than 75%, 70% to 75%, 60% to 69%, Less than 60%
  * Default: Any
* Priority
  * Mandatory, Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Cheapest

**Business Expenses Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Blended, Variable
  * Default: Variable age-stepped
* Waiting Period
  * Mandatory, Dropdown
  * Options: 14 days, 30 days, 60 days, 90 days
  * Default: 30 days

**Needle Stick Tab:**
* Structure
  * Mandatory, Dropdown
  * Options: Variable age-stepped, Variable
  * Default: Variable age-stepped

**Footer:**
* Reset to Defaults button (outline) — restores all tabs to the system defaults listed above
* Cancel button (outline) — closes without saving
* Save button (teal) — persists preferences and closes the modal

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Workspace preferences are stored in localStorage and applied at quote creation time; they do not retroactively update existing quotes

---

### 2.10 Advisers can configure scenario settings so that quote generation uses the correct projection, commission, and campaign options

<u>Acceptance Criteria</u>

* The Scenario Settings modal is accessible from the Personal Details page (via a settings trigger in the client summary area)
* The modal has a header titled "Scenario Settings" (indigo background) with a close button (X)
* The modal displays a tabbed interface with three tabs: Global Options, Commissions, Campaigns
* Changes are saved when the adviser clicks "Save" and applied to all subsequent quote operations within the scenario

**Global Options Tab:**
* Premium Projection Duration
  * Mandatory, Dropdown
  * Options: 3 Years, 5 Years, 10 Years, 15 Years, 20 Years
  * Default: 15 Years
  * Controls the number of years used for premium projection calculations
* Indexation
  * Mandatory, Number input with % suffix
  * Range: 0 to 100 (step 0.01)
  * Default: 0
  * Annual indexation rate applied to premiums
* Approved Product List
  * Mandatory, Dropdown
  * Options: Adviser, User
  * Default: Adviser
  * Determines which APL is used for quoting
* Minimum Commission Preference
  * Mandatory, Dropdown
  * Options: Yes, No
  * Default: No
  * When set to Yes, all providers are automatically assigned their minimum (0%) commission structure
  * A warning banner is displayed on the Commissions tab when enabled

**Commissions Tab:**
* Displays a table of all available insurance providers with one row per provider
* Table columns:
  * Provider (logo and name)
  * Commission Structure (editable dropdown per provider)
  * Initial (read-only percentage display for Lump, Sum, and Income types)
  * Renewal (read-only percentage display for Lump, Sum, and Income types)
* Commission Structure
  * Mandatory, Dropdown per provider
  * Options: populated dynamically from the Suppliers API (each provider's `commissionOptions`)
  * Options display format: "[Structure] ([Upfront]% / [Ongoing]%): [Name]"
  * Default: each provider's default commission code from the API
* When Minimum Commission Preference is enabled:
  * All dropdowns are disabled (greyed out)
  * All providers are set to their minimum commission code (0% upfront / 0% ongoing)
  * An amber banner displays: "Minimum Commission Preference is enabled — all providers set to minimum (0%) commission."
* Initial and Renewal columns display commission rates for three types:
  * LUMP: percentage (2 decimal places)
  * SUM: percentage (2 decimal places)
  * INCOME: percentage (2 decimal places)
  * A dash "—" is shown if the rate is not available

**Campaigns Tab:**
* Displays a table of all available insurance providers with one row per provider
* Table columns:
  * Provider (logo and name)
  * Campaigns (max 4) (multi-select toggle buttons)
* Campaign Selection
  * Optional, Toggle buttons per provider
  * Options: populated dynamically from the Suppliers API (each provider's `campaignOptions`)
  * Default: each provider's default campaign code from the API
  * Maximum 4 campaigns can be selected per provider
  * Selected campaigns show a teal background with a check icon
  * When the maximum is reached, unselected buttons are disabled with a tooltip "Maximum 4 campaigns per provider"
  * A counter displays "[selected]/4" below the buttons

**Footer:**
* Cancel button (outline) — closes without saving
* Save button (teal) — persists settings and closes the modal

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Commission and campaign options are loaded from the Suppliers API; the table displays a loading spinner while fetching and an error message if the API call fails

---

## 3. Quote Configuration

### 3.1 Advisers can configure insurance cover requirements so that quotes are generated for the correct products

<u>Acceptance Criteria</u>

* The quote configuration panel is displayed on the left side of the insurance comparison screen
* A Client Summary Bar at the top provides quick access to:
  * Client/Partner toggle (switch between life insured persons)
  * Age display
  * Gender dropdown
  * Smoker status toggle
  * Annual income display
  * Occupation display
  * Quick links: Occupation Ratings, Loadings, Quote APL, Scoring, Required Features
* The quote form has collapsible sections for each cover type:

**Term Life and Extensions**
* Sum Insured
  * Mandatory
  * Currency field
  * Default: $650,000
* Premium Structure
  * Mandatory
  * Dropdown
  * Options: Stepped, Level
  * Default: Stepped
* Ownership
  * Mandatory
  * Dropdown
  * Options: Non-Super, Super Fund
  * Default: Non-Super
* Premium Waiver
  * Mandatory
  * Dropdown
  * Options: Exclude, Include if possible
  * Default: Exclude
* Pay by Rollover
  * Mandatory
  * Dropdown
  * Options: Exclude, Include
  * Default: Exclude

**TPD Extension**
* Sum Insured
  * Mandatory
  * Currency field
  * Default: $350,000
* Premium Structure
  * Mandatory
  * Dropdown
  * Options: Stepped, Level
  * Default: Stepped
* Ownership
  * Mandatory
  * Dropdown
  * Options: Non-Super, Super Fund
  * Default: Non-Super
* Occupation Type
  * Mandatory
  * Dropdown
  * Options: Best Available, Own Occupation, Any Occupation
  * Default: Best Available
* Premium Waiver
  * Mandatory
  * Dropdown
  * Options: Exclude, Include if possible
  * Default: Exclude
* Life Buy Back
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include if possible
  * Default: Exclude if possible
* Double TPD
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include if possible
  * Default: Exclude if possible
* Pay by Rollover
  * Mandatory
  * Dropdown
  * Options: Exclude, Include
  * Default: Exclude

**Trauma Extension**
* Enabled by user selection (default: disabled)
* Sum Insured
  * Mandatory
  * Currency field
  * Default: $200,000
* Premium Structure
  * Mandatory
  * Dropdown
  * Options: Stepped, Blended, Level to Age 65, Level to Age 70
  * Default: Stepped
* Premium Waiver
  * Mandatory
  * Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Exclude
* Life Buy Back
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Best available, Exclude, 1 year, 3 years
  * Default: Exclude if possible
* Double Trauma
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Exclude if possible
* Trauma Reinstatement
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Exclude if possible
* Baby Care
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Exclude if possible
* Priority
  * Mandatory
  * Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Cheapest

**TPD Standalone**
* Enabled by user selection (default: disabled)
* Sum Insured
  * Mandatory
  * Currency field
  * Default: $350,000
* Premium Structure
  * Mandatory
  * Dropdown
  * Options: Stepped, Blended, Level to Age 65, Level to Age 70
  * Default: Stepped
* Owner
  * Mandatory
  * Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink
  * Default: Non-Super
* Occupation Type
  * Mandatory
  * Dropdown
  * Options: Any, Own, Homemaker, ADL, Best available
  * Default: Best available
* Premium Waiver
  * Mandatory
  * Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Exclude
* Rollover
  * Mandatory
  * Dropdown
  * Options: Include if possible, Exclude
  * Default: Exclude

**Trauma Standalone**
* Enabled by user selection (default: disabled)
* Sum Insured
  * Mandatory
  * Currency field
  * Default: $200,000
* Premium Structure
  * Mandatory
  * Dropdown
  * Options: Stepped, Blended, Level to Age 65, Level to Age 70
  * Default: Stepped
* Trauma Reinstatement
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include, Exclude
  * Default: Exclude if possible
* Premium Waiver
  * Mandatory
  * Dropdown
  * Options: Include if possible, Include, Exclude
  * Default: Exclude
* Baby Care
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Exclude if possible
* Priority
  * Mandatory
  * Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Cheapest

**Income Protection**
* Enabled by user selection (default: disabled)
* Monthly Benefit
  * Mandatory
  * Currency field
  * Default: $4,687
* Premium Structure
  * Mandatory
  * Dropdown
  * Options: Stepped, Blended, Level
  * Default: Stepped
* Owner
  * Mandatory
  * Dropdown
  * Options: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink
  * Default: Non-Super
* Rollover
  * Mandatory
  * Dropdown
  * Options: Include if possible, Exclude
  * Default: Exclude
* Agreed Value
  * Mandatory
  * Dropdown
  * Options: Indemnity if possible, Indemnity
  * Default: Indemnity
* Waiting Period
  * Mandatory
  * Dropdown
  * Options: 14 days, 30 days, 60 days, 90 days, 180 days, 1 year, 2 years
  * Default: 30 days
* Benefit Period
  * Mandatory
  * Dropdown
  * Options: 1 year, 2 years, 5 years, To age 55, To age 60, To age 65, To age 67, To age 70
  * Default: To age 65
* Accident Benefit
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Exclude if possible
* Increase Claim Benefit
  * Mandatory
  * Dropdown
  * Options: Exclude if possible, Include if possible, Include, Exclude
  * Default: Exclude if possible
* Initial Replacement Ratio
  * Mandatory
  * Dropdown
  * Options: Any, Greater than 75%, 70% to 75%, 60% to 69%, Less than 60%
  * Default: Any
* Priority
  * Mandatory
  * Dropdown
  * Options: Cheapest, Best, Intermediate
  * Default: Cheapest

**Business Expenses**
* Enabled by user selection (default: disabled)
* Monthly Benefit
  * Mandatory
  * Currency field
  * Empty by default
* Premium Structure
  * Mandatory
  * Dropdown
  * Options: Stepped, Blended, Level
  * Default: Stepped
* Waiting Period
  * Mandatory
  * Dropdown
  * Options: 14 days, 30 days, 60 days, 90 days
  * Default: 30 days
* Benefit Period
  * Read-only
  * Fixed: 1 year

**Needle Stick**
* Enabled by user selection (default: disabled)
* Sum Insured
  * Mandatory
  * Currency field
  * Empty by default
* Premium Structure
  * Mandatory
  * Dropdown
  * Options: Stepped, Level
  * Default: Stepped

**Child Trauma**
* Enabled by user selection (default: disabled)
* Children (array, adviser can add multiple):
  * Date of Birth
    * Mandatory
    * Date picker (DD/MM/YYYY)
  * Age
    * Read-only (calculated)
  * Gender
    * Mandatory
    * Dropdown: Male, Female
  * Sum Insured
    * Mandatory
    * Currency field

* Each collapsible section displays a summary line when collapsed (e.g. "$650,000 · Stepped · Non-Super")
* Advisers can save the current quote configuration as a named quote set
* Advisers can load a previously saved quote set
* Advisers can delete saved quote sets
* A dirty state indicator shows when the form has unsaved changes

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## 4. Quote Results

### 4.1 Advisers can view and compare insurance quotes so that they can identify the best products for their clients

<u>Acceptance Criteria</u>

* The quote results panel is displayed on the right side of the insurance comparison screen
* Results are displayed in a table with the following columns:
  * Checkbox (select for comparison)
  * Expand toggle
  * Insurer (logo and name, with portfolio name below)
  * Products (comma-separated product names)
  * Premiums (total premium with frequency label)
    * Below the total, a Super breakdown line shows: Super premium + stamp duty at the super frequency
    * Below that, a Non-Super breakdown line shows: Non-Super premium + stamp duty at the non-super frequency
    * Breakdown lines are only shown when their total is not zero
  * Cumulative Premiums (projected total over the premium projection period)
  * Feature Score (colour-coded badge: green >80, yellow 50-80, red <50)
  * Value Score (colour-coded badge: same scale)
  * Rec/Alt (recommendation toggle buttons, mutually exclusive)
* Advisers can search results by insurer name or product name using a text search field
* Advisers can sort results by: Premium, Cumulative Premium, Feature Score, or Value Score
* Advisers can toggle sort direction between ascending and descending
* Advisers can expand a row to view detailed product information in a resizable right-side panel (280-600px width) with tabs:
  * Summary: Premium breakdown, line items, stamp duty, total with validation status, commission table (upfront/ongoing percentages and annualised values), Validate Premium button
  * Notes: Strengths (top features) and Limitations (bottom features)
  * Links: PDS and TMD download links
* Advisers can select multiple products using checkboxes for comparison
* A "Select All" checkbox selects/deselects all visible results
* Existing cover Research portfolios (existingCover: true, portfolioType: "Research") are included in the results table:
  * Sorted to the bottom of the table
  * Display an "EXISTING" badge
  * Cumulative Premiums column shows "N/A"
  * Value Score column shows "N/A"
  * All other columns display normally

**Excluded Products Section:**
* Products that cannot meet the specified needs are displayed in a collapsible "Excluded Products" section below the main results
* Excluded products table shows:
  * Insurer (logo and name)
  * Portfolio name
  * Reasons for exclusion (expandable list of error messages, via Exclusion Reasons Modal)
  * PDS link (if available)
  * TMD link (if available)
* The section only appears if there are excluded products

**Actions:**
* "Compare Products" button navigates to the Product Comparison page with selected products
* "View / Compare Features" button navigates to the Features Comparison page (disabled when no specific quotes selected)
* Download Report button
* Toggle buttons for: Graphs/Charts view, Occupation Rating display

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Premium annualisation uses frequency multipliers: Yearly=1, Half-yearly=2, Quarterly=4, Monthly=12, Fortnightly=26, Weekly=52
* When Super and Non-Super frequencies differ, each component is annualised separately before being summed

---

### 4.2 Advisers can compare product features side by side so that they can evaluate insurance products in detail

<u>Acceptance Criteria</u>

* Advisers can select multiple products from the quote results and click "View / Compare Features" to open the Features Comparison page
* The page calls the OmniLife Portfolio Features API with the selected products' supplier codes, product codes, and revision dates
* While loading, a spinner is displayed with the message "Fetching product features..."
* If the API call fails, an error message is displayed with a "Back to Quotes" button
* Features are displayed in a table with:
  * A sticky left column showing the feature name ("Comparison Parameter")
  * One column per selected product (180-260px wide) showing the supplier name, product names, annual premium, feature score badge, and PDS/SPDS date
  * Existing products are indicated with an "Existing" badge in the column header
* Features are grouped hierarchically:
  * Need Type level (collapsible, indigo background with white text, showing need type label and feature count)
  * Heading level (collapsible, slate background with weighting label: Lowest/Low/Moderate/High/Highest)
  * Feature level (individual rows with per-product cells)
* Each feature cell displays:
  * Strengths section (emerald-700 label)
  * Limitations section (amber-700 label)
  * Commentary section (blue-700 label)
  * Feature Text section (slate-500 label)
  * A dash "---" if the product does not have the feature
* Advisers can search features by name using a text search field
* Advisers can toggle a Filters panel (slide-out from right, 320px wide) with:
  * Feature Text toggle (YES/NO) --- shows/hides detailed feature text
  * Differences Only toggle (YES/NO) --- filters to only show features that differ between products
  * Feature Score toggle (YES/NO) --- shows/hides score badges in column headers
  * Show Profile Features checkbox
  * Show Benefit Features checkbox
  * Show Definition Features checkbox
  * Categories section:
    * Search field to filter categories
    * Select All checkbox
    * Individual checkboxes for each feature heading (scrollable list, max 240px)
  * Reset and Done buttons
* Advisers can collapse/expand individual need type and heading groups
* The bottom bar displays a summary: "Comparing X product(s) across Y feature(s) in Z cover(s)"
* Advisers can click "Download Comparison Report" to generate a printable report

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* The features API is called with query parameters: excludeSimilarities=0, score=1, coverNeedType=1, scoreWeightingType=1
* The PORTFOLIO_HEADING entry in the API response is skipped during parsing as it only contains portfolio names

---

## 5. Quote Options & Defaults

### 5.1 Advisers can configure quote defaults and insurer options so that quotes are generated according to their preferences

<u>Acceptance Criteria</u>

* Advisers can access the Options panel from the Settings dropdown in the comparison dialog
* The Options panel has three main sections: Defaults, Insurer Options, and Insurer Logins
* A mode switcher allows toggling between "Adviser defaults" and "My defaults"

**Defaults Section (6 tabs: Policy Defaults, Life, TPD, Trauma, Income Protection, Business Expenses):**

*Policy Defaults Tab:*
* Premium Projection Duration
  * Mandatory
  * Dropdown
  * Options: 10, 15, 20, 25, 30, 35, 40 years
  * Default: 30
* Stepped vs Level Projection
  * Mandatory
  * Dropdown
  * Options: 5, 10, 15, 20, 25, 30 years
  * Default: 15
* Life Insured Details Collapse
  * Mandatory
  * Dropdown
  * Options: Expanded, Collapsed
  * Default: Expanded
* Extension Cover Preference
  * Mandatory
  * Toggle: Yes / No
  * Default: Yes
* Premium Frequency
  * Mandatory
  * Dropdown
  * Options: Yearly, Monthly
  * Default: Yearly
* Apply Premium Loading
  * Mandatory
  * Toggle: Yes / No
  * Default: No
* Campaign Products
  * Mandatory
  * Dropdown
  * Options: Include, Exclude
  * Default: Include
* Show Retail Products Only
  * Mandatory
  * Toggle: Yes / No
  * Default: No
* Minimum Commission Preference
  * Mandatory
  * Toggle: Yes / No
  * Default: No
  * Displays a warning note when set to Yes

*Per-Cover-Type Tabs (Life, TPD, Trauma, Income Protection, Business Expenses):*
* Each tab provides default values for the corresponding cover type's form fields (sum insured, structure, waiver, ownership, etc.)
* Defaults match the field options listed in the Quote Configuration section (3.1)

**Insurer Options Section:**
* Displays a list of insurers in a left sidebar grouped by fund type with select/deselect all per group
* For each insurer (right panel):
  * Enabled/Disabled checkbox
  * Default Commission selector (options populated from API)
  * Product list with individual enable/disable checkboxes
* Real-time supplier filtering

**Insurer Logins Section:**
* Supported insurers: AIA, TAL, Zurich Active, Zurich
* For AIA:
  * Adviser Code
    * Optional
    * Text field
    * Empty by default
* For TAL, Zurich Active, Zurich:
  * Username
    * Optional
    * Text field
    * Empty by default
  * Password
    * Optional
    * Password field
    * Empty by default
* Delete credentials capability for each insurer

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Insurer login credentials are used to access provider-specific pricing and should be stored securely
* Credentials should not be logged or exposed in API responses

---

## 6. Scenario Review

### 6.1 Advisers can review and finalise insurance recommendations so that they can save a complete scenario

<u>Acceptance Criteria</u>

* The Scenario Review page is accessed by clicking "Save to Scenario" from the quote results screen
* The page displays a header breadcrumb showing "Insurance Research > Scenarios > [Scenario Name]" with a back button
* Products are displayed in a table with columns:
  * Expand toggle (chevron icon to show/hide cover details)
  * Policy Details (insurer logo, policy name, insurer name)
  * Life Insured (client or partner name)
  * Premium p.a. (formatted currency with "pa" suffix)
  * Status (inline editable dropdown)
  * View Details (Eye icon button, opens Product Details Modal)

* Products are grouped into sections with colour-coded headers:
  * Existing Covers (amber background, count shown)
  * Recommendations (emerald background, count shown)
  * Vary to Existing (purple background, count shown)
  * Alternatives (blue background, count shown)

* The Status dropdown options vary by item type:
  * Existing Policies: Hold, Replace, Cancel, Vary, Exclude
  * Recommended Products: Recommend, Not Accepted
  * Alternative Products: Alternative, Not Accepted
  * Varied Products: All statuses (Recommend, Not Accepted, Alternative, Hold, Replace, Cancel, Vary, Exclude, Vary to Existing)

* Status colours are applied to the inline dropdown:
  * Recommend: Emerald
  * Not Accepted: Slate
  * Alternative: Blue
  * Hold: Amber
  * Replace: Red
  * Cancel: Red
  * Vary: Purple
  * Exclude: Slate
  * Vary to Existing: Purple

* **Status-Triggered Actions:**
  * Setting an existing policy to "Vary" opens the Vary Existing Cover page (full-page, replaces the review table)
  * Setting an existing policy to "Replace" updates the status and opens the Replacement Analysis Modal
  * All other statuses apply directly without triggering additional modals

* **Expandable Cover Details:**
  * For existing policies: Nested table showing Type, Definition, Owner, Life Insured, Benefit Amount (all read-only)
  * For quote results: Same table structure, populated from resolved needs when available (fallback to premium breakdown)

* **Cover Data Sources for Recommended/Alternative Items:**
  * When the quote API returns `resolvedNeeds` on products, covers are built from these with full detail (need code label, definition, sum insured, owner, waiting period, benefit period)
  * Fallback: Covers built from `premiumBreakdown` descriptions and `premiumLineItems`
  * Final fallback: Covers built from comma-separated products string

* Footer contains "Back to Quotes" and "Save to Scenario" buttons
* If no products exist, the message "No products to review. Go back and tag products as Rec or Alt." is displayed

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Premium annualisation uses frequency multipliers consistent with the rest of the application

---

### 6.2 Advisers can view and edit product details so that they can review the full premium and cover breakdown

<u>Acceptance Criteria</u>

* Clicking the Eye icon on any review row opens the Product Details Modal (720px wide, max 85vh)
* The modal header displays "Product Details" with a close button (X)

**Top-Level Fields:**
* Policy Name
  * Editable text field
  * Default: item label (portfolio/policy name)
* Policy Status
  * Read-only display field
  * Shows the current status of the item
* Underwriter
  * Editable text field
  * Default: insurer name

**Three-Tab Interface:**

*Details Tab:*
* Premium (Super) --- Read-only, shows super premium amount
* Super Frequency --- Dropdown selector with all frequency options (Yearly, Half-yearly, Quarterly, Monthly, Fortnightly, Weekly)
* Date Generated --- Read-only, shows current date in DD/MM/YYYY format
* Premium (Non-Super) --- Read-only, shows non-super premium amount
* Non-Super Frequency --- Dropdown selector
* Policy Fee --- Read-only, only shown if greater than 0
* Total Premium --- Read-only calculated field (sum of all premiums and stamp duties)
* Total Premium Frequency --- Dropdown selector

*Cover Tab (Read-Only Table):*
* Type --- Cover type name (from resolved need label or premium breakdown)
* Definition --- Full cover definition
* Owner --- Resolved from owner code (Non-Super, SMSF, Super, SuperLink, SMSF SuperLink) or fallback to life insured name
* Life Insured --- Name of life insured
* Benefit Amount --- Sum insured formatted as currency
* Waiting Period --- Formatted from resolved cover data (e.g. "30 days")
* Benefit Period --- Formatted from resolved cover data (e.g. "Age 65" or "5 years")
* Eye icon action button --- Opens Cover Details sub-modal for that specific cover row

*Fees Tab (Read-Only Table):*
* Two rows: Premium Year 1, Premium Renewal
* Columns: Premium Period, Comm. Premium ($), Comm. Frequency, Comm. (%), Comm. ($), Include (checkmark)
* All cells displayed with grey background (read-only)
* Include column shows a teal checkmark icon

**Footer:**
* Close button (outline) --- closes without saving
* Save button (teal) --- saves edited Policy Name and Underwriter back to the review item

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### 6.3 Advisers can view individual cover details so that they can inspect the full resolved needs data for each cover

<u>Acceptance Criteria</u>

* Clicking the Eye icon on a cover row in the Product Details Modal Cover tab opens the Cover Details sub-modal (680px wide, z-index 60 to stack above the parent modal)
* The modal header displays "Product Details" with a close button (X)
* All fields are read-only, displayed in a 3-column grid layout:

  * Row 1: Cover Type, Cover Structure, Owner
  * Row 2: Life Insured, Premium Structure, Is Super
  * Row 3: Benefit Amount, Definition, Benefit Status
  * Row 4: Benefit Frequency, Benefit Period, Waiting Period
  * Row 5 (conditional): Occupation Type (only shown if occupation type data exists)

* **Field Derivation Logic:**
  * Cover Type: Human-readable need label (e.g. "Life", "TPD", "Income Protection")
  * Cover Structure: "Linked" if the cover is a linked extension, "Standalone" otherwise
  * Owner: Resolved from owner code using ownership labels (O = Non-Super, M = SMSF, S = Super, J = SuperLink, K = SMSF SuperLink)
  * Premium Structure: Resolved from structure code (S = Variable age-stepped, B = Blended, L = Variable to age 65, 70 = Variable to age 70)
  * Is Super: "True" if owner code is S, J, K, or M; "False" otherwise
  * Benefit Amount: Formatted as currency with 2 decimal places
  * Definition: From resolved cover definition field
  * Benefit Status: The parent review item's current status (e.g. "Recommend", "Replace")
  * Benefit Frequency: "Monthly" if the cover has a monthly benefit, "Single" otherwise
  * Benefit Period: Formatted as "X years" for values <= 5, "Age X" for values > 5
  * Waiting Period: Formatted as "X days"
  * Occupation Type: Resolved from occupation code (A = Any, O = Own, H = Homemaker, D = ADL, E = Best available)

* Footer contains a Close button only (no save action)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### 6.4 Advisers can vary existing policies so that they can model changes to current coverage

<u>Acceptance Criteria</u>

* When an existing policy's status is set to "Vary" in the Scenario Review page, the Vary Existing Cover page replaces the review table (full-page layout, not a modal)
* The page has a title bar displaying "Vary Existing Policy" with Save and Cancel buttons

**Policy Header Fields (3-column grid):**
* Provider --- Read-only text field showing existing policy provider
* Policy Description --- Editable text field
* Life Insured --- Read-only text field showing client or partner name

**Premium Details Section:**
* Grid layout with column headers: Premium, Stamp Duty, Frequency
* Super row:
  * Premium (editable currency input)
  * Stamp Duty (editable currency input)
  * Frequency (dropdown: all frequency options)
* Non-Super row:
  * Premium (editable currency input)
  * Stamp Duty (editable currency input)
  * Frequency (dropdown: all frequency options)
* Total Premium summary:
  * Read-only calculated display
  * Annualises both rows, sums them, then converts back to the appropriate frequency
  * If frequencies differ, defaults to annual display

**Cover Details Table:**
* Same structure and conditional column visibility as the Add Existing Cover table (see section 2.4)
* 8 cover type rows: Life, TPD, Trauma, IP, BE, SBI, ChildCover, Needlestick
* All cover fields are editable (Sum Insured, Premium Style, Ownership, Definition, Stand Alone, Flexi-Linked, Super-Linked, Waiting Period, Benefit Period, Add. Death Cover)
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
* The page returns to the Scenario Review table

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### 6.5 Advisers can analyse replacement options so that they can compare existing cover with recommended products

<u>Acceptance Criteria</u>

* When an existing policy's status is set to "Replace" in the Scenario Review page, the Replacement Analysis Modal opens (900px wide, max 85vh)
* The modal header displays "Replacement Analysis" with a subtitle showing the existing policy details (insurer, label, life insured)

**Existing Cover Summary (Amber Background):**
* Displays: Insurer name, Life Insured name, Premium p.a. (formatted currency)
* Cover badges showing each cover type label with sum insured amount
* "Link Products" text link (placeholder for linking to Map Product Modal)

**Replacement Candidate Selection:**
* Section header: "Select Replacement Products (X available)"
* Scrollable list (max 120px) of recommended and varied products for the same life insured
* Each candidate row shows:
  * Checkbox (toggle selection)
  * Insurer logo
  * Product name and insurer name
  * Type badge: "Recommend" (emerald) or "Vary to Existing" (purple)
  * Loading spinner while comparison data is fetching
  * Error message if API call fails
* When a candidate is selected and has covers, an expanded section below shows a cover table (Type, Definition, Owner, Life Insured, Benefit Amount)

**Three-Tab Interface:**

*Differences in Benefits Tab:*
* For each selected candidate, displays a comparison section with header "vs. [Insurer] --- [Product Name]"
* Feature groups shown:
  * Features Gained (emerald background)
  * Features Improved (blue background)
  * Features Lost (red background)
  * Features Decreased (amber background)
* Each group shows a collapsible header with feature count (deduplicated by code)
* Features within each group have:
  * Parent checkbox (toggles feature inclusion)
  * Feature name
  * Sub-feature items (indented, each with their own checkbox) showing:
    * "Existing: [Existing Insurer] --- [compared value]" (only if compared value is non-blank)
    * "New: [Recommended Insurer] --- [recommended value]" (only if recommended value is non-blank)
* **Deduplication:** Features with the same code appearing across multiple cover types are merged into a single entry, with their sub-features combined (sub-feature codes also deduplicated)
* **Sub-feature filtering:** Sub-features are only shown when comparedValue or recommendedValue is non-blank
* Empty states: "Select a replacement product above to see differences in benefits." (no candidate selected), "No feature differences found." (comparison loaded with no differences)
* Loading state: "Loading comparison..." with spinner

*Costs of Replacement Tab:*
* Free-form editable textarea (200px height)
* Placeholder text guides the adviser on what to include (exit fees, loyalty benefits, waiting periods, exclusions, premium differences)

*Reasons for Replacement Tab:*
* Free-form editable textarea (200px height)
* Placeholder text guides the adviser on what to include (changed needs, better features, cost savings, improved definitions, insurer financial strength)

**Footer:**
* Close button (outline)
* Save button (teal)

**API Integration:**
* Selecting a candidate triggers a call to `postGainedAndLost()` with the existing item's supplier/revision/products and the candidate's supplier/revision/products
* Results are cached per candidate (subsequent toggle on/off does not re-fetch)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* The gained-and-lost API is called with parameters: coverNeedType=NeedType, includeSubFeatures=true

---

## 7. Resolved Needs Data

### 7.1 The system parses resolved needs from the quote API so that cover details reflect the actual product configuration

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
* The Scenario Review page uses resolved covers to build richer cover details (with need code labels, owner codes, waiting/benefit periods) when available

<u>Designs</u>

* N/A --- data layer only

<u>Security and Technical Considerations</u>

* None

---

## 8. Client Page

### 8.1 Advisers can view client information so that they can access insurance research from the client context

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

**Research Tab --- Insurance Sub-tab:**
* The Insurance sub-tab is active by default within the Research tab
* Displays the full Insurance Research content (same as the standalone Insurance Research page --- see section 2.1)
* Advisers can view, create, edit, and delete insurance comparison scenarios
* Scenario table columns, dropdown actions, and "Add" functionality are identical to the standalone Insurance Research page
* Advisers can navigate from a scenario row into the full insurance comparison workflow (Personal Details, Quote Configuration, Quote Results, Product Comparison)
* "Include in Plan" toggle is available on each scenario row

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## 9. Navigation & Application Shell

### 9.1 Advisers can navigate between application areas so that they can efficiently manage their workflow

<u>Acceptance Criteria</u>

* The top navigation bar displays:
  * Application logo
  * Navigation links: Dashboard, Plans, Reviews, Clients
  * Version stamp
  * Help, Link, and Notification bell icons
  * User profile (name, role, avatar)
* The following routes are available:
  * /scenarios --- Scenario Index
  * /scenarios/:id --- Scenario Details
  * /scenarios/:id/research/insurance --- Insurance Research
  * /scenarios/:id/plan/:platformId/edit --- Edit Existing Plan
  * /scenarios/:id/plan/:platformId/investments/add --- Add Investment
  * /scenarios/:id/plan/:platformId/fees --- Edit Fees
  * /scenarios/:id/add-existing --- Add Existing Plan
  * /scenarios/:id/add-proposal --- Add Proposal Type
  * /scenarios/:id/proposals/plan-review/new --- New Plan Review
  * /scenarios/:id/proposals/plan-review/:proposalId --- Edit Plan Review
  * /research/plans --- Plan List
  * /research/plans/new --- Add Plan
  * /research/plans/:planId --- Plan Detail
  * /research/plans/:planId/derive --- Derive Plan
  * /research/investment-data --- Investment Data
  * /clients --- Client Page
  * /management/reference-data/investment-research --- Management Portal

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## 10. API Integration & Infrastructure

### 10.1 The system proxies API requests to the OmniLife platform so that client-side code can access data without CORS issues

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
| `/api/quote-portfolio` | `/quote/portfolio` | POST | None |
| `/api/quote-portfolio/{code}/quoteValidation` | `/quote/portfolio/{code}/quoteValidation` | POST | None |
| `/api/quote-portfolio-features` | `/quote/portfolio/{codes}/features` | POST | None |
| `/api/product-options` | `/quote/portfolio/{portfolioCode}/productOptions` | POST | None |
| `/api/gained-and-lost` | `/research/portfolio/gainedAndLost` | POST | None |
| `/api/portfolio-features` | `/research/portfolio/features` | POST | None |

* Authentication: Basic Auth credentials (USERNAME/PASSWORD from environment variables) forwarded to OmniLife UAT base URL
* Static data endpoints (occupations, suppliers, legacy data) are cached for 3600 seconds
* Supplier occupation search is cached for 300 seconds
* Quote operation endpoints have no caching

<u>Designs</u>

* N/A --- infrastructure only

<u>Security and Technical Considerations</u>

* API credentials are stored as environment variables and never exposed to the client
* The proxy pattern prevents CORS issues and keeps the OmniLife base URL hidden from the browser
