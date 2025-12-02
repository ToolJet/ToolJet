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

**Options Loading State** allows you to add a loading state to the dynamically generated options. You can enable or disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.


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
| setVisibility( ) | Sets the visibility of the component. | `components.popovermenu1.setVisibility()` |
| setLoading( ) | Sets the loading state of the component. | `components.popovermenu1.setLoading()` |
| setDisable( ) | Disables the component. | `components.popovermenu1.setDisable()` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| label | Holds the label name of the component. | `{{components.popovermenu1.label}}` |
| options | Holds all the option values of the component in array form. | `{{components.popovermenu1.options}}` |
| lastClickedOption | Holds the value of the last clicked option. | `{{components.popovermenu1.lastClickedOption}}` |
| isLoading | Indicates if the component is loading. | `{{components.popovermenu1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.popovermenu1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.popovermenu1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :-------------------------------------------------| :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Select an option.` ). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Menu

| **Property**      | **Description**                                           | **Configuration Options**                   |
| ----------------- | --------------------------------------------------------- | ------------------------------------------- |
| **Background**    | Sets the background color of the popover menu.            | Color picker / HEX / RGBA / Custom Themes   |
| **Text**          | Defines the text color of labels inside the menu.         | Color picker / HEX / RGBA / Custom Themes   |
| **Border**        | Customizes the border color of the menu container.        | Color picker / HEX / RGBA / Custom Themes   |
| **Loader**        | Sets the color of the loader.                             | Color picker / HEX / RGBA / Custom Themes   |
| **Icon**          | Allows you to select an icon for the trigger button.      | Select icon, enable/disable icon visibility |
| **Icon color**    | Adjusts the icon color and its alignment (left or right). | Color picker / Alignment options            |
| **Border Radius** | Rounds the corners of the menu container.                 | Pixel values / Predefined radius options    |
| **Box shadow**    | Adds shadow effects to the menu for depth.                | Color picker / HEX / RGBA / Custom Themes   |

### Options

| **Property**    | **Description**                                  | **Configuration Options**                 |
| --------------- | ------------------------------------------------ | ----------------------------------------- |
| **Label**       | Sets the color for the display text for the menu option.            | Color picker / HEX / RGBA / Custom Themes |
| **Icon color**  | Sets the color of the option’s icon.             | Color picker / HEX / RGBA / Custom Themes |
| **Description** | Sets the color for the optional helper text shown under the main label. | Color picker / HEX / RGBA / Custom Themes |
