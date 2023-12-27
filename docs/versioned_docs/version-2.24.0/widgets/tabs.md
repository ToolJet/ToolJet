---
id: tabs
title: Tabs
---

# Tabs

A Tabs widget contains a number of defined containers that can be navigated through the tabs. Each tab acts as a [container](/docs/widgets/container/) that can have different widgets placed inside it.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/tabs/tabs.png" alt="ToolJet - Widget Reference - Tabs" />

</div>

:::caution Restricted components
In order to avoid excessively complex situations, certain components, namely **Calendar** and **Kanban**, are restricted from being placed within the Tabs component using drag-and-drop functionality.

If the builder attempts to add any of the aforementioned components inside the Tabs, an error message will be displayed:

`<Restricted component> cannot be used as a child component within the Tabs.`
:::

## How To Use Tabs Widget

<iframe height="500" src="https://www.youtube.com/embed/YmAhpO4Ku5w" title="Tabs Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

### Tabs

This property lets you add and remove containers from the tabs widget. Each container in the tab has its unique `id` , `title` and `disabled` for disabling individual tabs . This field expects an array of objects.

```js
{{[
    { title: 'Home', id: '0' },
    { title: 'Profile', id: '1',disabled:'true' },
    { title: 'Settings', id: '2' }
]}}
```

#### Adding background color to Tabs

You can specify the different color for each tab using the `backgroundColor` property and use hex color code or color name as the value.

```js
{{[ 
		{ title: 'Home', id: '0', backgroundColor: '#81D4FA' }, 
		{ title: 'Profile', id: '1', backgroundColor: 'blue' }, 
		{ title: 'Settings', id: '2', backgroundColor: '#ecf0f1'} 
 ]}}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/tabs/tabsbg.png" alt="Tabs properties"/>

</div>

### Default tab

This property selects the container in the tab which matches the corresponding `id`. By default, the value is set to `0`.

### Hide tab

It allows you to hide all the tab titles defined in the Tabs property above. It accepts boolean values which can also be set using the toggle option or programmatically by clicking on the FX button.

### Render only active tab

This property is enabled by default. When enabled, only the active tab will be rendered and when disabled, all the tabs in the component will be rendered.

## Events

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/tabs/events.png" alt="irtable record"/>

</div>

### On tab switch

This event is triggered when the tab is switched.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Actions

| Action      | Description | Properties |
| ----------- | ----------- | ------------------ |
| setTab | Set current tab. | `id` |

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Highlight Color

You can change the highlight color of the selected tab by entering the Hex color code or choosing a color of your choice from the color picker.

### Tab width

Tab width can be set as **auto** or **equally split**.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed Variables

| Variables    | Description |
| ----------- | ----------- |
| currentTab | This variable holds the id of the current tab selected on the tabs component. You can access the value dynamically using JS: `{{components.tabs1.currentTab}}`|

## Component specific actions (CSA)

Following actions of Tabs component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| ----------- | ----------- |
| setTab | Set the current tab of the tabs component via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.tabs1.setTab(1)` |