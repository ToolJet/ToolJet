---
id: rich-text-editor
title: Text Editor
---

# Text Editor

The **Text Editor** component is used to enter and edit text in HTML format. It is recommended for blog posts, forum posts, or notes sections. The entered text is used as the label for the radio button.

<div style={{paddingTop:'24px'}}>

## Properties

| **Property**  | **Description** | **Expected Value** |
|:-----------|:-----------|:-----------|
| Placeholder | A hint displayed to guide the user on what to enter. | String (e.g., `John Doe`). |
| Default Value | The default value that the component will hold when the app is loaded. | String (e.g., `Default Text`). |

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no Component-Specific Actions (CSA) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| **Variable** | **Description** | **How To Access** |
|:-----------|:-----------|:-----------|
| value | Holds the value entered by the user in the component. | Accessible dynamically with JS (for e.g.,`{{components.richtexteditor1.value}}`). |

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A tooltip provides additional information when the user hovers over the component. Under the **General** settings, you can set the tooltip text in string format. Hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| **Property** |**Description** | **Expected Value** |
|:-----------|:-----------|:-----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it using the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression |
| Show on mobile | Makes the component visible in mobile view. | You can set it using the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression |

</div>

<div style={{paddingTop:'24px'}}>

## Styles

| **Property** | **Description** | **Configuration Options** |
|:-----------|:-----------|:-----------|
| Visibility   | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Box-shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or programmatically set it using **fx**. |

</div>