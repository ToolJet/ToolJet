# PRD: Cascader Component


## Problem Statement

ToolJet builders can already use Tree Select to work with hierarchical data, but Tree Select presents the entire hierarchy as an expanded tree of checkboxes. This is useful for parent-child checkbox flows, but it is heavy when the builder only needs an input-like control where an app user selects one item from a hierarchy.

Builders need a Cascader component that supports hierarchical selection in a compact dropdown format. The component should feel familiar to users coming from Retool, while staying consistent with ToolJet's existing Tree Select data model, exposed variable conventions, validation, events, and component-specific actions.

## Product Goal

Add a Cascader component that lets app users select a single hierarchical option through a dropdown path picker.

The Cascader should reuse the Tree Select hierarchical schema wherever possible, but expose state as a selected path rather than checkbox state.

## Non-Goals

- Multi-select Cascader behavior.
- Checkbox behavior inside the Cascader dropdown.
- Lazy-loading child options on expand.
- Async per-level option fetching.
- Search inside Cascader options.
- Dynamic height.
- Replacing Tree Select.
- Changing existing Tree Select behavior or exposed variables.

## Reference Products

### Retool

Retool keeps Cascader close to input/select behavior. It exposes a selected `value`, option data, label, indexed option metadata, validation state, and a selected value path. It does not carry Tree/CheckboxTree-specific checked, expanded, or leaf path variables into Cascader.

### Ant Design

Ant Design's Cascader is the closest interaction reference for ToolJet Cascader. It accepts nested `label`, `value`, and `children` options, renders a side-by-side cascading menu, and outputs the selected path. ToolJet should follow this interaction model while keeping ToolJet's component configuration, exposed variables, validation, events, and component-specific actions.
https://ant.design/components/cascader

ToolJet should not copy Ant Design's selected value contract directly. In ToolJet, `value` should remain the final selected node value, while `pathArray`, `pathLabels`, and `pathString` expose the full selected path.

### Cascader Shadcn

Cascader Shadcn is a useful engineering reference for a side-by-side cascading dropdown built with shadcn-style primitives. ToolJet should use it as an interaction and implementation reference only; this PRD does not require adding it as an external dependency.
https://cascader-shadcn.surge.sh/

ToolJet Cascader should combine those ideas: Tree Select data shape with Select-like input presentation.

## Users

1. ToolJet app builders who need hierarchical single selection in forms and dashboards.
2. App end users who need to pick a final item from nested categories, locations, departments, product taxonomies, or permissions.
3. ToolJet developers and support teams who need the component to follow existing component conventions.

## User Stories

1. As an app builder, I want to add a Cascader component to the canvas, so that users can select from hierarchical data in a compact input.
2. As an app builder, I want to pass the same `label`, `value`, and `children` schema used by Tree Select, so that I can reuse existing data transformations.
3. As an app builder, I want to configure dynamic options, so that the Cascader can render data returned from queries.
4. As an app builder, I want the Cascader to expose the selected value, so that I can use it in queries and conditions.
5. As an app builder, I want the Cascader to expose the component label, so that it is consistent with ToolJet input components.
6. As an app builder, I want the Cascader to expose the full selected path as values, so that I can understand the selected hierarchy.
7. As an app builder, I want the Cascader to expose the full selected path as labels, so that I can display a human-readable hierarchy.
8. As an app builder, I want a string representation of the selected path, so that I can use it directly in text, tables, forms, and queries.
9. As an app builder, I want the Cascader to support disabled state, so that I can prevent user changes based on app logic.
10. As an app builder, I want the Cascader to support loading state, so that I can show progress while options are being prepared.
11. As an app builder, I want the Cascader to support visibility state, so that I can conditionally show or hide it.
12. As an app builder, I want mandatory validation, so that forms can require a Cascader selection.
13. As an app builder, I want custom validation, so that I can enforce app-specific rules.
14. As an app builder, I want `onSelect`, so that I can trigger actions when the user selects an option.
15. As an app builder, I want `onFocus`, so that I can trigger actions when the component receives focus.
16. As an app builder, I want `onBlur`, so that I can trigger actions when the component loses focus.
17. As an app user, I want to open a dropdown and drill through hierarchy levels, so that I can find the option I need without scanning a full tree.
18. As an app user, I want the selected path to be visible in the input, so that I can confirm what I selected.
19. As an app user, I want disabled or hidden options to behave consistently with other ToolJet components, so that the UI feels predictable.
20. As an app user, I want clear empty and invalid states, so that I understand what action is needed.
21. As an app builder, I want the Cascader to use a side-by-side columns layout, so that users can see hierarchy levels while navigating.

