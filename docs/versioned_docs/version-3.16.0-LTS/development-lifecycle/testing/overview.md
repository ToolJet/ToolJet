---
id: overview
title: Overview
---

# Automation Testing Overview

ToolJet generates stable, predictable test selectors for every component you add to your canvas. You get reliable automation hooks out of the box, with no extra setup, no developer effort, and no selector maintenance overhead.

## How It Works

Every component you name in the ToolJet builder automatically receives `data-cy` attributes on all its interactive elements. The selector is derived from the **component name you set**, not from the DOM structure, so it survives theme changes, layout updates, and redesigns.

### Selector Pattern

The rule is: **component name (lowercased) + element type**.

Name a button `btnSubmit` and you get `btnsubmit-button` as a test hook. Name a table `tableOrders` and every row, cell, and column header is immediately addressable.

**Button component** named `btnFetchUsers`:

```
[data-cy="btnfetchusers-button"]   → click the button
[data-cy="btnFetchUsers-label"]    → verify its label text
[data-cy="btnFetchUsers-icon"]     → verify icon presence
```

**Table component** named `tableUsers`:

```
[data-cy="tableusers-row-0"]          → click a row
[data-cy="tableusers-name-row-0"]     → read a cell value
[data-cy="name-column-header"]        → sort a column
```

## Why `data-cy` Selectors

Without stable selectors, tests are tied to DOM structure and CSS class names. A single layout change can break dozens of test cases overnight.

**Without `data-cy`:**

```javascript
cy.get(".sc-bdfBwQ > .sc-gsnTZi > button:nth-child(2)").click();
cy.get("table tbody tr:first-child td:nth-child(3)").should("have.text", "...");
```

**With ToolJet's `data-cy`:**

```javascript
cy.get('[data-cy="btnfetchusers-button"]').click();
cy.get('[data-cy="tableusers-email-row-0"]').should("contain.text", "...");
```

The selector is stable because it reflects the component name you set in the builder, not where the element happens to live in the DOM.

## Prerequisites

- A deployed ToolJet application
- Components named clearly in the ToolJet builder (e.g., `btnSubmit`, `tableOrders`, `inputSearch`)
- [Cypress](https://docs.cypress.io/app/get-started/install-cypress) installed in your project

:::info
Open DevTools on your deployed application and search for `data-cy` to see all available selectors. Every named component is already tagged and ready to use.
:::

## Next Steps

- Follow the [Cypress Guide](/docs/development-lifecycle/testing/cypress-guide) to write your first test and automate a complete user workflow.