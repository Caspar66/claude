# Insurance Research & Comparison Tool — Investment Research Specification

---

## 1. Scenario Management

### 1.1 Advisers can view all scenarios so that they can manage and navigate between advice scenarios

<u>Acceptance Criteria</u>

* Advisers can navigate to the Scenarios page to view a list of their scenarios
* Scenarios are displayed in a table with the following columns:
  * Actions (icon buttons)
  * Scenario Name
  * Created (date and adviser name)
  * Last Changed (date and adviser name)
  * Implemented
  * Locked
* Advisers can create a new scenario by entering a name and clicking "Create Scenario"
  * Scenario Name
    * Mandatory
    * Text field
    * Empty by default
    * Submits on Enter key press
* Each scenario row has the following action buttons:
  * Delete — removes the scenario
  * Edit — navigates to scenario details
  * Copy — duplicates the scenario
  * Document — generates scenario documentation
  * Lock/Unlock — toggles the locked state
* Locked scenarios display a [Locked] badge next to the scenario name
* Advisers can click on a scenario name to navigate to the Scenario Details page
* If no scenarios exist, the message "No scenarios. Create one above." is displayed

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### 1.2 Advisers can view scenario details so that they can review and manage personal details, plans, and proposals

<u>Acceptance Criteria</u>

* Advisers can navigate to a Scenario Details page from the Scenario Index
* The page displays the scenario name and a status badge (e.g. "Research in scenario is up to date")
* Advisers can navigate between scenarios using Previous and Next buttons
* An Actions dropdown menu provides the following options:
  * Add related entity (Sub-menu: Super fund, Investment account, Pension account, SMSF)
  * Fact Find
  * Recommendation Reason
  * Insurance Needs
  * Check for updated data
  * Quick Merge (Sub-menu: Merge client data, Merge partner data)
  * Compliance
* The page has three main sections:

**Personal Details Section**
* Displays client and partner information side by side with:
  * Name
  * Age
  * Retirement Date (formatted)
  * Ordinary Wages (formatted as currency)

**Current Situation Section**
* Displays existing plans in a table with columns:
  * Platform (clickable link)
  * Type
  * Account Balance (currency formatted, right-aligned)
* Plans are grouped by entity (Client, Partner, Joint) with collapsible group headers showing totals
* Each plan row has a dropdown menu with:
  * Edit Existing Plan
  * Edit Plan Fees
  * View Plan Research (opens a modal with plan name, star rating, status, documents, and description)
  * Remove Plan
* Plans with warnings display an AlertTriangle icon and warning badge
* An "Add Existing" button opens a three-level cascading menu:
  * Level 1: Entity (Client, Partner, Joint)
  * Level 2: Type (Super Plan, Pension Plan, Investment Platform, Other Assets)
  * Level 3: Asset category (when Other Assets selected)

**Proposals Section**
* Displays proposals in a tabbed interface
* Each tab shows a proposal label with a [PR] badge prefix for Plan Review proposals
* Each tab has a dropdown menu with: Rename proposal, Delete proposal, Copy proposal, Combine proposals
* Advisers can rename a proposal via a modal dialog with a text input field
* Each proposal tab displays a table with:
  * Action dropdown (Edit Proposal, Edit Fees, Insurance Review, Replacement Advice, View Plan Summary & PDS)
  * Owner name (Client, Partner, Joint)
  * Proposal type (link, with AlertTriangle if warning)
  * "From" rows: Source platform name, type, and balance
  * "To" rows: Destination platform name, type, and proposed balance
* A status dropdown provides options: Not Accepted, Recommend and Acquire, Like-for-like comparison
* If no proposals exist, the message "No proposals have been specified" is displayed
* An "Add Proposal" button allows selecting entity (Client, Partner, Joint)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## 6. WealthSolver Plan Research

### 6.1 Advisers can search and view investment plans so that they can research suitable products for clients

<u>Acceptance Criteria</u>

