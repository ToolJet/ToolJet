---
id: html
title: HTML Viewer
---

**HTML** component can be used to create your own HTML-CSS layout.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------|:-----------------|
| Raw HTML | The Raw HTML needs to be an HTML. In order to provide styles, one can add inline CSS to the respective HTML tags. |

**Example:**

```json
<!DOCTYPE html>
<html>
<body>
    <main>
        <section class="hero" style="height:306px;display:flex;justify-content: center;padding:0 1px;align-items: center;text-align:center">
          You can build your custom HTML-CSS template here
        </section>
    </main>
</body>
</html>

```

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px'}}>

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:-------------| :--------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on **fx** to set the value `{{true}}` or `{{false}}`. |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on **fx** to set the value `{{true}}` or `{{false}}`. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div>    |
|:---------- | :-----------|
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>
