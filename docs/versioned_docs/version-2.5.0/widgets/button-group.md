---
id: button-group
title: Button Group
---
# Button group

Button group widget can be used to take actions.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/button-group/button-group.png" alt="Button group" />

</div>

## Properties
### Events

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/button-group/events.png" alt="Button group events" />

</div>

#### On click
| Events | Description |
|:----------- |:----------- |
| On click | Triggers when the user clicks the button. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

### Properties

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/button-group/properties.png" alt="Button group properties" />

</div>

| Properties  | Description | Expected value |
| ----------- | ----------- | -------------- |
| label | Sets the title of the button-group. | Any **String** value: `Select the options` or `{{queries.queryname.data.text}}`. |
| values | Sets the values of the Button Group items. | **Array** of strings and numbers: `{{[1,2,3]}}`. |
| Labels | Sets the labels of the Button Group items. | **Array** of strings and numbers: `{{['A','B','C']}}`. |
| Default  selected | Sets the initial selected values. | **Array** of strings and numbers: `{{[1]}}` will select the first button by default. |
| Enable multiple selection |  Toggle on or off to enable multiple selection. | **Boolean** value: `{{true}}` or `{{false}}`. |

### General
#### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="Button group Tooltip" />

</div>

### Devices

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/button-group/layout.png" alt="Button group layout" />

</div>

| Property  | Description | Expected value |
| ----------- | ----------- | ------------ |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

### Styles

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/button-group/styles.png" alt="Button group properties" />

</div>

| Style      | Description | Expected Value |
| ----------- | ----------- | ----------- |
| Background color | Set a background color for the buttons in button group. | Choose a color from the picker or enter the Hex color code. ex: `#000000`. |
| Text color | Set a text color for the buttons in button group. | Choose a color from the picker or enter the Hex color code. ex: `#000000`. |
| Visibility | Make the component visible or hidden. | **`{{true}}`** or **`{{false}}`**, By default, its value is set to `{{true}}`. |
| Disable | Disable the component. | **`{{true}}`** or **`{{false}}`**, By default, its value is set to  `{{false}}`. |
| Border radius |  Add a border radius to the buttons in the component using this property. | Any numerical value from `0` to `100`. |
| Selected text color | Use this property to modify the text color of selected button. | Choose a color from the picker or enter the Hex color code. ex: `#000000`. |
| Selected background color | Use this property to modify the background color of selected button. | Choose a color from the picker or enter the Hex color code. ex: `#000000`.|
| Box shadow | Sets the add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow. | Values that represent X, Y, blur, spread, and color. Example: `9px 11px 5px 5px #00000040`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::


## Exposed Variables

| Variables      | Description |
| ----------- | ----------- |
| selected | Holds the currently selected button value as an array object. | Accessible dynamically with JS (for e.g., {{components.buttongroup1.selected[0]}} or {{components.buttongroup1.selected}}). |

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the button-group component.
