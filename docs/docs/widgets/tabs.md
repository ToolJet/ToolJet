---
id: tabs
title: Tabs
---

The **Tabs** component lets you organize content into separate views that users can easily switch between. It's ideal for managing complex layouts or grouping related information without overwhelming the interface. Tabs help keep your UI clean and structured, enhancing user navigation and focus.

:::caution Restricted components
Certain components, namely **Calendar** and **Kanban**, are restricted from being placed within the Tabs.
:::

## Options

Add or remove tabs from the component. You can also use **Dynamic options** which accepts an array of objects with properties - `title`, `id`, `disabled`, `backgroundColor`. |

## Events

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On tab switch | Triggeres whenever the tab is switched. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"130px"}}> Actions  </div>   | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| setTab | Set the current tab of the Tabs component via a component-specific action within any event handler. | `components.tabs1.setTab()` |
| setVisibility( )| Sets the visibility of the component.                 | `components.tabs1.setVisibility()` |
| setLoading( )   | Sets the loading state of the component.              | `components.tabs1.setLoading()` |
| setDisable( )   | Disables the component.                               | `components.tabs1.setDisable()` |
| setTabDisable( ) | Disables the particular tab. | `components.tabs1.setTabDisable()` |
| setTabLoading( ) | Sets the loading state of the particular tab.  | `components.tabs1.setTabLoading()` |
| setTabVisibility( ) | Sets the visibility of the particular tab.  | `components.tabs1.setTabVisibility()` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div>   | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
|  currentTab | Returns the currently active tab ID. | `{{components.tabs1.currentTab}}` |
|  isLoading | Indicates if the component is loading. | `{{components.tabs1.isLoading}}` |
|  isVisible | Indicates if the component is visible. | `{{components.tabs1.isVisible}}` |
|  isDisabled  | Indicates if the component is disabled. | `{{components.tabs1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state     | Enables a loading spinner, often used with `isLoading` to indicate progress.    | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Visibility        | Controls component visibility.                                                  | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Disable           | Enables or disables the component.                                              | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Hide tabs | Hides all the tab titles. | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Render only active tab| Only the active tab will be rendered. | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Dynamic height | Automatically adjusts the component's height based on its content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip           | Provides additional information on hover. Set a display string.                 | String                        |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Tabs

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Header background | Sets the background color for the header. | Select a theme or choose from color picker. |
| Divider | Sets the divider color. |Select a theme or choose from color picker. |
| Unselected text | Sets the color for unselected text. | Select a theme or choose from color picker. |
| Selected text | Sets the color for selected text. | Select a theme or choose from color picker. |
| Hover Background | Sets the background color for hovered tab. | Select a theme or choose from color picker. |
| Unselected Icon | Sets the color for unselected icon. | Select a theme or choose from color picker. |
| Selected Icon | Sets the color for selected icon. | Select a theme or choose from color picker. |
| Accent | Sets the accent color. | Select a theme or choose from color picker. |
| Tab width | Select the tab width. | Choose between **Auto** or **Equally split**. |
| Transition | Choose a transition effect to control how content switches between tabs. | Choose between **Slide** or **None**. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Border | Sets the border color of the component. | Select a theme or choose from color picker. |
| Border radius | Modifies the border radius of the component. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or programmatically set it using **fx**. |
| Padding | Allows you to maintain a standard padding. | Choose from **Default** or **None**. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
