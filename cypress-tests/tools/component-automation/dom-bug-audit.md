# DOM-Bug Audit — lts-3.16 helper foundation
<!-- Task 6 of 2026-08-31-tj-build-cypress-components-01-helper-foundation -->
<!-- Audited: 2026-08-31 -->

## Methodology
All findings are derived from static code inspection of this branch (`feat/tj-component-test-skill`
based on `lts-3.16`). No dev server was available; live-DOM checks are marked **DEFERRED**.
The three bugs listed in the 34-day-old memory note were each verified against current code
before any fix was applied.

---

## Bug 1 — `(Legacy)` widget drag: unquoted `[data-cy=...-(legacy)]` selector

**Claimed bug:** Old `dragAndDropWidget` used an unquoted `[data-cy=...-(legacy)]` attribute
selector; parentheses in the value break jQuery/Cypress CSS parsing.

### Evidence

```
$ grep -n "legacy" cypress/commands/commands.js cypress/support/utils/commonWidget.js
(no output)
```

No `legacy` string appears anywhere in `commands.js` or `commonWidget.js`.

Inspecting the current `dragAndDropWidget` implementation
(`cypress-tests/cypress/commands/commands.js:91-141`):

```js
const sourceSelector = `.draggable-box:has([data-cy=widget-list-box-${cyParamName(widgetName2)}])`;
cy.realDragRewarm();
cy.realDragAndDrop(sourceSelector, resolvedCanvas, { targetX: positionX, targetY: positionY });
```

The selector uses `cyParamName()` (which produces a safe, kebab-case string) and targets the
`.draggable-box` ancestor — not any `(legacy)` variant. The old `[data-cy=...-(legacy)]` form
does not exist in the codebase.

**Verdict: NOT REPRODUCED — already fixed on lts-3.16. No action taken.**

---

## Bug 2 — Styles sidebar selector: `buttonStylesEditorSideBar`

**Claimed bug:** The selector to open the Styles panel in the right inspector sidebar may be
stale or inconsistent.

### Evidence

Constant definition (`cypress-tests/cypress/constants/selectors/common.js:397`):
```js
buttonStylesEditorSideBar: "#inspector .nav-link:eq(1)",
```

The comment at lines 391-396 explains the evolution:

> The right-Inspector tabs are now a custom ToolJetUI `<Tabs id="inspector">` — each tab is a
> `button[role="tab"]` with `className="nav-link"`. The old `#inspector-tab-styles` (react-bootstrap
> id) no longer exists. Styles is the 2nd nav-link, scoped to the `#inspector` Tabs wrapper.

Cross-checked against the live component sources:

- `frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx:620`:
  ```jsx
  <Tabs defaultActiveKey={'properties'} id="inspector" hidden={isModuleContainer}>
  ```
- `frontend/src/ToolJetUI/Tabs/Tabs.jsx:50`:
  ```jsx
  className={cx('nav-link', { active: isActive, disabled })}
  ```

The element rendered is `button.nav-link` inside a `div#inspector` container.
`#inspector .nav-link:eq(1)` is a valid Cypress selector for the 2nd tab (Styles).

Usage sites (`commonWidget.js:542`, `button.js:63`, `modal.js:41`, `inputFieldUtils.js:97`) all
reference the constant — no raw string divergence.

**Verdict: NOT REPRODUCED — selector is correct and consistent on lts-3.16. No action taken.**

> Note: Cypress's `:eq()` is a jQuery extension and does work in `cy.get()`. The selector is
> fragile if a third tab is inserted before index 1, but that is a design concern, not a current
> bug. DEFERRED: confirm Styles tab is actually index 1 (not 0) when a running dev server is
> available.

---

## Bug 3 — `add-event-handler` selector in `selectEvent` / `addMultiEventsWithAlert`

**Claimed bug:** The `[data-cy="add-event-handler"]` selector passed to `selectEvent` may not
match the actual app-builder DOM node.

### Evidence

Selector in helper (`cypress-tests/cypress/support/utils/events.js:20`):
```js
addEventhandlerSelector = '[data-cy="add-event-handler"]',
```

Source of truth in EventManager
(`frontend/src/AppBuilder/RightSideBar/Inspector/EventManager.jsx:1315`):
```jsx
data-cy="add-event-handler"
```

The selector used in the helper **exactly matches** the `data-cy` attribute in the production
component. The `selectEvent` function also correctly uses the new popover flow:

```js
cy.get(addEventhandlerSelector).eq(index).click();
cy.get('[data-cy="add-event-menu"]').should("be.visible");
cy.contains('[data-cy^="event-trigger-option-"]', new RegExp(`^${event}$`, "i")).click();
```

This matches the current EventManager.jsx popover-based flow (not the old `event-selection`
dropdown). All constant aliases (`addEventHandlerLink`, `addMoreEventHandlerLink`,
`multiEnv.js:addEventHandlerButton`, `dataSource.js:addEventHandler`,
`postgreSql.js:addEventHandler`) are consistently `[data-cy="add-event-handler"]`.

**Verdict: NOT REPRODUCED — selector is correct and matches the live frontend. No action taken.**

> DEFERRED: end-to-end confirmation that clicking the button opens `add-event-menu` in a real
> browser requires a running dev server.

---

## Summary

| # | Bug | Reproduced? | Action |
|---|-----|-------------|--------|
| 1 | `(Legacy)` drag selector with unquoted parens | NOT REPRODUCED | Already fixed on lts-3.16 — no change |
| 2 | `buttonStylesEditorSideBar` selector stale/inconsistent | NOT REPRODUCED | Selector is correct and consistent — no change |
| 3 | `add-event-handler` selector mismatch | NOT REPRODUCED | Selector matches EventManager.jsx exactly — no change |

No helper files were modified. The audit document is the sole deliverable for Task 6.
