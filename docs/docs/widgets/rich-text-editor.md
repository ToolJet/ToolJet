---
id: rich-text-editor
title: Text Editor
---

# Text Editor

The **Text Editor** component is used to enter and edit text in HTML format. It is recommended for blog posts, forum posts, or notes sections. The entered text is used as the label for the radio button.

<div style={{paddingTop:'24px'}}>

## Properties

| **Property** | **Description** | **Expected Value** |
|:-----------|:-----------|:-----------|
| Placeholder | Specifies a hint describing the expected value in the component. | A string value that represents the placeholder. |
| Default Value | The default value that the component will hold when the app is loaded. | A string representing the initial content. |

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no Component-Specific Actions (CSA) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| **Variable** | **Description** | **How To Access** |
|:-----------|:-----------|:-----------|
| value | Holds the value whenever a user enters text into the Text Editor component.| Dynamically access it using `{{components.richtexteditor1.value}}`.|

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A tooltip provides additional information when the user hovers over the component. Under the **General** settings, you can set the tooltip text in string format. Hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| **Device** | **Description** |
|:-----------|:-----------|
| Show on desktop | Toggle this option to display the component in desktop view. You can programmatically set the value using `{{true}}` or `{{false}}`. |
| Show on mobile | Toggle this option to display the component in mobile view. You can programmatically set the value using `{{true}}` or `{{false}}`. |

</div>

<div style={{paddingTop:'24px'}}>

## Styles

| **Property** | **Description** | **Configuration Options** |
|:-----------|:-----------|:-----------|
| Visibility | Toggle on or off to control the visibility of the component. If set to `{{false}}`, the component will be hidden. | `{{true}}` or `{{false}}` (default: `{{true}}`) |
| Disable | Toggle on to lock the component, making it non-functional. When set to `{{true}}`, the component is locked. | `{{true}}` or `{{false}}` (default: `{{false}}`) |
| Box-shadow | Adds a shadow around the component.| Options: `none`, `small`, `medium`, `large`|

</div>