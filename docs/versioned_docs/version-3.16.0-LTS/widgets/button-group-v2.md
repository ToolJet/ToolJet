---
id: button-group-v2
title: Button Group
---

The Button Group component lets you display a set of buttons that users can select from. It supports single or multiple selection, optional icons, dynamic data mapping, and flexible layouts — making it useful for filter bars, mode switchers, and action toolbars.

## Example Usage

A logistics team builds an internal operations dashboard where dispatchers need to quickly filter shipments by status — **Pending**, **In Transit**, and **Delivered**. They add a Button Group with those three options. When a dispatcher clicks a status button, the selected value drives a query that filters the shipments table. With multi-selection enabled, dispatchers can compare multiple statuses at once without needing a separate dropdown or checkbox group.

## Properties

|  <div style={{ width:"150px"}}> Property </div>  | <div style={{ width:"300px"}}> Description </div> | Expected Value |
|:---------|:-----------|:--------------|
| Button group label | Text label shown alongside the button group. | String (e.g., `Status`) |
| Mapped button | Toggle to enable dynamic button generation from a schema. When enabled, a **Schema** field appears. | Boolean: `{{true}}` or `{{false}}` |
| Schema | Array of button objects used when **Mapped button** is on. | Array (e.g., `{{[{"label":"Button1","value":"1","icon":"IconBolt","iconVisibility":false,"disable":false,"default":true}]}}`) |
| Enable multiple selection | Allows more than one button to be selected at a time. | Boolean: `{{true}}` or `{{false}}` |
| Layout | Controls how buttons are arranged. | `row`, `column`, or `wrap` |

## Events

| Event | Description |
|-------|-------------|
| On click | Triggered when a button in the group is clicked. |

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA). You can trigger these using an event or through a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| Select option | Selects a button by value. | `components.buttongroup1.setSelected(value)` |
| Clear selected options | Clears all current selections. | `components.buttongroup1.clear()` |
| Set disable | Enables or disables the component. | `components.buttongroup1.setDisable(true)` |
| Set loading | Shows or hides the loading state. | `components.buttongroup1.setLoading(true)` |
| Set visibility | Shows or hides the component. | `components.buttongroup1.setVisibility(true)` |

## Exposed Variables

| Variable | Description | How To Access |
|:---------|:-----------|:-------------|
| selected | Array of values for the currently selected button(s). Default is `[1]`. | `{{components.buttongroup1.selected}}` |
| isVisible | Whether the component is visible. | `{{components.buttongroup1.isVisible}}` |
| isDisabled | Whether the component is disabled. | `{{components.buttongroup1.isDisabled}}` |
| isLoading | Whether the component is in loading state. | `{{components.buttongroup1.isLoading}}` |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:----------------|:------------------------------------------------|:---------------------------|
| Make this field mandatory | Marks the field as required. Shows an error if no button is selected on form submission. | Toggle: `{{true}}` or `{{false}}` |
| Custom validation | Custom rule that returns an error message string when validation fails, or `true` when valid. | Expression (e.g., `{{components.buttongroup1.selected.length > 0 && 'Please select an option'}}`) |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. | String (e.g., `Select a status`). |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Color | Text color of the label. | Color picker or hex value. |
| Alignment | Position of the label relative to the buttons. | `Side` (default) or `Top` |
| Direction | Side alignment direction, left or right of the buttons. Visible when alignment is set to **Side**. | Left or Right icon toggle |
| Width | Auto or manual label width. Visible when alignment is **Side**. | Checkbox — auto (default) or manual slider |
| Label width | Manual width of the label as a percentage. Visible when **Width** is set to manual. | Slider (0–100) |
| Width type | Whether the label width is measured relative to the component or the field. Visible when **Width** is set to manual. | `Of the Component` (default) or `Of the Field` |

### Buttons

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Background | Background color of unselected buttons. | Color picker or hex value. |
| Hover background | Background color on hover. | `Auto` (default) or `Manual` — when Manual, a color picker appears. |
| Border | Border color of the buttons. | Color picker or hex value. |
| Text | Text color of button labels. | Color picker or hex value. |
| Font size | Font size of button text in pixels. | Number. Default: `14` |
| Font weight | Weight of button label text. | `normal` (default), `medium`, `bold`, `lighter`, or `bolder` |
| Icon | Color of button icons. | Color picker or hex value. |
| Selected background | Background color of the selected button. | Color picker or hex value. |
| Selected text | Text color of the selected button. | Color picker or hex value. |
| Selected icon | Icon color of the selected button. | Color picker or hex value. |
| Error text | Color of the validation error message. | Color picker or hex value. |
| Border radius | Corner rounding of buttons in pixels. | Number. Default: `6` |
| Alignment | Horizontal alignment of buttons within the group. | Left (default), center, or right |
| Box Shadow | Shadow applied to the button group container. | Box shadow value. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Padding | Inner padding of the button group container. | `Default` or `None` |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
