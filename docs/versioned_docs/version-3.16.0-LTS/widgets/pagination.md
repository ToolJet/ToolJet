---
id: pagination
title: Pagination
---

**Pagination** enables the user to select a specific page from a range of pages. It is used to separate the content into discrete pages.

:::tip
You can club the Pagination component with the List View component.
:::

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | 
|:------------ |:-------------|
| Number of pages | You can use this to predefined the total number of pages. It is calculated by dividing the length of the data array that will be passed, by the data limit which is the number of posts we will show on each page. |
| Default page index | It is used to set and display the default page index when the app initially loads. You can also put a conditional logic to set its value as per your use case. |

## Event

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------------|:---------------------|
| On Page Change | Triggered whenever the user switches to another page index. |

## Component Specific Actions (CSA)

The following actions of the Pagination component can be controlled using the component-specific actions (CSA). You can trigger them using an event or a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"200px"}}> How To Access </div> |
|:------------------|:---------------------|:---------------------|
| setPage() | Programmatically navigates to a page. If the given index is 0 or less, it navigates to the first page; if it's greater than the total number of pages, it navigates to the last page. | `components.pagination1.setPage(3)` |
| setVisibility() | Sets the visibility of the component. | `components.pagination1.setVisibility(false)` |
| setDisable() | Enables or disables the component. | `components.pagination1.setDisable(true)` |
| setLoading() | Sets the loading state of the component. While loading, page navigation is blocked and a spinner is shown in place of the current page number. | `components.pagination1.setLoading(true)` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| totalPages | Holds the value of the `Number of Pages` set from the Pagination component properties.| Accessible dynamically with JS(for e.g., `{{components.pagination1.totalPages}}`).|
| currentPageIndex | Holds the index of the currently selected option on the Pagination component. | Accessible dynamically with JS(for e.g., `{{components.pagination1.currentPageIndex}}`). |
| isVisible | Indicates if the component is visible. | Accessible dynamically with JS(for e.g., `{{components.pagination1.isVisible}}`). |
| isDisabled | Indicates if the component is disabled. | Accessible dynamically with JS(for e.g., `{{components.pagination1.isDisabled}}`). |
| isLoading | Indicates if the component is in a loading state. | Accessible dynamically with JS(for e.g., `{{components.pagination1.isLoading}}`). |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
|:------------ |:-------------|:--------- |
| Loading state | Shows a loading indicator on the current page and blocks page navigation while enabled. Often used together with `isLoading`. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Toggle on or off to control the visibility of the component. If `{{false}}` the component will not be visible after the app is deployed. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | This is `off` by default. Toggle `on` to lock the component and make it non-functional. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Displays an informational tooltip when the user hovers over the component. | String (e.g., `Go to next page`). |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:------------ |:-------------|:--------- |
| Show on desktop  | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:------------ |:-------------|:--------- |
| Alignment | Sets the horizontal alignment of the pagination controls. | By default, it's set to `Left`. |
| Box shadow | Sets the box shadow of the component. You can also set it programmatically using **fx**. | By default, no box shadow is applied. |
