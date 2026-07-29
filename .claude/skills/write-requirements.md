# How to Write Software Requirements

## Purpose

This document explains how to write software requirements for client projects.

These requirements are documented so that clients know and agree to what will be built, so developers know what to build, and so QAs know what to test.

## Writing clear software requirements

All functional software requirements should be comprised of the following:

* User story

  * A title that describes the requirement at a high level, ideally from a user's perspective
  * It often takes the form of 'Users can do X so that Y' where X is the action and Y is the benefit to them
* Acceptance criteria

  * Bullet points of the specifics required to meet the desired functionality
  * As a general rule, 80% is focused on the expected case ('happy path') and 20% is focused on the exceptions
* Designs

  * Links to relevant designs in Figma or the URL of a referenced Prototype
* Security and Technical Considerations

  * Any security or technical notes relevant to the specific user story

For example:

### Users can view tasks so that they can easily see what's on their to do list

### Acceptance Criteria

* Users can navigate to the Tasks page to view a list of their tasks
* Tasks are displayed in a table with the following columns:

  * Task name
  * Due date
  * Assignee
* Users can filter the table by any of the columns
* Users can sort the table by any of the columns

  * Tasks are ordered by 'Due date' (ascending) by default
* The task table is paginated by 10 records
* Users can click on any row to open the Task Details page

### Designs

* Example link to Figma file or prototype URL
* Example link to Figma file or prototype URL

### Security and Technical Considerations

* As the user may have a very large number of tasks, a maximum limit should be returned for performance reasons

## Form Field Requirements

When a user story includes form fields, the following must be specified:

* Mandatory Status
* Field type
* Default value
* Input validation
* Conditional logic (if required)

These MUST be noted as indented bullet points within the user story itself (not in a separate section of the user story). For example:

* Users can add a new user by clicking the 'Add' button and opening a modal with the following form fields:

  * First Name

    * Mandatory
    * Text field
    * Empty by default
    * Only accepts alphabetical characters (no numbers)
  * Last Name

    * Optional
    * Text field
    * Empty by default
    * Only accepts alphabetical characters (no numbers)
* Users can submit the form by filling out the form fields and clicking the 'save' button
* Any field errors will be indicated in the fields with an accompanying error message at the bottom of the form

## Formatting

When writing acceptance criteria / user stories, use markdown but use bullet points * not hypens for indentation.

The section headings within each user story ("Acceptance Criteria", "Designs", and "Security and Technical Considerations") should be underlined text, not markdown headings. For example:

<u>Acceptance Criteria</u>

<u>Designs</u>

<u>Security and Technical Considerations</u>

## Guidelines for writing good requirements

Create all user stories for a sprint in a single markdown file in /specifications/new so it can be easily imported to Google Docs later as a full specification document.

The following should be applied when planning requirements:

### Simplicity

Always write requirements for the simplest version of the feature unless explicitly requested otherwise.

E.g. when displaying a table of data, do not also add a card view unless asked.

### DevExpress

Unless specified otherwise, assume that DevExpress components are used for datagrids and forms.

While this does not need to be specified explicitly in requirements, functionality written should conform to default DevExpress components where possible.
For example, we typically include pagination and column filtering when showing data in a table because they are included for free with DevExpress DataGrid.

### Technical Guidelines

Requirements should focus on what should happen more than how it should be achieved technically.
Avoid talking about technical implementation unless there's a very specific watch out that needs to be mentioned to the dev team.
E.g. for user accounts do not talk about salting and hashing passwords.

### Performance

Always consider how a feature will handle large amounts of data. For example, if a table will show a large amount of data, it is suggested to first get the user to apply a filter (e.g. date range)

### Data Model Stories

Standalone data model stories (e.g., "The system stores X") are only needed for backend-only features with no corresponding UI.

For features with UI, data model fields should be integrated into the relevant CRUD operation stories rather than written as separate data model stories. For example, instead of having a separate "The system stores User data" story, the data fields should be included in "Admins can add a new user" or "Users can view their profile".

## YouTrack Integration

If asked to create the user story in YouTrack, use the YouTrack MCP server with the following details:

When creating user stories in YouTrack:

* **Project key**: `BLUEPRINT` (always use this)
* **Sprint**: Ask me first
* **Issue type**: `User Story`

The user story summary should follow the standard format: "Users can do X so that Y". The description should use the same structure and formatting defined in the "Writing clear software requirements" section above.

## Playwright MCP

When I reference visuals in a prototype (e.g. a React prototype), ensure it's running and then use Playwright to visually check what I am referring to.

## Product Overview

**IMPORTANT**: Before starting work, review /specifications/product-overview.md for full architecture context.