## Functional Requirements

### Component Metadata

The Cascader widget config should use:

| Field | Value |
| --- | --- |
| `name` | `Cascader` |
| `displayName` | `Cascader` |
| `description` | `Hierarchical single item selector` |
| `defaultSize.width` | `10` |
| `defaultSize.height` | `40` |

### Data Model

The Cascader should accept hierarchical options using the Tree Select-compatible shape:

```json
[
  {
    "label": "Asia",
    "value": "asia",
    "children": [
      {
        "label": "China",
        "value": "china",
        "children": [
          { "label": "Beijing", "value": "beijing" }
        ]
      }
    ]
  }
]
```

Each option `value` should be unique across the full tree. Full-tree uniqueness is required because the exposed `value` and `setValue(value)` API use a scalar final node value and must resolve to exactly one selected path.

The Cascader should follow Tree Select's static/dynamic option configuration pattern:

| Property | Display name | Behavior |
| --- | --- | --- |
| `options` | Options | Static nested options. |
| `advanced` | Dynamic options | Toggles dynamic option configuration. |
| `data` | Schema | Dynamic nested options when `advanced` is enabled. |

Options may support existing Tree Select-style per-node fields where applicable:

- `label`
- `value`
- `children`
- `disable`
- `visible`

The Cascader should use nested JSON as its configuration contract. It should not add a flat-array parent-key configuration model such as `parentKeyByIndex`, `labels`, `values`, or `disabledValues`.

### Selection Behavior

The Cascader should use single selection.

The Cascader should support a Default value property (`value`). This property should accept a least-child option value. The component should use it to compute the initial `value`, `selectedValue`, `pathArray`, `pathLabels`, and `pathString`.

The property display name should be `Default value`; the property key should be `value`. The exposed variable should also be `value`, consistent with ToolJet input components.

The Default value property should accept a scalar final option value only. It should not accept option objects or path arrays.

Selection should happen only on the least child node in a branch. Parent nodes should navigate to their children, not select the parent.

Disabled nodes should block interaction entirely. A disabled parent should not open its child column, which means its descendants are unreachable through the UI unless the parent is enabled.

Disabled leaf nodes should remain visible but should not be selectable.

Hidden parent nodes should remove the entire branch from the rendered option tree. Descendants of a hidden parent should not appear in the Cascader, even if the descendant nodes are individually visible.

If the current selected value becomes hidden or is removed from the rendered option tree due to dynamic option changes, the component should clear selection and recompute validation.

The Cascader should support a Trigger mode property (`triggerMode`) that controls how parent nodes open child columns:

| Mode | Behavior |
| --- | --- |
| `click` | Parent nodes open child columns on click. This is the default mode. |
| `hover` | Parent nodes open child columns on hover. |

`triggerMode` should be a component property, not a style setting, because it changes interaction behavior.

`onSelect` should fire only when the selected value changes due to an explicit user selection.

The dropdown should close only after the user selects the least child node in a branch. Navigating parent nodes should keep the dropdown open.

Programmatic value updates through component-specific actions should follow DropdownV2 event behavior. `setValue(value)` should fire `onSelect` when it selects a valid least-child option. Invalid `setValue(value)` calls should clear selection and recompute validation without firing `onSelect`. `clearValue()` should not fire `onSelect`.

### Display Behavior

The component should render as an input/dropdown component, not as an always-visible tree.

The input should display `pathString`, not only the selected option label.

The Cascader should support a Path separator property (`pathSeparator`). This property controls the separator used to render the selected path in the input and in `pathString`. The default value should be `/`.

`pathSeparator` should be a component property, not a style setting, because it changes displayed value formatting and the exposed `pathString`.

`pathSeparator` should accept any string, including an empty string.

If no value is selected, the component should show a placeholder.

The Cascader should support a Placeholder property (`placeholder`). The default value should be `Select an option`.

The Cascader should support a Show clear selection button property (`showClearBtn`). The default value should be `true`. When enabled, the clear button should appear only when a value is selected and the component is not disabled. Clearing from the UI should reset `value`, `selectedValue`, `pathArray`, `pathLabels`, and `pathString`, recompute validation, and fire `onSelect`, matching DropdownV2 clear behavior.

`showClearBtn` should live in Additional actions to match existing ToolJet input component conventions.

The Cascader should support an Options loading state property (`optionsLoadingState`). When enabled, the dropdown should still open and the options panel should show a spinner while preserving the input shell. This is distinct from `loadingState`, which represents loading for the whole component. `optionsLoadingState` should work regardless of whether `advanced` dynamic options are enabled.

