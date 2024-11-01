---
id: listview
title: List View
---
# List View

The **List View** component allows to create a list of repeatable rows of data. Just like the Container component, you can nest other components inside of it and control how many times they repeat.


:::caution Restricted components
Certain components, namely **Calendar** and **Kanban**, are restricted from being placed within the List View component using drag-and-drop functionality.
:::

<div style={{paddingTop:'24px'}}>

## Setting List Data

To dynamically populate List View components, you can use specific data properties.

Consider this data being passed inside a List View component's `List data` property:

```js
{{[
    { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 1' },
    { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 2' },
    { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 3' },
]}}
```

Based on the above data, you can set the `Data` property of a Text component inside List View using the below code:

```js
{{listItem.text}}
```

Similarly, for an Image component inside List View, you can use the below code to pass the `imageURL` value:

```js
{{listItem.imageURL}}
```

</div>

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:---|:---|:---|
| List data | Specifies the data to display in the List View component. | An array of objects or a query that returns an array of objects. |
| Mode | Set the List View layout to either `List` or `Grid` mode. | `list` or `grid`. |
| Show bottom border | Controls the visibility of the bottom border on a row, applicable only in `List` mode. | `true` or `false`. |
| Columns | Specifies the number of columns in the List View component when in `Grid` mode. | Any numerical value. |
| Row height | Specifies the height of each row in the List View component. | Any number between 1 and 100. |
| Enable pagination | Indicates if pagination is enabled and allows setting rows per page. | `true` or `false`. |
| Rows per page | Specifies the number of rows displayed per page when pagination is enabled. | Any numerical value. |

</div>

<div style={{paddingTop:'24px'}}>

## Events

To attach an event handler to the List View component, follow these steps:
1. Click on the component handle to open its properties on the right sidebar.
2. Navigate to the **Events** section.
3. Click on the **+Add handler** button.

There are two events that you can use with the List View component:
- **[Row clicked (Deprecated)](#row-clicked)**
- **[Record clicked](#record-clicked)**

### Row clicked

The **Row clicked** event is triggered when any row inside the List View is clicked. Similar to other events in ToolJet, you can define multiple actions for this event.

When a row is clicked in the List View component, certain related data is made available through the **selectedRowId** and **selectedRow** variables. For the List View component's available exposed variables, refer to the **[here](#exposed-variables)** section.

:::warning
The Row clicked event is being deprecated, so it is recommended to use the **Record Clicked** event instead.
:::

### Record clicked

The **Record clicked** event is similar to the row click event, as it is triggered whenever an interaction is made with a record in the component.

When a record is clicked in the List View component, relevant data is exposed through the **selectedRecordId** and **selectedRecord** variables. For the List View component's available exposed variables, refer to the **[here](#exposed-variables)** section.

:::info
To get detailed information about all the **Actions**, please consult the [Action Reference](/docs/category/actions-reference) documentation.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

|  <div style={{ width:"100px"}}> Variables </div>   |  <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:-------- |
| data | Stores the data loaded into the List View component. | Accessible dynamically with JS (for e.g., `{{components.listview1.data["0"].text1.text}}`). |
| selectedRowId (deprecated) | Holds the id of the clicked row in the list view, starting from `0`. | Accessible dynamically with JS (for e.g., `{{components.listview1.selectedRow.text1}}`). |
| selectedRow (deprecated) | Contains the data of the selected row's components.| Access the data using `{{components.listview1.selectedRow.text1}}`. |
| selectedRecordId |  Holds the id of the clicked record in the list view, starting from `0`. | Accessible dynamically with JS (for e.g., `{{components.listview1.selectedRecordId}}`).|
| selectedRecord | Stores the data of the components within the selected record. | VAccessible dynamically with JS (for e.g., `{{components.listview1.selectedRecord.text1}}`). |
| children | Stores the data of the components within all the records in the List View component.| The purpose of exposing children is to enable the child components to be [controlled using component specific actions](#controlling-child-components). |

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
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.|
| Show on mobile  | Makes the component visible in mobile view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"135px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :---------- | :---------- | :-------------- |
| Background color | Sets the background color of the component. | Choose a color from the picker or enter the Hex color code. ex., `#000000`. |
| Border color | Change the border color of the list view. | Choose a color from the picker or enter the Hex color code. ex., `#000000`. |
| Visibility | Make the component visible or hidden. | **`{{true}}`** or **`{{false}}`**, By default, its value is set to `{{true}}`. |
| Disable | Disable the component. | **`{{true}}`** or **`{{false}}`**, By default, its value is set to  `{{false}}`. |
| Border radius. | Sets the border radius of the list view. | Any numerical value from `0` to `100`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Example: Displaying Data in the List View

- Let's start by creating a new app and then dragging the List View component onto the canvas.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/widgets/list-view/emptylist.png" alt="ToolJet - List view component" />

    </div>

- Now lets create a query and select the REST API from the datasource dropdown. Choose the `GET` method and enter the API endpoint - `https://reqres.in/api/users?page=1`. Save this query and fire it. Inspect the query results from the left sidebar, you'll see that it resulted in the `data` object having an array of objects.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/widgets/list-view/data.gif" alt="ToolJet - List view component" />

    </div>


- Now lets edit the `List data` property of the List View component for displaying the query data. We will use JS to get the data from the query - `{{queries.restapi1.data.data}}`. Here the last `data` is a data object that includes an array of objects, the first `data` is the data resulted from the `restapi1` query. This will automatically create the rows in the component using the data.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/widgets/list-view/datadisplay.png" alt="ToolJet - List view component" />

    </div>


- Finally, we will need to nest components into the first row of List View component and the component will automatically create the subsequent instances. The subsequent rows will appear the same way you'll display the data in the first row.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/widgets/list-view/addingwidgets.gif" alt="ToolJet - List view component" />

    </div>


:::tip

Use `{{listItem.key}}` to display data on the nested components. Example: For displaying the images we used `{{listItem.avatar}}` where **avatar** is one of the key in the objects from the query result.

:::

</div>

<div style={{paddingTop:'24px'}}>

## Controlling Child Components

All the child components of the List View component are exposed through the `children` variable. This variable is an array of objects, where each object represents a record in the listview and contains the data of the child components.

The components inside the list view can be controlled using the javascipt queries. For example, if you want to disable the `button1` component in the first record, you can use the following expression:

```js
components.listview1.children[0].button1.disable(true) // disables the button1 component in the first record
```

<br/>

:::caution
Currently, only those child components can be controlled using the javascript queries that have component specific actions implemented. To check if a component has component specific actions implemented, refer to the document of that **[specific component](/docs/widgets/overview)**.
:::

</div>