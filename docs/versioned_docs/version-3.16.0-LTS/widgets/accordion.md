---
id: accordion
title: Accordion
---

The **Accordion** component is a collapsible container that lets you group and organize components under an expandable/collapsible section with a header. It helps reduce visual clutter by allowing users to show or hide content on demand, making it ideal for building structured layouts, settings panels, and multi-section forms.

## Example Usage

A customer support team needs to build a ticket details page where different sections, customer info, order history, internal notes are displayed. Using the Accordion component, each section can be placed inside its own collapsible panel, allowing agents to expand only the section they need, keeping the interface clean and focused.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show header | Toggles the visibility of the accordion header section, which includes the title area and the expand/collapse chevron. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Events

| Event       | Description                                           |
| :---------- | :---------------------------------------------------- |
| On expand   | Triggers when the accordion is expanded.              |
| On collapse | Triggers when the accordion is collapsed.             |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA). You can trigger these using an event or through a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :------------ | :---------- | :------------ |
| expand        | Expands the accordion to reveal its content.       | `components.accordion1.expand()`          |
| collapse      | Collapses the accordion to hide its content.       | `components.accordion1.collapse()`        |
| setVisibility | Sets the visibility of the component.              | `components.accordion1.setVisibility(false)` |
| setDisable    | Disables the component.                            | `components.accordion1.setDisable(true)`  |
| setLoading    | Sets the loading state of the component.           | `components.accordion1.setLoading(true)`  |

## Exposed Variables

| Variable   | <div style={{ width:"250px"}}> Description </div>           | How To Access                              |
| :--------- | :----------------------------------------------------------- | :----------------------------------------- |
| isExpanded | Indicates if the accordion is currently expanded.            | `{{components.accordion1.isExpanded}}`     |
| isVisible  | Indicates if the component is visible.                       | `{{components.accordion1.isVisible}}`      |
| isDisabled | Indicates if the component is disabled.                      | `{{components.accordion1.isDisabled}}`     |
| isLoading  | Indicates if the component is loading.                       | `{{components.accordion1.isLoading}}`      |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Click to expand details.`). |
| Dynamic height | Allows the accordion to automatically adjust its height based on the content inside. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Header

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Sets the background color of the accordion header. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Chevron icon | Sets the color of the expand/collapse chevron icon in the header. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Divider | Sets the color of the divider line between the header and the content area. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Sets the background color of the accordion content area. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border color | Sets the border color of the accordion. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Modifies the border radius of the accordion. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the accordion. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
