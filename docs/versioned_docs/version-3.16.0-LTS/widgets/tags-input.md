---
id: tags-input
title: Tags Input
---

The **Tags Input** component allows users to create, select, and delete tags from a dropdown list. It supports both predefined options and user-created custom tags.

## Properties

### Data

| Property | Description | Expected Value |
|:---------|:------------|:---------------|
| Label | The label text displayed for the field. | String (e.g., `Tags`, `Categories`) |
| Placeholder | Placeholder text shown when no tags are selected. | String (e.g., `Add or select a tag`) |

### Tags

| <div style={{ width:"130px"}}> Property </div> | Description | Expected Value |
|:---------|:------------|:---------------|
| Dynamic tags | Toggle to switch between static and dynamic options mode. When enabled, options are defined via a schema. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Default value | Pre-selected tag values when component loads. Only visible when Dynamic tags is OFF. | Comma-separated values or array |
| Schema | JSON array defining tag options. Only visible when Dynamic tags is ON. | Array of objects with `label`, `value`, `visible`, `default`, and `disable` properties |
| Sort tags | Sort order for tags in the dropdown. | `none`, `asc` (A-Z), or `desc` (Z-A) |
| Allow new tags | When enabled, users can create new tags by typing values not in the predefined list. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tags loading state | When enabled, shows a loading indicator while options are being loaded. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Turn on search | When enabled, users can search/filter tags in the dropdown. When disabled, the dropdown menu does not appear and the component acts as a simple input field. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

### Dynamic Tags

When Dynamic tags is enabled, use this schema format:

```js
{{[
  { label: 'Newport', value: 'newport', visible: true, default: false, disable: false },
  { label: 'New York', value: 'new_york', visible: true, default: false, disable: false },
  { label: 'San Clemente', value: 'san_clemente', visible: true, default: true, disable: false }
]}}
```

| Schema Property | Description |
|:----------------|:------------|
| label | Display text shown in the dropdown |
| value | Internal value stored when selected |
| visible | Whether the option is shown in the dropdown |
| default | Whether the option is pre-selected |
| disable | Whether the option is disabled (not selectable) |

## Events

| Event | Description |
|:------|:------------|
| On tag added | Triggered when a tag is selected or a new tag is created. |
| On tag deleted | Triggered when a tag is removed from the selection. |
| On focus | Triggered when the input field receives focus. |
| On blur | Triggered when the input field loses focus. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:-------|:------------|:-----------|
| Select Tags | Programmatically selects specified tags. Matches by **value** or **label**. | `components.tagsinput1.selectTags` |
| Deselect Tags | Programmatically removes specified tags from selection. Matches by **value** or **label**. | `components.tagsinput1.deselectTags` |
| Clear | Clears all selected tags. | `components.tagsinput1.clear` |
| Set visibility | Shows or hides the component. | `components.tagsinput1.setVisibility` |
| Set loading | Sets the loading state of the component. | `components.tagsinput1.setLoading` |
| Set disable | Enables or disables the component. | `components.tagsinput1.setDisable` |

### Select Tags / Deselect Tags Input Formats

Both `selectTags` and `deselectTags` support multiple input formats:

| <div style={{ width:"200px"}}> Format </div> | Example | Description |
|:-------|:--------|:------------|
| Array of values | `['newport', 'new_york']` | Matches tags by their `value` property |
| Array of labels | `['Newport', 'New York']` | Matches tags by their `label` property |
| Array of objects with value | `[{value: 'newport'}]` | Explicitly match by value |
| Array of objects with label | `[{label: 'Newport'}]` | Explicitly match by label |
| Mixed formats | `['newport', {label: 'New York'}]` | Combine different formats |

:::info Matching Priority
When a string is passed, the component first tries to match by `value`. If no match is found, it tries to match by `label`.
:::

### Example Usage

