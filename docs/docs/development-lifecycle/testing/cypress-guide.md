---
id: cypress-guide
title: Cypress Guide
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

## Finding Your Selectors

Open DevTools on your deployed application and search for `data-cy`. Every named component is already tagged and ready to use.

## Your First Test

```javascript
cy.visit("https://app.tooljet.com/applications/your-app");

cy.get('[data-cy="btnfetchusers-button"]').click();

cy.get('[data-cy="tableusers-name-row-0"]').should("contain.text", "Leanne Graham");
```

Visit the application, click a button, verify the result. No page objects, no selector hunting, no DOM traversal.

## Testing a Complete User Workflow

The following example tests a full search-and-detail workflow:

```javascript
// Type a username to filter
cy.get('[data-cy="inputusername-input"]').clear().type("Bret");

// Fetch results
cy.get('[data-cy="btnfetchusers-button"]').click();

// Verify the correct user appears in the table
cy.get('[data-cy="tableusers-name-row-0"]').should("contain.text", "Leanne Graham");
cy.get('[data-cy="tableusers-username-row-0"]').should("contain.text", "Bret");

// Click the row to open the detail panel
cy.get('[data-cy="tableusers-row-0"]').click();

// Verify detail panel content
cy.get('[data-cy="text3-text"]').should("contain.text", "Leanne Graham");
cy.get('[data-cy="text5-text"]').should("contain.text", "Sincere@april.biz");
```

## Selector Reference

Name your components clearly in the ToolJet builder and the selectors follow automatically.

| Component | Element | Selector Pattern |
|:---|:---|:---|
| Button | Clickable button | `[data-cy="{name}-button"]` |
| Button | Label text | `[data-cy="{name}-label"]` |
| Text Input | Input field | `[data-cy="{name}-input"]` |
| Text | Text content | `[data-cy="{name}-text"]` |
| Table | Row | `[data-cy="{name}-row-{n}"]` |
| Table | Cell | `[data-cy="{name}-{column}-row-{n}"]` |
| Table | Column header | `[data-cy="{column}-column-header"]` |

:::info
`{name}` is always the lowercased version of your component name. A component named `btnFetchUsers` becomes `btnfetchusers` in every selector.
:::

## Why This Approach Is Reliable

Traditional selectors break whenever the UI changes:

```javascript
// Fragile - breaks on any CSS or layout change
cy.get(".sc-bdfBwQ > .sc-gsnTZi > button:nth-child(2)").click();
```

ToolJet's `data-cy` selectors are tied to the component name, not the DOM structure:

```javascript
// Stable - survives redesigns, theme changes, and layout updates
cy.get('[data-cy="btnfetchusers-button"]').click();
```

## Quick-Start Checklist

1. **Name your components clearly** in the ToolJet builder, for example: `btnSubmit`, `tableOrders`, `inputSearch`.
2. **Open DevTools** on your deployed application and search for `data-cy` to confirm selectors are present.
3. **Write tests** using `cy.get('[data-cy="..."]')`. The selectors are already there.
4. **Integrate with CI**. These selectors are stable across deployments, so tests pass consistently without maintenance.

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