When `loadingState` is enabled, the whole component should show its loading state and block dropdown opening, parent navigation, and selection.

When `disabledState` is enabled, the component should block dropdown opening, parent navigation, selection, and clear button interaction.

Changing component visibility should not clear selection. Hidden Cascader components should preserve `value`, `selectedValue`, `pathArray`, `pathLabels`, and `pathString`.

The Cascader should support `collapseWhenHidden` in Additional actions. The default value should be `false`.

If the selected value does not exist in the option tree, the component should enter a safe empty without crashing.

If the options array is empty, or all options are hidden, the dropdown should show `No options`.

The Cascader should use a side-by-side cascading columns layout. Parent nodes should open the next column using the configured `triggerMode`. Least child selection should select the item and close the dropdown.

When the dropdown opens with an existing selection, it should render the columns along the selected path, highlight the selected least-child option, and visually indicate the ancestor path.

Each column should scroll vertically when its options exceed the available dropdown height. The PRD should not introduce a builder-facing max-height property; dropdown sizing and placement should follow existing ToolJet dropdown/popover conventions.

Option rows should remain single-line and truncate long labels to keep column width and row height stable.

Tooltips for truncated option rows are optional. They may be included if the chosen implementation or existing ToolJet UI primitive supports them without extra custom behavior.

Selection state, active path, path derivation, validation, events, and component-specific actions should live outside the columns layout renderer. The columns renderer should consume shared Cascader state so future layouts can reuse the same behavior contract.

The Cascader should support basic keyboard navigation:

- `Enter` or `Space` opens the dropdown when the input is focused.
- `Escape` closes the dropdown.
- Arrow keys move focus between options and columns.
- `Enter` selects a focused least-child option.
- `Tab` follows normal browser focus behavior.

### Events

The Cascader should support these events:

| Event | Trigger |
| --- | --- |
| `onSelect` | User selects a valid option. |
| `onFocus` | Cascader input receives browser focus. |
| `onBlur` | Cascader input loses browser focus. |

`onFocus` and `onBlur` should follow browser-native focus behavior. Opening or closing the dropdown should not fire focus or blur unless browser focus actually changes. Selecting an option should fire `onSelect`; it should fire `onBlur` only if selection causes browser focus to leave the Cascader input.

The Cascader should only support `onSelect`, `onFocus`, and `onBlur`. It should not add `onChange`, `onCheck`, or `onUnCheck`.

The PRD does not require custom event payloads. Builders should read selected state from exposed variables after the event fires, matching DropdownV2-style usage.

### Exposed Variables

The Cascader should expose:

| Variable | Description | Example |
| --- | --- | --- |
| `value` | Final selected node value. | `"beijing"` |
| `label` | Component label property. | `"Country"` |
| `selectedValue` | Selected option object. | `{ "label": "Beijing", "value": "beijing" }` |
| `pathArray` | Selected path values from root to selected node. | `["asia", "china", "beijing"]` |
| `pathLabels` | Selected path labels from root to selected node. | `["Asia", "China", "Beijing"]` |
| `pathString` | Display-ready selected path string joined with `pathSeparator`. | `"Asia/China/Beijing"` |
| `isLoading` | Current loading state. | `false` |
| `isOptionsLoading` | Current options loading state. | `false` |
| `isVisible` | Current visibility state. | `true` |
| `isDisabled` | Current disabled state. | `false` |
| `isValid` | Current validation status. | `true` |
| `isMandatory` | Whether mandatory validation is enabled. | `false` |
| `id` | Component id. | `"cascader1"` |

Tree Select checkbox variables should not be carried into Cascader:

- `checked`
- `expanded`
- `checkedPathArray`
- `checkedPathStrings`
- `leafPathArray`
- `leafPathStrings`

The Cascader should not expose the raw options tree as an exposed variable. The exposed state should stay focused on the selected value, selected path, validation, and component state.

`selectedValue` should contain only the selected option's `label` and `value`. It should not expose configuration fields such as `children`, `disable`, `visible`, or arbitrary custom metadata.

When there is no valid selection, the selected exposed variables should reset to:

```json
{
  "value": null,
  "selectedValue": null,
  "pathArray": [],
  "pathLabels": [],
  "pathString": ""
}
```

`pathArray` should contain option values. `pathLabels` should contain option labels. For a customer-facing hierarchy such as Server > Windows > Windows Server 2022, the exposed values should be:

