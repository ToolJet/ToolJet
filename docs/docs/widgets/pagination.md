---
id: pagination
title: Pagination
---

**Pagination** enables the user to select a specific page from a range of pages. It is used to separate the content into discrete pages.

:::tip
You can club the Pagination component with the List View component.
:::

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | 
|:------------ |:-------------|
| Number of pages | You can use this to predefined the total number of pages. It is calculated by dividing the length of the data array that will be passed, by the data limit which is the number of posts we will show on each page. |
| Default page index | It is used to set and display the default page index when the app initially loads. You can also put a conditional logic to set its value as per your use case. |

</div>

<div style={{paddingTop:'24px'}}>

## Event

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------------|:---------------------|
| On Page Change | Triggered whenever the user switches to another page index. |

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| totalPages | Holds the value of the `Number of Pages` set from the Pagination component properties.| Accessible dynamically with JS(for e.g., `{{components.pagination1.totalPages}}`).|
| currentPageIndex | Holds the index of the currently selected option on the Pagination component. | Accessible dynamically with JS(for e.g., `{{components.pagination1.currentPageIndex}}`). |

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:------------ |:-------------|:--------- |
| Show on desktop  | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:------------ |:-------------|:--------- |
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not be visible after the app is deployed. | By default, it's set to `{{true}}`. |
| Disable  | This is `off` by default, toggle `on` the switch to lock the component and make it non-functional. You can also programmatically set the value by clicking on the **fx** button next to it. If set to `{{true}}`, the component will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Pagination 2.0 Features

Pagination 2.0 introduces several new features to enhance the user experience and performance:

- **Dynamic Page Size**: Allows users to select the number of records per page dynamically.
- **Jump to Page**: Users can directly jump to a specific page number.
- **Loading Indicator**: Improved loading indicators for better user feedback.
- **Enhanced Accessibility**: Improved keyboard navigation and screen reader support.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example Usage of Pagination 2.0

Here is an example of how to use the new Pagination 2.0 component:

```jsx
import React, { useState } from 'react';
import Pagination from '@/_ui/Pagination';

const MyComponent = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Fetch new data based on the page number
  };

  return (
    <div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        dynamicPageSize
        jumpToPage
        showLoadingIndicator
      />
    </div>
  );
};

export default MyComponent;
```

</div>
