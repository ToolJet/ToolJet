# ToolJet Cypress Tests

## Project Structure

```
cypress/
  e2e/happyPath/appbuilder/component-new/   → Component test specs (*.cy.js)
  support/utils/appBuilder/components/properties/
    common.js            → Shared utilities (genralProperties, verifyVisibility, etc.)
    <component>.js       → Component-specific verification functions
```

## Test Writing Conventions

### File Naming

- Test spec: `cypress/e2e/happyPath/appbuilder/component-new/<component>.cy.js`
- Utility: `cypress/support/utils/appBuilder/components/properties/<component>Component.js`

### Test Structure Pattern

Every component test follows this structure:

1. **Selectors block** at top of describe — all `data-cy` selectors as constants
2. **`beforeEach`** — visits the app URL, sets viewport to 1800x1400
3. **Test cases** — each `it()` calls utility functions from the properties files
4. **`setup()` helper** — common setup steps (toggle desktop mode, ensure visibility)

### Selector Conventions

- Component: `[data-cy="draggable-widget-<name>"]` (often with `:eq(1)`)
- Toggles: `[data-cy="toggleswitch<N>"] .d-flex`
- Feature toggles: `[data-cy="<featurename>"] input[type="checkbox"]`
- JS action buttons: `[data-cy="js<action>-label"]`
- CSA controls: `[data-cy="csa<property>"] .d-flex`
- Dropdowns: `[data-cy="draggable-widget-dropdown<N>"] > .dropdown-widget`
- Number inputs: `[data-cy="numberinput<N>-input"]`
- Color pickers: `[data-cy="colorpicker<N>"]>.d-flex`

### Utility Function Pattern

- Functions in `common.js` are generic (visibility, disability, loading state, dropdown, color picker, number input)
- Functions in `<component>Component.js` are component-specific verifications
- All verification functions take `componentSelector` as first param
- Use `cy.get(selector).should(...)` pattern for assertions

### Common Utilities Available (common.js)

- `genralProperties(componentSelector, controllerSelector, options)` — click a control and verify state
- `selectDropdownOption(dropdownSelector, label)` — select from dropdown
- `setColorPickerValue(colorPickerSelector, hex)` — set color via picker
- `setNumberInputValue(inputSelector, value)` — set numeric input
- `verifyVisibility(componentSelector, controls)` — test visibility toggle/CSA/JS
- `verifyDisability(componentSelector, controls)` — test disable toggle/CSA/JS
- `verifyLoadingState(componentSelector, controls)` — test loading state toggle/CSA/JS

## Playwright MCP Workflow for Selector Extraction

When writing tests for a new component, use the Playwright MCP browser tools to:

1. **Navigate** to the component's test app URL
2. **Extract selectors** by evaluating JS: `document.querySelectorAll('[data-cy]')`
3. **Interact** with toggles/controls to discover dynamic states
4. **Verify** computed styles and attributes match expected assertions
5. **Write** the test spec and utility files following the patterns above

### Browser Interaction Commands

```
browser_navigate → Open the app URL
browser_snapshot → Get accessibility tree (all elements)
browser_evaluate → Run JS to extract data-cy attributes, computed styles
browser_click → Click toggles, buttons, dropdowns
browser_type → Type into inputs
browser_screenshot → Visual confirmation
```

## Config

- `baseUrl` override: Tests use `{ baseUrl: null }` in describe options since they visit external URLs
- Viewport: 1800x1400 (set in beforeEach)
- `cypress.config.js` has default viewport 1440x960 but tests override
