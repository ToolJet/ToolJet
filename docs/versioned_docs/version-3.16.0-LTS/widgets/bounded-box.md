---
id: bounded-box
title: Bounded Box
---

The Bounded Box component enables image annotation by allowing users to select and tag specific areas within an image. It supports two selection modes: rectangular bounding boxes and point-based landmarking.

## Example Usage

A quality assurance team at an e-commerce company needs to review product images and flag issues like damaged packaging, incorrect labels, or missing items. Using the Bounded Box component, reviewers can annotate problem areas directly on the images. Each annotation includes a label from a predefined list (e.g., "Damaged", "Wrong Label", "Missing Item"), and the annotation data is stored for tracking and reporting purposes.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:---------------|:------------|:---------------|
| Image URL | The URL or base64 data of the image to display. | String. Example: `https://example.com/image.jpg` or dynamically from database: `{{queries.queryname.data[0].url}}`. |
| Default value | Pre-defined annotations to display when the component loads. | Array of objects. See [Default Value Format](#default-value-format) below. |
| Selector | The annotation selection mode. | `RECTANGLE` for bounding boxes or `POINT` for point-based annotations. |
| List of labels | Labels available in the dropdown when creating annotations. | Array of strings. Example: `{{['Tree', 'Car', 'Street light']}}`. |

### Default Value Format

The default value property accepts an array of annotation objects with the following structure:

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:---------------|:------------|:---------------|
| type | The annotation type. | `RECTANGLE` or `POINT`. |
| width | Width of the bounding box as a percentage of image width. | Number (0-100). Set to `0` for `POINT` type. |
| height | Height of the bounding box as a percentage of image height. | Number (0-100). Set to `0` for `POINT` type. |
| x | Horizontal position as a percentage from the left edge. | Number (0-100). |
| y | Vertical position as a percentage from the top edge. | Number (0-100). |
| text | The label for this annotation. | String. Must be one of the labels from the **List of labels** property. |

**Example:**

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

### Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"150px"}}> Description </div> |
|:---------------|:------------|
| On change | Triggered when an annotation is added, modified, or when a label is selected from the dropdown. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

There are currently no Component Specific Actions available for the Bounded Box component.

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"200px"}}> How To Access </div> |
|:---------------|:------------|:---------------|
| annotations | Array of all annotation objects on the image. Each object contains: `type`, `x`, `y`, `width`, `height`, `text`, and `id`. | `{{components.boundedbox1.annotations}}` |
| annotations[n].type | The annotation type (`RECTANGLE` or `POINT`). | `{{components.boundedbox1.annotations[0].type}}` |
| annotations[n].x | Horizontal position as a percentage. | `{{components.boundedbox1.annotations[0].x}}` |
| annotations[n].y | Vertical position as a percentage. | `{{components.boundedbox1.annotations[0].y}}` |
| annotations[n].width | Width as a percentage of image width. | `{{components.boundedbox1.annotations[0].width}}` |
| annotations[n].height | Height as a percentage of image height. | `{{components.boundedbox1.annotations[0].height}}` |
| annotations[n].text | The label assigned to the annotation. | `{{components.boundedbox1.annotations[0].text}}` |
| annotations[n].id | System-generated unique identifier for the annotation. | `{{components.boundedbox1.annotations[0].id}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Tooltip | Displays additional information when the user hovers over the component. | String (e.g., `Annotate objects in the image`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Visibility | Controls whether the component is visible when the application loads. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. Default: `{{true}}`. |
| Disable | Prevents users from creating or modifying annotations when enabled. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. Default: `{{false}}`. |
| Box shadow | Adds shadow effects around the component's frame. | Specify horizontal offset (X), vertical offset (Y), blur radius, spread radius, and color. Example: `9px 11px 5px 5px #00000040`. |

<br/>

---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)