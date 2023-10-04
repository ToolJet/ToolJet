---
id: button
title: Button
---
# Button

Button component can be used to trigger an action. It can be used to submit a form, navigate to another page, or trigger a query.

<iframe height="500" src="https://www.youtube.com/embed/zw3yxC7WUOg" title="Tooljet Button Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

| Property      | Description | Expected value |
| :----------- | :----------- | :----------- |
| **Button Text** | It can be used to set the label of the button. | Any **String** value: `Send Message`, `Delete`, or `{{queries.xyz.data.action}}` |
| **Loading state** | The loading state can be used to show a spinner as the button content. Loading state is commonly used with isLoading property of the queries to show a loading status while a query is being run. | Toggle the switch **On** or click on **fx** to programmatically set the value to `{{true}}`` or `{{false}}``  |

## Events

Events are actions that can be triggered programmatically when the user interacts with the component. Click on the component handle to open its properties on the right. Go to the **Events** accordion and click on **+ Add handler**.

| Event      | Description |
| :----------- | :----------- |
| **On click** | The On click event is triggered when the button is clicked. |
| **On hover** | The On hover event is triggered when the mouse cursor is moved over the button. Just like any other event on ToolJet, you can set multiple handlers for on click event. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
#### Tooltip

A Tooltip is often used to display additional information when the user hovers the mouse pointer over the component. Once a value is set for Tooltip, hovering over the element will display the specified string as the tooltip text.

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/widgets/button/buttontooltip.png" alt="ToolJet - Widget Reference - Tooltip" />

</div>

## Layout

#### Show on desktop

Use this toggle to show or hide the component in the desktop view. You can dynamically configure the value by clicking on **Fx** and entering a logical expression that results in either true or false. Alternatively, you can directly set the values to **`{{true}}`** or **`{{false}}`**.

#### Show on mobile

Use this toggle to show or hide the component in the mobile view. You can dynamically configure the value by clicking on **Fx** and entering a logical expression that results in either true or false. Alternatively, you can directly set the values to  **`{{true}}`** or **`{{false}}`**.

## Styles

| Style      | Description | Expected value |
| :----------- | :----------- | :----------- |
| **Background color** | Change the background color. | Choose color from the colorpicker or enter the Hex color code. ex: `#000000` |
| **Text color** | Change the text color. | Choose color from the colorpicker or enter the Hex color code. ex: `#000000` |
| **Loader color** | Change the color of the loader (if loading state is enabled) | Choose color from the colorpicker or enter the Hex color code. ex: `#000000` |
| **Visibility** | Make the component visible or hidden. | **`{{true}}`** or **`{{false}}`**, By default, its value is set to `{{true}}` |
| **Disable** | Disable the button. | **`{{true}}`** or **`{{false}}`**, By default, its value is set to `{{false}}` |
| **Border radius** | Add a border radius to the button using this property. | Any numerical value from `0` to `100` |
| **Border color** | Change the border color of the button. | Choose color from the colorpicker or enter the Hex color code. ex: `#000000` |
| **Box Shadow** | Sets the add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow. | Values that represent X, Y, blur, spread, and color. Example: `9px 11px 5px 5px #00000040`` |

## Exposed variables

| Variable      | Description |
| :----------- | :----------- |
| **buttonText** | This variable stores the text displayed on the button. Its value can be dynamically accessed through JavaScript using the following syntax: `{{components.button1.buttonText}}` |

## Component specific actions (CSA)

Following actions of button component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| :----------- | :----------- |
| **click** | You can regulate the click of a button via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.button1.click()` |
| **setText** | button's text can be controlled using component specific action from any of the event handler. You can also use RunJS query to execute component specific actions: `await components.button1.setText('New Button Text')` |
| **disable** | button can be disabled using the component specific action from any of the event handler. You can also use RunJS query to execute this action: `await components.button1.disable(true)` or `await components.button1.disable(false)` |
| **visibility** | button can be hidden using the component specific action from any of the event handler. You can also use RunJS query to execute this action: `await components.button1.visibility(true)` or `await components.button1.visibility(false)` |
| **loading** | The loading state of the button can be set dynamically using the component specific actions from any of the event handler. You can also use this action from RunJS: `await components.button1.loading(true)` or `await components.button1.loading(false)` |