---
id: cypress-guide
title: Writing Cypress Tests for ToolJet Applications
---

# Writing Cypress Tests for ToolJet Applications

This guide walks through writing Cypress tests for a ToolJet application using the `data-cy` selectors that ToolJet generates automatically for every named component.

## Prerequisites

- A deployed ToolJet application with components named in the builder
- Node.js installed in your project

Install Cypress if you haven't already:

```bash
npm install cypress --save-dev
```

## Your First Test

```javascript
cy.visit("https://app.tooljet.com/applications/automationapp");

cy.get('[data-cy="btnfetchusers-button"]').click();

cy.get('[data-cy="tableusers-name-row-0"]').should("contain.text", "Leanne Graham");
```

Visit the application, click a button, verify the result. No page objects, no selector hunting, no DOM traversal.

## Testing a Complete User Workflow

The following example tests a full search-and-detail workflow covering a real user journey:

```javascript
// Step 1 - Type a username to filter
cy.get('[data-cy="inputusername-input"]').clear().type("Bret");

// Step 2 - Click the fetch button
cy.get('[data-cy="btnfetchusers-button"]').click();

// Step 3 - Verify the correct user appears in the table
cy.get('[data-cy="tableusers-name-row-0"]').should("contain.text", "Leanne Graham");
cy.get('[data-cy="tableusers-username-row-0"]').should("contain.text", "Bret");

// Step 4 - Click the row to open the detail panel
cy.get('[data-cy="tableusers-row-0"]').click();

// Step 5 - Verify the detail panel updates correctly
cy.get('[data-cy="text3-text"]').should("contain.text", "Leanne Graham");
cy.get('[data-cy="text5-text"]').should("contain.text", "Sincere@april.biz");
```

Every selector is predictable. Every component is testable with zero guesswork.

## Selector Reference

Name your components clearly in the ToolJet builder and the selectors follow automatically.

| Component Type | Selector Pattern | Example |
|:---|:---|:---|
| Button | `[data-cy="{name}-button"]` | `[data-cy="btnfetchusers-button"]` |
| Text Input | `[data-cy="{name}-input"]` | `[data-cy="inputusername-input"]` |
| Text | `[data-cy="{name}-text"]` | `[data-cy="text3-text"]` |
| Table Row | `[data-cy="{name}-row-{n}"]` | `[data-cy="tableusers-row-0"]` |
| Table Cell | `[data-cy="{name}-{column}-row-{n}"]` | `[data-cy="tableusers-name-row-0"]` |
| Column Header | `[data-cy="{column}-column-header"]` | `[data-cy="name-column-header"]` |

:::info
Open DevTools on your deployed application and search for `data-cy` to discover all available selectors. Every named component is already tagged.
:::

## Quick-Start Checklist

1. **Name your components clearly** in the ToolJet builder, for example: `btnSubmit`, `tableOrders`, `inputSearch`.
2. **Open DevTools** on your deployed application and search for `data-cy` to confirm the selectors are present.
3. **Write tests** using `cy.get('[data-cy="..."]')`. The selectors are already there.
4. **Follow the naming pattern**: `{componentname}-{element}` for buttons and inputs; `{componentname}-row-{n}` for table rows.
5. **Integrate with CI**. These selectors are stable across deployments, so tests pass consistently without maintenance.

## Example Test Results

The following output is from a User Lookup demo application. Six tests cover seven user workflows and complete in 28 seconds:

```
User Lookup Demo App - Functional Automation
  Initial State
    ✓ should render all components correctly in empty/default state (3.8s)
  Fetch All Users
    ✓ should populate the table with 10 users and auto-select first row (3.8s)
  Row Selection & Detail Panel Updates
    ✓ should update the detail panel correctly for multiple row selections (4.5s)
  Username Filter
    ✓ should filter by username, handle edge cases, and restore full list (5.8s)
  Table Column Sorting
    ✓ should sort table by different columns and restore original order (4.3s)
  Table Utilities
    ✓ should provide functional download and column management controls (3.8s)

6 passing (28s)
```

Tests run this fast because the selectors are stable. No retries, no flakiness from brittle DOM traversal.