---
id: bounded-box
title: Bounded Box
---

# Bounded box

A **bounded box** is an infinitely customizable image annotation component that can be used to select and tag areas within an image. It supports selection using specific points (landmarking) or drawing rectangular areas (bounding boxes). It can be used to create datasets for machine learning models or to annotate images for other purposes.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/bounded-box/bounded-box.png" alt="Bounded Box" />

</div>

## Properties

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/bounded-box/propnew.png" alt="Bounded Box"/>

</div>

<br/>

| **Property** | **Description** | **Expected value** |
| :----------- | :----------- | :----------------- |
| **Image URL** | The URL or image data to show it on the component. | Get the image URL dynamically from database: **{{queries.queryname.data[0].url}}** or use [image's base64 data](/docs/how-to/loading-image-pdf-from-db/) |
| **Default value** | The data that will load the default bounded boxes over the image when the app is loaded. | Array of objects. Check the [Default value](#default-value) data properties |
| **Selector** | The bounded box support selection using rectangle or point. | Click **Fx** to set the value `RECTANGLE` or `POINT` |
| **List of labels** | The list of label that will be displayed in the dropdown while selection in the bounded-box. | Labels in array format: `{{['Tree', 'Car', 'Stree light']}}` |

#### Default value

Provide the data that will load the default bounding boxes over the image when the app is loaded. The data is expected to be an array of objects format.

| **Property** | **Description** | **Expected value** |
| :-------- | :------ | :-------- |
| **type** | Sets the type of the bounded box. | `RECTANGLE` or `POINT` |
| **width** | Sets the width of the bounded box in pixels. | Numeric value. If the `type` value is `POINT`, set it to `0` |
| **height** | Sets the height of the bounded box in pixels. | Numeric value. If the `type` value is `POINT`, set it to `0` |
| **x** | Sets the x-coordinate(horizontal) position of the bounded box in the image. | Numerical value ex: `41` |
| **y** | Sets the y-coordinate(vertical) position of the bounded box in the image. | Numerical value ex: `22` |
| **text** | Sets the text value of the bounded box. | It should be one of the labels provided in the **[List of labels](#properties)** property |

**Example of default values:**

```js
[
    {
        type: 'RECTANGLE',
        width: 40,
        height: 24,
        x: 41,
        y: 12,
        text: 'Tree'
    },
    {
        type: 'POINT',
        width: 0,
        height: 0,
        x: 10.28,
        y: 81.14,
        text: 'Car'
    }
]
```

## Events

Events are actions that can be triggered programmatically when the user interacts with the component. Click on the component handle to open its properties on the right. Go to the **Events** accordion and click on **+ Add handler**.

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/widgets/bounded-box/event1.png" alt="Bounded box events" width="600"/>

</div>

<br/>

| **Event** | **Description** |
| :----------- | :----------- |
| **On change** | Triggered when the label from the dropdown in the selector is changed in the bounded box. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General

#### Tooltip

A Tooltip is often used to specify the extra information when the user hovers the mouse pointer over the component. Once a value is set for Tooltip, hovering over the element will display the specified string as the tooltip text.

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/widgets/bounded-box/tooltip1.png" alt="Bounded box Tooltip"/>

</div>

## Layout

#### Show on desktop
Use this toggle to show or hide the component in the desktop view. You can dynamically configure the value by clicking on **`Fx`** and entering a logical expression that results in either true or false. Alternatively, you can directly set the values to **`{{true}}`** or **`{{false}}`**.

#### Show on mobile
Use this toggle to show or hide the component in the mobile view. You can dynamically configure the value by clicking on **`Fx`** and entering a logical expression that results in either true or false. Alternatively, you can directly set the values to **`{{true}}`** or **`{{false}}`**.

## Styles

| Style    | Description | Expected value |
| :----------- | :----------- | :----------- |
| **Visibility** | Toggle on or off to control the visibility of the component when the app is loaded |  **`{{true}}`** or **`{{false}}`**, By default, it's set to `{{true}}` |
| **Disable** | Toggle on to disable the component. | **`{{true}}`** or **`{{false}}`**, By default, it's set to `{{false}}` |
| **Box shadow** | Sets the add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow. | Values that represent x,y, blur, spread and color. Ex: `9px 11px 5px 5px #00000040` |

## Exposed variables

| variable    | Description |
| :----------- | :----------- | 
| **annotations** | This variable is an array of objects, where each object represents an annotation added to an image. The object contains the following keys: type, x, y, width, height, text, and id |
| **annotations.`type`** | There are two types of annotations: `RECTANGLE` and `POINT` |
| **annotations.`x`** | coordinates on the x axis  |
| **annotations.`y`** | coordinates on the y axis |
| **annotations.`width`** | width of the annotation |
| **annotations.`height`** | height of the annotation |
| **annotations.`text`** | label selected for the annotation |
| **annotations.`id`** | unique ID of the annotation (system generated) |

The values can be accessed dynamically using `{{components.boundedbox1.annotations[0].text}}` or `{{components.boundedbox1.annotations[1].width}}`

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the bounding box component.