```json
{
  "value": "windows-server-2022",
  "label": "Server type",
  "selectedValue": { "label": "Windows Server 2022", "value": "windows-server-2022" },
  "pathArray": ["server", "windows", "windows-server-2022"],
  "pathLabels": ["Server", "Windows", "Windows Server 2022"],
  "pathString": "Server/Windows/Windows Server 2022"
}
```

`pathString` should be computed from labels, not values. It should equal `pathLabels.join(pathSeparator)`.

### Component-Specific Actions

The Cascader should support:

| CSA | Behavior |
| --- | --- |
| `setValue(value)` | Selects the least-child option with the matching value, updates `value`, `selectedValue`, `pathArray`, `pathLabels`, and `pathString`, and fires `onSelect`. |
| `clearValue()` | Clears selection, sets `value` and `selectedValue` to `null`, resets selected path variables, and does not fire `onSelect`. |
| `setLoading(value)` | Updates loading state and `isLoading`. |
| `setOptionsLoading(value)` | Updates options loading state and `isOptionsLoading`. |
| `setVisibility(value)` | Updates visibility state and `isVisible`. |
| `setDisable(value)` | Updates disabled state and `isDisabled`. |

The Cascader should use `setValue(value)` and `clearValue()` as its selection component-specific actions. It should not expose a Dropdown-specific `selectOption` action.

`setValue(value)` should accept a scalar final option value only. It should not accept option objects or path arrays.

If `setValue(value)` receives a value that does not exist in the current option tree, or receives a parent value that is not selectable, the component should clear the current selection and recompute validation without firing `onSelect`. This keeps exposed variables aligned with the rendered option tree.

The Default value property should follow the same validity rules as `setValue(value)`: missing values and parent values should clear selection and recompute validation.

### Validation

The Cascader should support:

- Mandatory selection.
- Custom validation.
- Validation message display.
- `isValid` exposed variable updates.
- Validation on user selection and form submission, consistent with other ToolJet input components.

The Cascader should not support Tree Select's `minSelection` or `maxSelection` validation because Cascader is single-select. Mandatory validation covers required selection, and custom validation covers app-specific rules.

### Styling and Layout

The Cascader should follow ToolJet input component conventions for:

- Component label.
- Label position and width.
- Placeholder.
- Border and text color.
- Disabled state.
- Error state.
- Loading state.
- Visibility and collapse-when-hidden behavior.
- Desktop and mobile visibility.

The Cascader should not introduce dedicated style properties for selected path ancestor highlighting. It should use standard selected, hover, disabled, and focus styling consistent with ToolJet dropdown inputs.

## Implementation Decisions

- Cascader is a new component, not a mode inside Tree Select.
- Cascader widget metadata should use display name `Cascader`, description `Hierarchical single item selector`, and Dropdown-like default size `10 x 40`.
- Cascader should reuse Tree Select's hierarchical option schema.
- Cascader should follow Tree Select's `options`, `advanced`, and `data` option configuration pattern.
- Cascader should support nested JSON options only, not flat parent-key option mapping.
- Cascader should not reuse Tree Select's checkbox-specific exposed variables.
- Cascader validation should include `mandatory` and `customRule`, not `minSelection` or `maxSelection`.
- Cascader exposed state should represent one selected node and its path.
- `selectedValue` should contain only `{ label, value }`.
- Empty selection should expose `value: null`, `selectedValue: null`, empty path arrays, and empty `pathString`.
- `pathArray` should contain values, and `pathLabels` should contain labels.
- `pathString` should equal `pathLabels.join(pathSeparator)`.
- Cascader should not expose raw options data.
- Cascader should be single-select.
- Cascader should support a Default value property (`value`) that accepts a least-child option value.
- The Default value property should accept a scalar final option value only.
- Cascader should support a Placeholder property (`placeholder`) with default value `Select an option`.
- Disabled parent nodes should block navigation to descendants.
- Disabled leaf nodes should remain visible but unselectable.
- Hidden parent nodes should hide their descendants.
- Hidden or removed selected values should clear selection and recompute validation.
- Cascader should close the dropdown only after least-child selection.
- Cascader parent navigation should support configurable `triggerMode`, with `click` as the default and `hover` as an option.
- `triggerMode` should be implemented as a component property.
- Cascader should ship with a side-by-side columns layout.
- Cascader columns should scroll vertically when needed without adding a new max-height property.
- Cascader option rows should be single-line and truncate long labels.
- Cascader should separate shared state/path/event/validation/CSA logic from the columns layout renderer.
- Reopening the dropdown with an existing selection should show and highlight the selected path.
- Cascader should not add dedicated style controls for selected path ancestor highlighting.
- Cascader should support keyboard navigation for open, close, move, and select actions.
- Event semantics should be selection/input oriented: `onSelect`, `onFocus`, `onBlur`.
- Cascader should only support `onSelect`, `onFocus`, and `onBlur` events.
- `onFocus` and `onBlur` should follow browser-native focus behavior, not dropdown open/close state.
- Cascader should follow DropdownV2 event behavior: valid `setValue(value)` fires `onSelect`, `clearValue()` does not fire `onSelect`, and UI clear fires `onSelect`.
- Cascader should not expose a `selectOption` component-specific action.
- `setValue(value)` should accept a scalar final option value only.
- Cascader should support `showClearBtn`, defaulting to `true`.
- `showClearBtn` should live in Additional actions.
- Cascader should support `optionsLoadingState` for dropdown options loading, separate from `loadingState`.
- `optionsLoadingState` should work independently of `advanced`.
- `loadingState` should block dropdown opening and selection.
- `disabledState` should block dropdown opening, navigation, selection, and clear button interaction.
- Visibility changes should preserve selected state.
- Cascader should support `collapseWhenHidden`, defaulting to `false`.
- Cascader should avoid lazy loading and async child fetching.
- Cascader should not support dynamic height because it is an input-like component with dropdown content rendered outside the component layout.
- `pathSeparator` should control the separator used for the displayed selected path and `pathString`.
- `pathSeparator` should default to `/`.
- `pathSeparator` should be implemented as a component property.
- `pathSeparator` should accept any string, including an empty string.
- Invalid programmatic values, including parent node values, should clear selection rather than preserve stale exposed variables, and should not fire `onSelect`.