```js
// Select by values
components.tagsInput1.selectTags(['newport', 'new_york'])

// Select by labels
components.tagsInput1.selectTags(['Newport', 'New York'])

// Select using objects
components.tagsInput1.selectTags([
  { value: 'newport' },
  { label: 'New York' }
])

// Deselect by label
components.tagsInput1.deselectTags(['Newport'])

// Deselect using mixed format
components.tagsInput1.deselectTags(['newport', { label: 'New York' }])

// Clear all selections
components.tagsInput1.clear()

// Hide the component
components.tagsInput1.setVisibility(false)
```

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:---------|:-----|:------------|
| values | Returns the array of values of selected tags. | `components.tagsinput1.values` |
| tags | Returns the array of all the available tags. | `components.tagsinput1.tags` |
| newTagsAdded | Returns the array of all the newly added tags. | `components.tagsinput1.newTagsAdded` |
| selectedTags | Returns the array of label and values of all the selected tags. | `components.tagsinput1.selectedTags` |
| label | The label text displayed for the field. | `components.tagsinput1.label` |
| isVisible | Returns the visibility state of the component. | `components.tagsinput1.isVisible` |
| isLoading | Returns the loading state of the component. | `components.tagsinput1.isLoading` |
| isDisabled | Returns the disabled state of the component. | `components.tagsinput1.isDisabled` |
| isMandatory | Returns whether the field is mandatory. | `components.tagsinput1.isMandatory` |
| isValid | Returns whether the current selection passes validation. | `components.tagsinput1.isValid` |

### Example Usage

```js
// Get all selected values
{{components.tagsInput1.values}}
// Returns: ['newport', 'new_york']

// Get selected tags with labels
{{components.tagsInput1.selectedTags}}
// Returns: [{ label: 'Newport', value: 'newport' }, { label: 'New York', value: 'new_york' }]

// Get only user-created tags
{{components.tagsInput1.newTagsAdded}}
// Returns: ['custom_tag_1', 'custom_tag_2']

// Check if component is valid
{{components.tagsInput1.isValid}}
// Returns: true or false
```

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory | When enabled, the form cannot be submitted without at least one tag selected. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Custom validation | Custom validation rule using JavaScript expression. | JavaScript expression that returns a validation message or empty string |

### Custom Validation Example

```js
{{components.tagsInput1.values.length >= 2 ? '' : 'Select at least 2 tags'}}
```
This validates that at least 2 tags are selected and shows an error message if not.

## Additional Actions

| <div style={{ width:"120px"}}> Property </div> | Description | Configuration Options |
|:---------|:------------|:---------------|
| Dynamic height | When enabled, the component height adjusts based on the number of selected tags. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state | Shows a loading overlay on the entire component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls whether the component is visible. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | When enabled, the component becomes non-interactive. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Text displayed when hovering over the component. | String |

## Devices

| <div style={{ width:"130px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------|:------------|:--------|
| Color | Label text color. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Alignment | Label position relative to the field. | `Side` (left of field) or `Top` (above field). |
| Direction | Label alignment when using Side layout. | `Left` or `Right`. |
| Width | When Alignment is Side and Auto width is disabled, sets the label width. | Enter the value or use the slider. |
| Width type | Determines how label width is calculated. | `Of component` (percentage of total component width) or `Of field` (percentage of field width). |

### Field

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------|:------------|:--------|
| Background | Background color of the input field. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border | Border color of the input field. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Accent | Color used for focus state and highlights. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Auto pick chip color | When enabled, the component automatically assigns colors to chips from a predefined palette. | Enable/disable the checkbox. |
| Chip color | Background color of selected tag chips. Only visible when Auto pick chip color is OFF. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text color | Text color inside selected tags. Only visible when Auto pick chip color is OFF. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Error text | Color for validation error messages. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Corner radius of the input field. | Enter the value in pixels. |
| Box shadow | Shadow effect around the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------|:------------|:--------|
| Padding | Padding around the component. | `Default` or `None`. |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
