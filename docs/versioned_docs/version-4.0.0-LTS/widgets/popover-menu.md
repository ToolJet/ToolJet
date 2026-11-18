---
id: popover-menu
title: Popover Menu
---

The **Popover Menu** is a UI component that lets you show a contextual menu or extra options when a user clicks or hovers on the button. Unlike a regular menu, the popover menu appears as a floating panel that’s anchored to the trigger element.

**Why use it?**
- To provide a compact set of actions tied to a button, icon, or card.
- To display contextual options related to a selected record, row, or item.
- Improves user experience with a lightweight, floating menu instead of cluttered buttons.

## Menu

| Property         | Value               | Description                                                                             |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------- |
| **Button label** | String              | The text displayed on the menu trigger button.                                          |
| **Button type**  | Primary / Outline   | Defines the visual style of the trigger button.                                         |
| **Show menu**    | On hover / On click | Controls how the menu opens. |

## Options

Allows you to add options to the **Popover Menu** component field. You can click on **+ Add new option** and add options manually or enable **Dynamic options** and enter the options using code.

### Example Code for Dynamic Options
```js
    {{
        [
            {
                "label":"option1",
                "description":"",
                "value":"1",
                "icon":"IconBolt",
                "iconVisibility":true,
                "disable":false,
                "visible":true
            },
            {
                "label":"option2",
                "description":"",
                "value":"2",
                "icon":"IconBulb",
                "iconVisibility":false,
                "disable":true,
                "visible":true
            },
            {
                "label":"option3",
                "description":"This is an option",
                "value":"3",
                "icon":"IconTag",
                "iconVisibility":false,
                "disable":false,
                "visible":true
            }
        ]
    }}
```

**Options loading state** allows you to add a loading state to the dynamically generated options. You can enable or disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.


## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div>          |
| :------------------------------------------ | :--------------------------------------------------------- |
| On select                                   | Triggers whenever an option is selected.                   |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> **Action** </div> | **Description** | **RunJS Query** |
|:-----------|:----------------|:----------------|
| setVisibility( ) | Sets the visibility of the component. | `components.popovermenu1.setVisibility(true)` |
| setLoading( ) | Sets the loading state of the component. | `components.popovermenu1.setLoading(true)` |
| setDisable( ) | Disables the component. | `components.popovermenu1.setDisable(true)` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| label | Holds the label name of the component. | `{{components.popovermenu1.label}}` |
| options | Holds all the options of the component in array form. Each entry has `label`, `description` and `value`. | `{{components.popovermenu1.options}}` |
| lastClickedOption | Holds the `label`, `description` and `value` of the last clicked option. `null` until an option is clicked. | `{{components.popovermenu1.lastClickedOption}}` |
| isLoading | Indicates if the component is loading. | `{{components.popovermenu1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.popovermenu1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.popovermenu1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :-------------------------------------------------| :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String (e.g., `Select an option.` ). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Menu

| **Property** | **Description** | **Configuration Options** |
| ------------ | --------------- | ------------------------- |
| **Background** | Sets the background color of the trigger button. Available only when **Button type** is **Primary**. | Color picker / HEX / RGBA / Custom Themes |
| **Hover background** | Sets the background color of the trigger button on hover. Available only when **Button type** is **Primary**. | **Auto** (default, derived from Background) or **Manual** (shows a color picker). |
| **Text** | Sets the color of the button label. | Color picker / HEX / RGBA / Custom Themes |
| **Font size** | Sets the font size of the button label. | Number in px (default `14`). |
| **Font weight** | Sets the font weight of the button label. | Select `normal` (default), `medium`, `bold`, `lighter` or `bolder`. |
| **Border** | Sets the border color of the trigger button. | Color picker / HEX / RGBA / Custom Themes |
| **Loader** | Sets the color of the loading spinner on the button. | Color picker / HEX / RGBA / Custom Themes |
| **Content alignment** | Sets the horizontal alignment of the button's label and icon. | Select `Left`, `Center` (default) or `Right`. |
| **Icon** | Selects an icon for the trigger button. | Select icon, enable/disable icon visibility. Default `IconMenu2`. |
| **Icon color** | Sets the color of the button icon. Use the alignment icons next to it to place the icon to the left (default) or right of the label. | Color picker / HEX / RGBA / Custom Themes; Left / Right position |
| **Border radius** | Rounds the corners of the trigger button. | Number in px (default `6`). |
| **Box shadow** | Adds a shadow to the trigger button. Available only when **Button type** is **Primary**. | X/Y offset, blur, spread and color. |
| **Menu width** | Controls the width of the popover menu. | Choose **Match the field** (default), **Match the content** or **Custom**. With **Custom**, enter a width in **Custom menu width**; numbers are treated as px. |

### Options

| **Property**    | **Description**                                  | **Configuration Options**                 |
| --------------- | ------------------------------------------------ | ----------------------------------------- |
| **Label**       | Sets the color for the display text for the menu option.            | Color picker / HEX / RGBA / Custom Themes |
| **Icon color**  | Sets the color of the menu option's icon.        | Color picker / HEX / RGBA / Custom Themes |
| **Description** | Sets the color for the optional helper text shown under the main label. | Color picker / HEX / RGBA / Custom Themes |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::
