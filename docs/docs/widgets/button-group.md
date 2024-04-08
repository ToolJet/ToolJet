---
id: button-group
title: Button Group
---
# Button Group

The Button group component is used to group a series of buttons together in a single line. It is used to group related buttons.

<div style={{textAlign: 'left'}}>

<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/widgets/button-group/buttongroup1.png" alt="Button group" />

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:----------- |:----------- |:-------------- |
| label | Sets the title of the button-group. | Any **String** value: `Select the options` or `{{queries.queryname.data.text}}` |
| values | Sets the values of the button group items. | **Array** of strings and numbers: `{{[1,2,3]}}` |
| Labels | Sets the labels of the button group items. | **Array** of strings and numbers: `{{['A','B','C']}}` |
| Default selected | Sets the initial selected values. | **Array** of strings and numbers: `{{[1]}}` will select the first button by default. |
| Enable multiple selection | Toggle on or off to enable multiple selection. | **Boolean** value: `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

Events are actions that can be triggered programmatically when the user interacts with the component. Click on the component handle to open its properties on the right. Go to the **Events** accordion and click on **+ Add handler**.

| <div style={{ width:"100px"}}> Events </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On click | This event is triggered when the user clicks on the button in the button group. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the button-group component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div>| <div style={{ width:"135px"}}> How To Access </div> |
| :---------- | :---------- | :----------|
| selected | If the **enable multiple selection** option is turned off, then the variable is an array of objects, and the first object holds the value of the selected button. However, if it is turned on, the variable type changes from an array to an object, and the selected button values are stored as a string within that object. | Access the value using `{{components.buttongroup1.selected[0]}}` or `{{components.buttongroup1.selected}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
#### Tooltip

A Tooltip is often used to display additional information when the user hovers the mouse pointer over the component. Once a value is set for Tooltip, hovering over the element will display the specified string as the tooltip text.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/widgets/button-group/grouptooltip.png" alt="Button group layout" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | 
| :----------- | :----------- | 
| Desktop | Toggle to show or hide the component in the desktop view. Dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either true or false. Alternatively, the  values can be set to **`{{true}}`** or **`{{false}}`**.|  
| Mobile | Toggle to show or hide the component in the desktop view. Dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either true or false. Alternatively, the  values can be set to **`{{true}}`** or **`{{false}}`**. | 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"135px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :---------- | :---------- | :-------------- |
| Background color | Set a background color for the buttons in buttons group. | Choose a color from the picker or enter the Hex color code. ex: `#000000` |
| Text color | Set a text color for the buttons in buttons group. | Choose a color from the picker or enter the Hex color code. ex: `#000000` |
| Visibility | Make the component visible or hidden. | **`{{true}}`** or **`{{false}}`**, By default, its value is set to `{{true}}` |
| Disable | Disable the component. | **`{{true}}`** or **`{{false}}`**, By default, its value is set to `{{false}}` |
| Border radius | Add a border radius to the buttons in the component using this property. | Any numerical value from `0` to `100` |
| Selected text color | Use this property to modify the text color of selected button | Choose a color from the picker or enter the Hex color code. ex: `#000000` |
| Selected background color | Use this property to modify the background color of selected button | Choose a color from the picker or enter the Hex color code. ex: `#000000` |
| Box shadow | Sets the add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow. | Values that represent X, Y, blur, spread, and color. Example: `9px 11px 5px 5px #00000040`` |

</div>