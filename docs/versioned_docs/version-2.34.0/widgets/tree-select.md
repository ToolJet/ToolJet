---
id: tree-select
title: Tree Select
---

# Tree Select

Tree Select widget is a group checkboxes in a TreeView which can be expanded or collapsed.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

### Title

The text is to be used as the title for the tree select. This field expects a `String` input.

### Structure

**Data requirements:** The structure needs to be an array of objects and each object should have `label` and `value` keys. If you wish to have `children` under any of the checkbox, then `children` array needs to be passed with `label` and `value` keys.

**Example:**

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
          { "label": "Beijing", "value": "beijing" },
          { "label": "Shanghai", "value": "shanghai" }
        ]
      },
      { "label": "Japan", "value": "japan" },
      {
        "label": "India",
        "value": "india",
        "children": [
          { "label": "Delhi", "value": "delhi" },
          { "label": "Mumbai", "value": "mumbai" },
          { "label": "Bengaluru", "value": "bengaluru" }
        ]
      }
    ]
  },
  {
    "label": "Europe",
    "value": "europe",
    "children": [
      { "label": "France", "value": "france" },
      { "label": "Spain", "value": "spain" },
      { "label": "England", "value": "england" }
    ]
  },
  { "label": "Africa", "value": "africa" }
]
```

:::info
Note: The `value` should be unique throughout the structure array.
:::

### Checked values

Checked values is an array of values passed to select the checkboxes by default.

**Example:**

```json
["asia", "spain"]
```

### Expanded values

Similar to checked values, expanded values is an array of values passed to expand the node by default.

**Example:**

```json
["asia"]
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

| <div style={{ width:"100px"}}> Event </div>     | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- | 
| On change | On check event is triggered whenever the checkbox value is changed (checked or unchecked). |
| On check | On check event is triggered whenever the checkbox value is checked. |
| On uncheck | On uncheck event is triggered whenever the checkbox value is unchecked. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div>|
|:----------- |:----------- |:-------|
| checked | This variable holds the value of all the checked items on the tree select component. | Access the value dynamically using JS: `{{components.treeselect1.checked[1]}}`|
| expanded | This variable holds the value of expanded items on the tree select component.|  Access the value dynamically using JS: `{{components.treeselect1.expanded[0]}}`|
| checkedPathArray | This variable holds the path of the checked items in differet arrays. | Access the value dynamically using JS: `{{components.treeselect1.checkedPathArray[1][1]}}`|
| checkedPathStrings | This variable holds the path of the checked items in strings separated by a dash(-).| Access the value dynamically using JS: `{{components.treeselect1.checkedPathStrings[2]}}`|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

|  <div style={{ width:"100px"}}> Layout </div> |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"135px"}}> Expected Value </div>|
|:----- |:---------  |:------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

|  <div style={{ width:"100px"}}> Style </div> |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"100px"}}> Default Value </div>|
|:----- |:---------  |:------------- |
| Text color | Change the color of the text in the widget by providig the `Hex color code` or choosing a color from the picker. |  |
| Checkbox color | Change the color of the toggle switch in the widget by providig the `Hex color code` or choosing a color from the picker. |  |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`. |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>