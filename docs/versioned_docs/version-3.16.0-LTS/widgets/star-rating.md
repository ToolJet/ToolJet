---
id: star-rating
title: Star Rating
---

The Star Rating component allows users to both view and input ratings in a visually intuitive way. It supports half-star increments, giving more precise rating options, and the total number of stars can be configured to fit different use cases.

**Why Use It?**
- **Collect User Feedback**: Ideal for capturing user opinions on products, services, or content in a simple, visual format.
- **Display Ratings**: Perfect for showing aggregated scores, like average ratings for items, courses, or articles.
- **Enhanced User Experience**: Offers an intuitive and interactive way for users to express preferences, including half-star precision for more accurate ratings.

## Data

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :-------------------------------------- | :--------------------------------------------------------------------------------- | :-------------------------------------------- |
| **Label**                               | Text to display as the label for the star rating.                                  | `String`                                      |
| **Icon Type**                           | Select the icon to display for the rating.                                         | `stars` or `heart`                            |
| **Number of stars**                     | Total number of stars displayed on initial load. Default is 5.                     | `Integer`                                     |
| **Default number of selected stars**    | Sets how many stars are selected by default. Default is 3.                         | `Integer` or `half`                           |
| **Enable half star**                    | Toggle on to allow selection of half stars. Default is `false`.                    | `Boolean` (`true` / `false`)                  |
| **Tooltips**                            | Array of strings used to show informative tooltips for each star. Mapped by index. | `Array` of `String` (default: `["Very Poor","Poor","Average", "Good","Excellent"]`)           |

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On change                                   | Triggers whenever the user clicks a star.         |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> **Action** </div> | **Description** | **RunJS Query** |
|:-----------|:----------------|:----------------|
| **setValue( )**                           | Sets the current rating value programmatically. | `components.starrating1.setValue()`      |
| **resetRating( )**                        | Resets the rating to the default value.         | `components.starrating1.resetRating()`   |
| **setVisibility( )**                      | Controls the visibility of the component.       | `components.starrating1.setVisibility()` |
| **setLoading( )**                         | Sets the component to a loading state.          | `components.starrating1.setLoading()`    |
| **setDisable( )**                         | Disables user interaction with the component.   | `components.starrating1.setDisable()`    |

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :---------------------------------------------- | :------------------------------------------------| :------------------------------------------------- |
| value | Holds the value entered by the user whenever a rating is added on the component. | `{{components.starrating1.value}}` |
| label | Holds the label name of the component. | `{{components.starrating1.label}}` |
| isLoading | Indicates if the component is loading. | `{{components.starrating1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.starrating1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.starrating1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :-------------------------------------------------| :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Select an option.` ). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| **Property** | **Description** | **Configuration Options** |
| -------------| ----------------| ------------------------- |
| **Style** | Choose whether to keep the label in **standard** or **legacy** style. | Dropdown: *Standard*, *Legacy* |
| **Label color** | Change the color of the label text. | Color picker / HEX / RGBA / Custom Themes |
| **Alignment** | Adjust the placement of the label relative to the component. | *Side* / *Top* and *Left* / *Right* |
| **Width** | Sets the width of the label. | Keep `Auto width` for standard sizing, or deselect to adjust using a slider or an **fx** expression returning a numeric value. |

### Icon

| **Property**              | **Description**                            | **Configuration Options**                 |
| ------------------------- | ------------------------------------------ | ----------------------------------------- |
| **Selected background**   | Color for selected icons (stars/hearts).   | Color picker / HEX / RGBA / Custom Themes |
| **Unselected background** | Color for unselected icons (stars/hearts). | Color picker / HEX / RGBA / Custom Themes |

### Container

| **Property**   | **Description**                                   | **Configuration Options**                                                        |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Box shadow** | Apply shadow styling to the component container.  | Pick a shadow color, adjust properties, or define programmatically using **fx**. |
| **Padding**    | Maintain consistent spacing inside the container. | *Default* or *None*                                                              |
