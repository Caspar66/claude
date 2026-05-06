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

* The Current Situation section displays a collapsible panel with two tabs: "Existing" and "Needs Analysis"
* Advisers can add an existing cover by clicking the "Add Existing Cover" button
* An "Actions" dropdown provides bulk operations: Remove All, Mark All As Review
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

**Adding/Editing an Existing Policy:**
* The following fields are available:
  * Provider
    * Mandatory
    * Searchable dropdown
    * Empty by default
  * Policy Description
    * Mandatory
    * Text field
    * Empty by default
  * Life Insured
    * Mandatory
    * Radio: Client / Partner
    * Default: Client
  * For each cover added:
    * Cover Type
      * Mandatory
      * Dropdown
      * Options: Life, TPD, Trauma, IP, BE, SBI, ChildCover, Needlestick
    * Sum Insured
      * Mandatory
      * Currency field
      * Empty by default
    * Premium Style
      * Optional
      * Dropdown (Stepped, Blended, Level, etc.)
    * Super
      * Mandatory
      * Toggle: Yes / No
      * Conditional: only shown for cover types that support super ownership
    * Ownership
      * Mandatory
      * Dropdown
      * Options vary by cover type:
        * Life: Non-Super, SMSF, Super
        * TPD/Trauma: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink
        * IP/BE: Non-Super, SMSF, Super, SuperLink, SMSF SuperLink
        * SBI/ChildCover/Needlestick: Non-Super, Super
    * Definition
      * Conditional: shown for TPD and IP
      * Dropdown
      * TPD options: Any, Own, Super-linked, ADL
      * IP options: Indemnity, Agreed Value
    * Stand Alone
      * Conditional: shown for TPD and Trauma
      * Toggle: Yes / No
    * Waiting Period
      * Conditional: shown for IP and BE
      * Dropdown: 14-730 days
    * Benefit Period
      * Conditional: shown for IP
      * Dropdown: 1 year to age 70
  * Premium Split section:
    * Super Premium (currency input)
    * Super Stamp Duty (currency input)
    * Super Frequency (dropdown: Yearly, Half-yearly, Quarterly, Monthly, Fortnightly, Weekly)
    * Non-Super Premium (currency input)
    * Non-Super Stamp Duty (currency input)
    * Non-Super Frequency (dropdown: same options)
    * Total Premium is calculated automatically

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* SMSF SuperLink ownership is only valid for TPD when Trauma has a value AND Stand Alone is set to Yes

---

### 2.5 Advisers can link existing policies to research portfolios so that existing coverage is included in quote comparisons

<u>Acceptance Criteria</u>

