---
id: html
title: HTML Viewer
---

The **HTML Viewer** component allows you to render custom HTML and CSS layouts within your ToolJet application. Use it to display rich formatted content, embed custom designs, or create visually distinct sections that go beyond standard components.

## Example Usage

A logistics company needs to display shipment tracking details with branded styling. The HTML Viewer renders a custom tracking card with the company's colors and layout that updates dynamically based on shipment data from the database.

## Properties

| <div style={{ width:"100px"}}> Property </div> | Description | Expected Value |
|:---------|:------------|:---------------|
| Raw HTML | The HTML content to render. Inline CSS can be added to HTML tags for styling. Content is sanitized using DOMPurify for security. | HTML string (e.g., `<div style="color: blue;">Hello</div>`) |

**Example:**

```html
<body>
   <main>
       <section class="hero" style="height:306px;display:flex;justify-content: center;padding:0 1px;align-items: center;text-align:center">
           You can build your custom HTML-CSS template here
       </section>
   </main>
</body>
```

:::info
Links in the HTML content automatically open in a new tab with `target="_blank"` and `rel="noopener"` for security.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA):

| <div style={{ width:"120px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setRawHTML( ) | Sets the Raw HTML content of the component. | `components.html1.setRawHTML('<h1>New Content</h1>')` |
| setVisibility( ) | Sets the visibility of the component. | `components.html1.setVisibility(false)` |
| setLoading( ) | Sets the loading state of the component. | `components.html1.setLoading(true)` |
| setDisable( ) | Disables or enables the component. | `components.html1.setDisable(true)` |

## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|
| rawHTML | The current HTML content of the component. | `{{components.html1.rawHTML}}` |
| isLoading | Indicates if the component is in loading state. | `{{components.html1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.html1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.html1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. When disabled, the component appears faded and does not respond to interactions. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
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
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

:::info
Any property having an **fx** button next to its field can be **programmatically configured**.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)