---
id: html
title: HTML Viewer
---

**HTML** component can be used to create your own HTML-CSS layout.

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

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setRawHTML( )  | Sets the Raw HTML property of the component.     | `components.html1.rawHTML` |
| setVisibility( )| Sets the visibility of the component.     | `components.html1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component.  | `components.html1.setLoading(true)` |
| setDisable( )   | Disables the component.                   | `components.html1.setDisable(true)` |

## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|
| isLoading | Indicates if the component is loading. | `{{components.html1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.html1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.html1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with the isLoading property to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip  | Provides additional information on hover. Set a display string.  | String |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