* Advisers can navigate to the Plans page to view a searchable list of investment plans
* The page displays a sidebar with the following filters:
  * Search
    * Optional
    * Text field
    * Placeholder: "Plan name…"
  * Plan Type
    * Optional
    * Dropdown
    * Options: All, Investment Platform, Super, Pension
    * Default: All
  * Plan Manager
    * Optional
    * Dropdown
    * Options: All, plus dynamically loaded managers
    * Default: All
  * Open for New Business
    * Optional
    * Dropdown
    * Options: All, Yes, No
    * Default: All
  * Sort
    * Optional
    * Dropdown
    * Options: A-Z, Z-A, Rating High-Low, Rating Low-High
    * Default: A-Z
* Plans are displayed in a table with columns:
  * Product Name (clickable link)
  * Manager
  * Type
  * Subtype
  * Rating (star display, 1-5)
  * Open (Yes/No)
* Advisers can click on a plan row to navigate to the Plan Detail page
* The total number of matching plans is displayed (e.g. "X plan(s)")
* An "Add Plan" button allows creating a new plan

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* Plan data may be large; filtering should be applied before displaying results

---

### 6.2 Advisers can view plan details so that they can evaluate product suitability

<u>Acceptance Criteria</u>

* Advisers can navigate to the Plan Detail page from the plan list
* The page header displays the plan name with a "Derived" label if the plan is derived from another
* Action buttons: Investment Options, Edit (dropdown), Back, Report (disabled)
* A banner displays if the plan has changed fields (red) or is derived from another plan (blue, with link to source)
* The Product Overview section displays:
  * Name
  * Product SPIN, USI, Iress SPIN
  * Plan Subtype
  * Open for New Business status
  * Product Type
  * Product documents (as links)
  * TMD Status
* The Edit dropdown provides options:
  * Edit Research
  * Edit Fees
  * Edit Product Documents
  * Derive Plan (if not already derived)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### 6.3 Advisers can derive a plan so that they can customise products for specific client needs

<u>Acceptance Criteria</u>

* Advisers can create a derived version of an existing plan by selecting "Derive Plan" from the Edit menu
* The derived plan maintains a linkage to the source plan
* The derived plan header shows a "Derived" label and a blue banner linking to the source plan
* Advisers can customise specific fields on the derived plan without affecting the source
* Changed fields are marked with an asterisk (*) and a red disclaimer banner

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## 7. Plan Management

### 7.1 Advisers can edit existing plans so that they can manage investment allocations and balances

<u>Acceptance Criteria</u>

* Advisers can navigate to the Edit Existing Plan page from the Current Situation section
* The page provides tabs: Investment Funds Selection, Contribution Amounts, Pension Details, Insurance Premiums, Balances/Aggregation
* The Investment Funds tab allows:
  * Searching and selecting from an investment catalogue
  * Viewing selected funds with their allocations
  * Manual asset allocation entry
  * Weighted allocation summary
* The Balances/Aggregation tab allows:
  * Account balance management
  * Multi-entity aggregation

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

### 7.2 Advisers can add investments to a plan so that they can build an appropriate portfolio

<u>Acceptance Criteria</u>

* Advisers can navigate to the Add Investment page from the Edit Existing Plan page
* Two modes are available:
  * Plan Investment Menu — search and select from existing fund catalogue
  * Manual Fund Entry — enter custom fund details
* The search panel provides:
  * Investment name search
  * APIR code search
  * Fund type filters
  * Checkbox selection for multiple investments
* Selected investments are displayed in a list with:
  * Investment name
  * Amount entry field per investment
  * Allocation breakdown
  * Remove button per row

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None

---

## 8. Client Page

### 8.1 Advisers can view client information so that they can access all client-related data in one place

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
* The Insurance sub-tab displays the full Insurance Research content (same as the standalone Insurance Research page)

<u>Designs</u>

* To be added

<u>Security and Technical Considerations</u>

* None
