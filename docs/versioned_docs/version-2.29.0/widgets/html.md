---
id: html
title: HTML Viewer
---

# HTML Viewer

HTML widget can be used to create your own HTML-CSS layout.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/html/html.png" alt="HTML component" />

</div>

## Properties

### Raw HTML

The Raw HTML needs to be an HTML. In order to provide styles, one can add inline css to the respective HTML tags

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

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/html/raw.png" alt="HTML component" />

</div>

### General
#### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="HTML component" />

</div>

## Layout

| Layout          | description                               | Expected value                                                                                                |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

## Styles

| Style      | Description                                                                                                                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed variables

There are currently no exposed variables for the component.

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
