---
id: link
title: Link
---

The **Link** component allows you to add a hyperlink and navigate to the external URL.

## Properties

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Link target | This property sets the URL where the user needs to be taken on clicking the link. | example: `https://dev.to/tooljet` or `{{queries.xyz.data.url}}`. |
| Link text | This property sets the text for the Link component. | example: **Click here** or **Open webpage**. |
| Target type | This property specifies the link to be opened in the same tab or new tab on clicking the link. | Options: **New Tab** & **Same Tab**. |

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On click                                    | Triggered when the link is clicked.               |
| On hover                                    | Triggered when the cursor hovers over the link.   |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the link component can be controlled using the component-specific actions(CSA):

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| click                                         | Triggers click action of the link component.      | Employ a RunJS query to execute component-specific actions such as `await components.link1.click()` or trigger it using an event. |
| setLinkTarget | Sets the URL the link opens. | `await components.link1.setLinkTarget('https://tooljet.com')` |
| setLinkText | Sets the text of the link. Only text values are applied. | `await components.link1.setLinkText('Open docs')` |
| setVisibility | Sets the visibility of the component. | `await components.link1.setVisibility(false)` |
| setDisable | Disables the component. | `await components.link1.setDisable(true)` |
| setLoading | Sets the loading state of the component. | `await components.link1.setLoading(true)` |

If the **Link target** or **Link text** property changes later, it replaces the value set with `setLinkTarget` or `setLinkText`.

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| linkTarget | Holds the current URL of the link. | `{{components.link1.linkTarget}}` |
| linkText | Holds the current text of the link. | `{{components.link1.linkText}}` |
| isVisible | Indicates if the component is visible. | `{{components.link1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.link1.isDisabled}}` |
| isLoading | Indicates if the component is loading. | `{{components.link1.isLoading}}` |

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the **General** accordion, you can set the value as **Plain text**, **Markdown**, or **HTML** by selecting the desired format from the toggle above the field. Now hovering over the component will display the tooltip.

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop                                | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                 | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Link Text

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| Text color | Sets the color of the link text. The hover color is derived from it. Select a color or enter a Hex color code. |
| Text size | Sets the size of the link text. Defaults to `14`. |
| Alignment | Sets the horizontal alignment of the link: **Left** (default), **Center** or **Right**. Use the icons next to it to set the vertical alignment: top, center (default) or bottom. |
| Icon | Shows an icon before the link text. Select the icon and use the eye toggle to show or hide it. The icon is hidden by default. |
| Underline | Sets when the text is underlined: **Never**, **On Hover** (default) or **Always**. |
| Box shadow | Sets the box shadow properties of the component. |

### Container

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| Padding | Sets the padding around the component: **Default** or **None**. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::