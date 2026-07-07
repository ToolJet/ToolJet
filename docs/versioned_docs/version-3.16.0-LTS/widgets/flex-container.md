---
id: flex-container
title: Flex Container
---

The **Flex Container** is a layout component that arranges the components placed inside it using CSS flexbox instead of ToolJet's fixed grid. Components can be laid out in a row or a column, with control over spacing, wrapping, and alignment, and they automatically reflow when components are added, removed, resized, or reordered.

## Layout

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--------------------------------------------- | :-------------------------------------------------- | :---------------------------------------------------- |
| Direction | Sets the main axis of the flex layout. `row` arranges the children left to right, `column` arranges them top to bottom. | Click on `row` or `column`. Default: `row`. |
| Justify | Aligns the children along the **main axis** (the axis set by Direction). | Click on `flex-start`, `center`, or `flex-end`. Default: `flex-start`. |
| Align | Aligns the children along the **cross axis** (perpendicular to Direction). | Click on `flex-start`, `center`, or `flex-end`. Default: `flex-start`. |
| Gap (px) | Sets the spacing between the child components. | Enter a number or click on **fx** and input a number programmatically using code. Default: `12`. |
| Padding (px) | Sets the inner spacing between the container's edges and its children. | Enter a number or click on **fx** and input a number programmatically using code. Default: `12`. |
| Allow wrapping | When enabled, children that don't fit along the main axis wrap onto a new line instead of overflowing. When disabled, the container scrolls along the main axis. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. Default: `{{true}}`. |
| Stack below | Forces the layout to switch to a `column` direction (with wrapping disabled) once the app's canvas width drops to or below the selected breakpoint, so the children stack vertically on smaller screens. | Select `No stacking`, `Mobile (375px)`, `Tablet (768px)`, or `Desktop (1440px)`. Default: `No stacking`. |

:::info
**Stack below** compares against the width of the app's main canvas, not the width of the Flex Container itself. For a Flex Container nested inside another container, the same main canvas width is used to decide when to stack.
:::

### Child width

When a component placed inside a Flex Container is selected, a **Width** option is shown in its Properties Panel, above the **Additional Actions** section:

| <div style={{ width:"100px"}}> Option </div> | <div style={{ width:"200px"}}> Description </div> |
| :--------------------------------------------- | :-------------------------------------------------- |
| Fill parent | The component's width stretches to fill the space available to it inside the Flex Container. This is the default. |
| Fixed | The component is given a fixed width, in pixels, that does not change as the Flex Container is resized. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setVisibility()| Sets the visibility of the component.     | `components.flexcontainer1.setVisibility(false)` |
| setLoading()   | Sets the loading state of the component.  | `components.flexcontainer1.setLoading(true)` |
| setDisable()   | Disables the component.                   | `components.flexcontainer1.setDisable(true)` |

## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|
| isLoading | Indicates if the component is loading. | `{{components.flexcontainer1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.flexcontainer1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.flexcontainer1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with the isLoading property to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Dynamic height | Automatically adjusts the container's height based on its content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden | When enabled and the component is hidden, it no longer takes up space among its siblings, so the surrounding components (and the parent's dynamic height) reflow to fill the gap. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip  | Provides additional information on hover. Set a display string.  | String |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background | Sets the background color of the container.   | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border color | Sets the color of the border. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Sets the radius of the component. | Enter a number (default: `6`) or click on **fx** and input a number programmatically. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names, or click on **fx** to set the value programmatically. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::