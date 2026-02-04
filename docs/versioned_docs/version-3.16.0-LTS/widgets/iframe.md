---
id: iframe
title: Iframe
---

The **Iframe** component allows you to embed external content from other websites or applications directly within your ToolJet application.

## Example Usage

A logistics company needs to display real-time shipment tracking from their third-party carrier's tracking portal. Using the Iframe component, they embed the carrier's tracking page directly into their internal operations dashboard, allowing warehouse staff to monitor shipments without switching between applications.

## Properties

| Property | Description | Expected Value |
|:---------|:------------|:---------------|
| URL | The URL of the external content to be embedded in the iframe. | String (e.g., `https://tooljet.io/`). |

## Events

The **Iframe** component does not support any events.

## Component Specific Actions (CSA)

The following actions of the component can be controlled using component-specific actions (CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setURL | Sets the URL of the iframe to display different content dynamically. | `components.iframe1.setURL('https://example.com')` |
| setVisibility | Sets the visibility of the component. | `components.iframe1.setVisibility(true)` |
| setDisable | Disables or enables the component. | `components.iframe1.setDisable(false)` |
| setLoading | Sets the loading state of the component. | `components.iframe1.setLoading(true)` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:--------|:-----------|:------------|
| url | Holds the URL currently loaded in the iframe. | `{{components.iframe1.url}}` |
| isVisible | Indicates whether the component is visible. | `{{components.iframe1.isVisible}}` |
| isDisabled | Indicates whether the component is disabled. | `{{components.iframe1.isDisabled}}` |
| isLoading | Indicates whether the component is in a loading state. | `{{components.iframe1.isLoading}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. | String (e.g., `View external content here.`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Box Shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
