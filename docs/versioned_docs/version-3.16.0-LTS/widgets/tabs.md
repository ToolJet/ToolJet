---
id: tabs
title: Tabs
---

The **Tabs** component allows you to organize content into multiple tabs, making it easy to manage and display different sections of information within a compact space. Each tab can contain other components and widgets, providing a clean way to structure your application's interface.

:::caution Restricted components
Certain components, namely **Calendar** and **Kanban**, are restricted from being placed within the Tabs.
:::

## Options

Add or remove tabs from the component. You can also use **Dynamic options** which accepts an array of objects with properties - `title`, `id`, `disabled`, `backgroundColor`. |

## Events

| Event         | Description                                                    |
| :------------ | :------------------------------------------------------------- |
| On tab switch | Triggers whenever the user switches from one tab to another.   |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"130px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"200px"}}> How To Access </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setTab()                                     | Sets the currently active tab by ID.                   | `components.tabs1.setTab('0')`                        |
| setTabDisable()                              | Disables or enables a specific tab.                    | `components.tabs1.setTabDisable('0', true)`           |
| setTabLoading()                              | Sets the loading state of a specific tab.              | `components.tabs1.setTabLoading('0', true)`           |
| setTabVisibility()                           | Shows or hides a specific tab.                         | `components.tabs1.setTabVisibility('0', false)`       |
| setVisibility()                              | Sets the visibility of the entire component.           | `components.tabs1.setVisibility(false)`               |
| setLoading()                                 | Sets the loading state of the component.               | `components.tabs1.setLoading(true)`                   |
| setDisable()                                 | Disables the component.                                | `components.tabs1.setDisable(true)`                   |


## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | Description | How To Access |
| :----------- | :-----------| :------------ |
| currentTab       | Holds the ID of the currently active tab.            | `{{components.tabs1.currentTab}}`       |
| currentTabTitle  | Holds the title of the currently active tab.         | `{{components.tabs1.currentTabTitle}}`  |
| isVisible        | Indicates if the component is visible.                | `{{components.tabs1.isVisible}}`        |
| isDisabled       | Indicates if the component is disabled.               | `{{components.tabs1.isDisabled}}`       |
| isLoading        | Indicates if the component is loading.                | `{{components.tabs1.isLoading}}`        |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Hide tabs | Hides the tab headers while keeping the content visible. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Render only active tab | When enabled, only renders the currently active tab's content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Switch between sections.` ). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Tabs

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div>                        | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :----------------------------------------------------------------------- | :---------------------------------------------------------- |
| Header background                              | Sets the background color for the header.                                | Select a theme or choose from color picker.                 |
| Divider                                        | Sets the divider color.                                                  | Select a theme or choose from color picker.                 |
| Unselected text                                | Sets the color for unselected text.                                      | Select a theme or choose from color picker.                 |
| Selected text                                  | Sets the color for selected text.                                        | Select a theme or choose from color picker.                 |
| Hover Background                               | Sets the background color for hovered tab.                               | Select a theme or choose from color picker.                 |
| Unselected Icon                                | Sets the color for unselected icon.                                      | Select a theme or choose from color picker.                 |
| Selected Icon                                  | Sets the color for selected icon.                                        | Select a theme or choose from color picker.                 |
| Accent                                         | Sets the accent color.                                                   | Select a theme or choose from color picker.                 |
| Tab width                                      | Select the tab width.                                                    | Choose between **Auto** or **Equally split**.               |
| Transition                                     | Choose a transition effect to control how content switches between tabs. | Choose between **Slide** or **None**.                       |

### Container

| <div style={{ width:"200px"}}> Property </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------- |
| Common background color | Sets the default background color for all tab content areas. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border | Sets the border color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Modifies the border radius of the component. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |
| Padding | Controls the padding inside the component. | Select **Default** for standard padding or **None** for no padding. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
