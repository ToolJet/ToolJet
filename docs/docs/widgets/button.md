---
id: button
title: Button
---
# Button

Button widget can be used to take actions.

<div style={{textAlign: 'left'}}>
    <figure class="video_container">
    <iframe width="630" height="400" src="https://www.youtube.com/embed/zw3yxC7WUOg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </figure>
</div>

## Properties
### Event: On click

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Button Action List](/img/widgets/button/button-actions.png)

</div>

To add an event to a button, click on the widget handle to open the widget properties on the right sidebar. Go to the **Events** section and click on **Add handler**.

**On Click** event is triggered when the button is clicked. Just like any other event on ToolJet, you can set multiple handlers for on click event.

:::info
Check [Action Reference](/docs/actions/show-alert) docs to get the detailed information about all the **Actions**.
:::

### Properties

<div style={{textAlign: 'center'}}>

![ToolJet - widget- button](/img/widgets/button/properties.png)

</div>

| Properties  | description | Expected value |
| ----------- | ----------- | -------------- |
| Button Text | It can be used to set the label of the button. | Any **String** value: `Send Message`, `Delete`, or `{{queries.xyz.data.action}}` |
| Loading state | Loading state can be used to show a spinner as the button content. Loading state is commonly used with isLoading property of the queries to show a loading status while a query is being run. | Switch the toggle **On** or click on `fx` to programmatically set the value `{{true}}` or `{{false}}`  |

### Layout

<div style={{textAlign: 'center'}}>

![ToolJet - widget- button](/img/widgets/list-view/listlayout.png)

</div>

| Layout  | description | Expected value |
| ----------- | ----------- | ------------ |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile | Toggle on or off to display mobile view. | You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

### Styles

<div style={{textAlign: 'center'}}>

![ToolJet - widget- button](/img/widgets/button/styles.png)

</div>

| Style      | Description |
| ----------- | ----------- | 
| Background color |  You can change the background color of the widget by entering the Hex color code or choosing a color of your choice from the color picker. |
| Text color |  You can change the color of the Text in button by entering the Hex color code or choosing a color of your choice from the color picker. |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not visible after the app is deployed. By default, it's set to `{{true}}`. |
| Disable | Toggle on to lock the widget. You can programmatically change its value by clicking on the `Fx` button next to it, if set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |
| Border radius | Use this property to modify the border radius of the button. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::