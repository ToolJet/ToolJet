---
id: toggle-switch-legacy
title: Toggle Switch (Legacy)
---

The **Toggle Switch (Legacy)** component lets users turn an option on or off.

:::info
This is a legacy component. You'll find it in the **Legacy** section of the components panel. Check out the new version of the toggle switch component [here](/docs/widgets/toggle-switch-v2).
:::

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | The text shown next to the switch. | String (e.g., `Enable notifications`). Default: `Toggle label`. |
| Default status | Whether the switch is on when the app loads. | Use the toggle or click **fx** and enter `{{true}}` or `{{false}}`. Default: `{{false}}`. |

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On change | Triggers when the user turns the switch on or off. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :---------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| value | `true` when the switch is on, otherwise `false`. | Accessible dynamically with JS (for e.g., `{{components.toggleswitchlegacy1.value}}`). |

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value as **Plain text**, **Markdown**, or **HTML** by selecting the desired format from the toggle above the field. Now hovering over the component will display the tooltip.

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
| :------------------------------------------ | :------------------------------------------------ | :-------------------------------------------------- |
| Text color | The color of the label. | The theme's primary text color. |
| Toggle switch color | The color of the switch when it's on. | The theme's brand color. |
| Visibility | Shows or hides the component. Accepts `{{true}}` or `{{false}}`. | `{{true}}` |
| Disable | If set to `{{true}}`, users can't change the switch. | `{{false}}` |

### General

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
| :------------------------------------------ | :------------------------------------------------ | :-------------------------------------------------- |
| Box shadow | Sets the box shadow of the component. | No shadow |

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
