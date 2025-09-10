---
id: tags
title: Tags
---

The Tag component is used to display small, labeled UI elements that help categorize, highlight, or add context to data.

**When to Use?**
- **Show statuses clearly**: Use tags to represent item states like Active, Pending, or Completed in a compact and consistent way.
- **Categorize information**: Add context by labeling items with categories such as High Priority, Bug, or Feature Request.
- **Improve readability**: Use tags with distinct colors and short labels to make long lists or tables easier to scan.

## Options

The tags can be added using the options section in the property panel, you can click on **+ Add new option** to add a new tag or toggle on **Dynamic tags** to add tags dynamically.

### Properties

| **Property**            | **Description**                                       | **Configuration Options**                 |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------- |
| **Title**               | Text displayed inside the tag.                        | String / Bind a variable                  |
| **Pill color**          | Background color of the tag.                          | Color picker / HEX / RGBA / Custom Themes |
| **Text and icon**       | Sets the color for both text and icon inside the tag. | Color picker / HEX / RGBA / Custom Themes |
| **Icon**                | Add an icon to the tag and control its visibility.    | Choose from icon library                  |
| **Tag visibility**      | Show or hide the tag.                                 | Toggle to control                         |
| **Overflow**            | Defines how content inside the tag is handled when it exceeds available space. | Scroll / Wrap    |

### Dynamic Tags

You can bind an array of objects to render tags dynamically. Each object in the array should define the tag’s label and styles.

```js
{{ 
    [ 
	  { title: 'success', color: '#34A94733', textColor: '#34A947' }, 
	  { title: 'info', color: '#405DE61A', textColor: '#405DE6'  }, 
	  { title: 'warning', color: '#F357171A', textColor: '#F35717'  }, 
	  { title: 'danger', color: '#EB2E3933', textColor: '#EB2E39' } 
    ] 
}}
```

Each object should include a title, a color code for a specific tag, and a corresponding text color.

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> **Action** </div> | **Description** | **RunJS Query** |
|:-----------|:----------------|:----------------|
| setVisibility( ) | Sets the visibility of the component. | `components.tags1.setVisibility()` |
| setLoading( ) | Sets the loading state of the component. | `components.tags1.setLoading()` |
| setDisable( ) | Disables the component. | `components.tags1.setDisable()` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| tags       | Holds the value of all tags in an array.  | `{{components.tags1.tags}}`.      |
| isLoading  | Indicates if the component is loading.    | `{{components.tags1.isLoading}}`  |
| isVisible  | Indicates if the component is visible.    | `{{components.tags1.isVisible}}`  |
| isDisabled | Indicates if the component is disabled.   | `{{components.tags1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :-------------------------------------------------| :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Pills

| **Property**      | **Description**                              | **Configuration Options**         |
|:----------------- |:-------------------------------------------- |:--------------------------------- |
| **Size**          | Sets the overall size of the tags.           | **Small** / **Large**             |
| **Border radius** | Controls the roundness of the tag’s corners. | Enter value in **px**             |
| **Alignment**     | Aligns tags within the component container.  | **Left** / **Center** / **Right** |

### Container

| Property.         | Description                                |
|:----------------- |:-------------------------------------------|
| **Box shadow**    | Applies shadow styling to the container.   |
| **Padding**       | Sets the padding around the container.     |