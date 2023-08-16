---
id: button
title: Button
---
# Button

Button component can be used to trigger an action. It can be used to submit a form, navigate to another page, or trigger a query.

<iframe height="500"src="https://www.youtube.com/embed/zw3yxC7WUOg" title="Tooljet Button Component" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/button/props.png" alt="ToolJet - Component Reference - Button"/>

</div>

<br/>

| Property      | Description |
| :----------- | :----------- |
| **Button Text** | It can be used to set the label of the button. |
| **Loading state** | Loading state can be used to show a spinner as the button content. Loading state is commonly used with isLoading property of the queries to show a loading status while a query is being run. |

## Events

Events are actions that can be triggered programmatically when the user interacts with the component. Click on the component handle to open its properties on the right. Go to the **Events** accordion and click on **+ Add handler**. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/button/button-actions.png" alt="ToolJet - Component Reference - Button Events List" />

</div>

<br/>

| Event      | Description |
| :----------- | :----------- |
| **On click** | On click event is triggered when the button is clicked. |
| **On hover** | On hover event is triggered when the mouse cursor is moved over the button. Just like any other event on ToolJet, you can set multiple handlers for on click event. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
#### Tooltip

A Tooltip is often used to specify the extra information when the user hovers the mouse pointer over the component. Once a value is set for Tooltip, hovering over the element will display the specified string as the tooltip text.

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/widgets/button/tooltip.png" alt="ToolJet - Component Reference - Button Properties" />

</div>

## Layout

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/widgets/button/layout.png" alt="ToolJet - Component Reference - Button Properties" />

</div>

<br/>

| Layout  | Description | Expected value |
| :----------- | :----------- | :------------ |
| **Show on desktop** | Toggle on to show the component on desktop. By default, it's set to `{{true}}`. | `{{true}}` or `{{false}}` |
| **Show on mobile** | Toggle on to show the component on tablet. By default, it's set to `{{false}}`. | `{{true}}` or `{{false}}` |


## Styles

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/widgets/button/styles.png" alt="ToolJet - Component Reference - Button Styles" />

</div>

<br/>

| Style      | Description |
| :----------- | :----------- | 
| **Background color** |  You can change the background color of the componentby entering the Hex color code or choosing a color of your choice from the color picker. |
| **Text color** |  You can change the color of the Text in button by entering the Hex color code or choosing a color of your choice from the color picker. |
| **Loader color** |  You can change the color of the loader in button by entering the Hex color code or choosing a color of your choice from the color picker. This will only be affective if the [loading state](#properties-1) property of the button is enabled. |
| **Visibility** | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the componentwill not visible after the app is deployed. By default, it's set to `{{true}}`. |
| **Disable** | Toggle on to lock the component. You can programmatically change its value by clicking on the `Fx` button next to it, if set to `{{true}}`, the componentwill be locked and becomes non-functional. By default, its value is set to `{{false}}`. |
| **Border radius** | Use this property to modify the border radius of the button. |
| **Border color** | Add a color to the border of the button using this property. |
| **Box Shadow** | Add a box shadow to the button using this property. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed variables

| Variable      | Description |
| :----------- | :----------- |
| **buttonText** | This variable stores the text displayed on the button. Its value can be accessed dynamically through JavaScript using the following syntax: `{{components.button1.buttonText}}` |

## Component specific actions (CSA)

Following actions of button component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| :----------- | :----------- |
| **click** | You can regulate the click of a button via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.button1.click()` |
| **setText** | button's text can be controlled using component specific action from any of the event handler. You can also use RunJS query to execute component specific actions: `await components.button1.setText('New Button Text')` |
| **disable** | button can be disabled using the component specific action from any of the event handler. You can also use RunJS query to execute this action: `await components.button1.disable(true)` or `await components.button1.disable(false)` |
| **visibility** | button's visibility can be switched using the component specific action from any of the event handler. You can also use RunJS query to execute this action: `await components.button1.disable(true)` or `await components.button1.disable(false)` |
| **loading** | The loading state of the button can be set dynamically using the component specific actions from any of the event handler. You can also use this action from RunJS: `await components.button1.loading(true)` or `await components.button1.loading(false)` |