* Advisers can click the Link icon on an existing policy to open the Map Product Modal
* The modal allows the adviser to select:
  * Supplier filter
    * Optional
    * Text field
    * Placeholder: "Search Suppliers"
    * Filters the supplier dropdown as the user types
  * Supplier
    * Mandatory
    * Dropdown (populated from API)
    * Shows loading spinner while fetching
    * Shows error message if API fails
  * PDS Issue Date
    * Mandatory
    * Dropdown (populated from selected supplier's revision dates, formatted as DD MMM YYYY)
    * Only shown when a supplier is selected
  * Manually Link Cover
    * Optional
    * Checkbox toggle
    * Default: unchecked (auto-mode based on existing covers)
    * Only shown when supplier and date are selected
  * Product Selection (per cover type)
    * Dropdown per active cover section (e.g. Life, TPD, Trauma, IP)
    * Options populated from API based on selected supplier and date
    * Extension checkboxes where applicable (e.g. "Include TPD Extension")
    * Shows loading spinner while fetching products
  * Total Annual Premium
    * Displayed in a table with columns: Super, Non Super, Premium (total)
    * Rows: Premium, Stamp Duty
    * Super and Non Super fields are editable currency inputs
    * Premium column is calculated automatically
* The adviser clicks "Add" to link the policy (disabled if required fields are incomplete)
* Linked policies display a green "Linked" badge in the Current Situation table
* Only linked policies are included in the research portfolios sent to the quote API

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* The modal calls the OmniLife Legacy Suppliers, Legacy Portfolios, and Legacy Products APIs to populate dropdowns

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
  * Feature Score (colour-coded badge: green for high scores, red for low)
  * Value Score (colour-coded badge: same scale)
* Advisers can search results by insurer name or product name using a text search field
* Advisers can sort results by: Premium, Cumulative Premium, Feature Score, or Value Score
* Advisers can toggle sort direction between ascending and descending
* Advisers can expand a row to view detailed product information
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
  * Reasons for exclusion (expandable list of error messages)
  * PDS link (if available)
  * TMD link (if available)
* The section only appears if there are excluded products

**Actions:**
* "Compare Products" button navigates to the Product Comparison page with selected products
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

* Advisers can select multiple products from the quote results and click "Compare Products" to open the Product Comparison page
* The page calls the OmniLife Portfolio Features API with the selected products' supplier codes, product codes, and revision dates
* While loading, a spinner is displayed with the message "Fetching product features..."
* If the API call fails, an error message is displayed with a "Back to Quotes" button
* Features are displayed in a table with:
  * A sticky left column showing the feature name ("Comparison Parameter")
  * One column per selected product showing the supplier name, product names, annual premium, and feature score badge
  * Existing products are indicated with an "Existing" badge in the column header
* Features are grouped hierarchically:
  * Heading level (collapsible, bold uppercase text)
  * Sub-heading level (shown only when there are multiple sub-headings or the sub-heading is not "General")
  * Feature level (individual rows)
* Each feature cell displays:
  * A colour-coded score badge (if the feature has a weighting score greater than zero)
  * Feature text describing the specifics
  * A dash "—" if the product does not have the feature
* Advisers can search features by name using a text search field
* Advisers can toggle a Filters panel (slide-out from right, 320px wide) with:
  * Feature Text toggle (YES/NO) — shows/hides detailed feature text
  * Differences Only toggle (YES/NO) — filters to only show features that differ between products
  * Feature Score toggle (YES/NO) — shows/hides score badges in column headers
  * Categories section:
    * Search field to filter categories
    * Select All checkbox
    * Individual checkboxes for each feature heading
* Advisers can collapse/expand individual heading groups by clicking the heading row
* The bottom bar displays a summary: "Comparing X product(s) across Y categories"
* Advisers can click "Download Comparison Report" to generate a printable report in a new window

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
* The Options panel has four tabs: Policy Defaults, Insurer Options, Insurer Logins, and per-cover-type tabs (Life, TPD, Trauma, Income Protection, Business Expenses)

**Policy Defaults Tab:**
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

**Per-Cover-Type Tabs (Life, TPD, Trauma, Income Protection, Business Expenses):**
* Each tab provides default values for the corresponding cover type's form fields (sum insured, structure, waiver, ownership, etc.)
* Defaults match the field options listed in the Quote Configuration section (3.1)

**Insurer Options Tab:**
* Displays a list of insurers grouped by fund type
* For each insurer:
  * Enabled/Disabled checkbox
  * Default Commission selector (options populated from API)
  * Product list with individual enable/disable checkboxes

**Insurer Logins Tab:**
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

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Insurer login credentials are used to access provider-specific pricing and should be stored securely
* Credentials should not be logged or exposed in API responses

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

**Research Tab — Insurance Sub-tab:**
* The Insurance sub-tab is active by default within the Research tab
* Displays the full Insurance Research content (same as the standalone Insurance Research page — see section 2.1)
* Advisers can view, create, edit, and delete insurance comparison scenarios
* Scenario table columns, dropdown actions, and "Add" functionality are identical to the standalone Insurance Research page
* Advisers can navigate from a scenario row into the full insurance comparison workflow (Personal Details, Quote Configuration, Quote Results, Product Comparison)
* "Include in Plan" toggle is available on each scenario row

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None