## Testing Decisions

Tests should verify external behavior rather than implementation details.

Recommended test coverage:

1. Renders Cascader with static hierarchical options.
2. Opens dropdown and navigates through parent nodes.
3. Selects a leaf node and updates exposed variables.
4. Fires `onSelect` on user selection.
5. Fires `onFocus` and `onBlur`.
6. Does not fire `onSelect` when navigating parent nodes.
7. Keeps dropdown open while navigating parent nodes.
8. Closes dropdown after selecting the least child node in a branch.
9. Supports click trigger mode for parent navigation.
10. Supports hover trigger mode for parent navigation.
11. Renders parent and child levels in side-by-side columns.
12. Supports keyboard open, close, navigation, and least-child selection.
13. Reopens with the selected path rendered and highlighted.
14. Shows `No options` when no visible options exist.
15. Supports disabled state.
16. Supports loading state.
17. Supports options loading state.
18. Supports hidden state.
19. Handles invalid or missing selected value safely.
20. Validates mandatory selection.
21. Supports `setValue(value)`.
22. Supports `clearValue()`.
23. Supports Default value property initialization.
24. Supports `setLoading(value)`, `setOptionsLoading(value)`, `setVisibility(value)`, and `setDisable(value)`.
25. Supports clear button behavior when `showClearBtn` is enabled.

Prior art should come from existing ToolJet component tests for Select, Multiselect, and Tree Select.

## Acceptance Criteria

1. A builder can add Cascader from the component list.
2. A builder can configure static or dynamic hierarchical options.
3. The Cascader renders as a dropdown input.
4. Parent nodes navigate to child levels without selecting.
5. Leaf node selection updates all selected exposed variables.
6. The dropdown remains open while users navigate parent nodes.
7. The dropdown closes after the user selects the least child node in a branch.
8. Parent node navigation follows the configured `triggerMode`.
9. Keyboard users can open, navigate, select least-child options, close, and tab away from the component.
10. Reopening the dropdown shows the selected path and selected option.
11. `onSelect` fires once per user selection.
12. `onFocus` and `onBlur` fire at the correct input lifecycle points.
13. Component-specific actions update exposed variables correctly.
14. Validation works in normal forms.
15. Existing Tree Select behavior remains unchanged.

## Success Metrics

- Builders can replace ad hoc chained dropdowns with one Cascader for common hierarchical selection cases.
- Support questions about hierarchical single-select decrease.
- Cascader behavior is predictable for users familiar with Select and Tree Select.
- No regressions in Tree Select exposed variables, events, or validation.

## Rollout Notes

The component should be introduced as a new component with its own documentation page. Documentation should explicitly compare it with Tree Select:

- Use Tree Select for checkbox-based hierarchy selection, parent-child checked states, and scenarios where users need to see or select multiple nodes in a tree.
- Use Cascader for compact single selection from hierarchical data where users navigate through parent levels and select only the least child option.

User-facing ToolJet documentation should not mention Retool, Ant Design, or Cascader Shadcn. Those references are for product and engineering alignment inside this PRD.
