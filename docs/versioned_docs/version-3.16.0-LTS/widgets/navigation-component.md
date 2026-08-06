---
id: navigation
title: Navigation
---

The **Navigation** component lets you build custom navigation menus with horizontal or vertical orientation. Menu items can be organized into groups and configured with icons, labels, and visibility rules. It fits well for scenarios like a top navigation bar across pages of an internal tool, a sidebar for an admin dashboard, or a bottom navigation menu in a mobile app.

## Content

The **Content** section lists the navigation entries displayed in the component.

### Adding Items and Groups

Click **+ New menu item** to open a dropdown with two options: **Add new menu item** to add a standalone entry, or **Add new group** to add a group that can hold child items. Items and groups can be reordered by dragging.

### Item Properties

Click any item or group to open its settings:

| Property | Description | Expected Value |
| :------- | :---------- | :------------- |
| Label | Text displayed for the menu item. | String (e.g., `Dashboard`). Supports `{{` expressions. |
| Icon | Icon shown alongside the label. | Icon name (e.g., `IconArchive`). Toggle icon visibility with the eye icon. |
| Hide this item | Hides the item from the rendered navigation. | Enable/disable the toggle or click **fx** to enter a logical expression. |
| Disable item | Prevents interaction with the item. | Enable/disable the toggle or click **fx** to enter a logical expression. |

Groups share the same properties and additionally hold child items that can be added from inside the group's settings.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Orientation | Sets the layout direction of the menu. | `Horizontal` or `Vertical`. |
| Style | Controls what each nav item displays. | `Text and icon`, `Text only`, or `Icon only`. |
| Nav item size | Determines how items fill the available width. | `Auto` sizes items to their content; `Equal width` distributes space evenly. |
| Alignment | Horizontal alignment of items within the navigation. | `Left`, `Center`, or `Right`. |

## Events

| Event | Description |
| :---- | :---------- |
| On click | Triggers whenever the user clicks a navigation item. |

:::info
Check the [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the Navigation component can be controlled using component-specific actions (CSA). You can trigger them using an event or a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> How To Access </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setVisibility() | Sets the visibility of the component. | `components.navigation1.setVisibility(false)` |
| setDisable() | Enables or disables the component. | `components.navigation1.setDisable(true)` |
| setLoading() | Sets the loading state of the component. | `components.navigation1.setLoading(true)` |
| selectItem() | Programmatically selects a menu item by its ID. | `components.navigation1.selectItem('item1')` |

## Exposed Variables

| <div style={{ width:"130px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | How To Access |
| :--------------------------------------------- | :------------------------------------------------ | :------------ |
| selectedItem | The currently selected navigation item object. | `{{components.navigation1.selectedItem}}` |
| previousSelectedItem | The previously selected navigation item object. | `{{components.navigation1.previousSelectedItem}}` |
| isVisible | Indicates if the component is visible. | `{{components.navigation1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.navigation1.isDisabled}}` |
| isLoading | Indicates if the component is in a loading state. | `{{components.navigation1.isLoading}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner on the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |


## Styles

### Nav menu item

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Color of the label for unselected items. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Icon | Color of the icon for unselected items. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Hover pill background | Background color of the pill when an item is hovered. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Selected text | Color of the label for the active/selected item. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Selected icon | Color of the icon for the active/selected item. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Selected pill background | Background color of the pill for the active/selected item. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Pill border radius | Corner radius of the selection pill. | Enter a number (default: `6`) or click on **fx** and enter a code that programmatically returns a numeric value. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Background color of the navigation container. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border | Border color of the navigation container. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Corner radius of the navigation container. | Enter a number (default: `8`) or click on **fx** and enter a code that programmatically returns a numeric value. |
| Padding | Inner padding of the navigation container. | Enter a number (default: `8`) or click on **fx** and enter a code that programmatically returns a numeric value. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::
