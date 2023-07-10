---
id: listview
title: List view
---
# List view

List view widget allows to create a list of repeatable rows of data. Just like a container widget, you can nest other widgets inside of it and control how many times they repeat.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/listviewapp.png" alt="ToolJet - List view widget" />

</div>

## Events

To attach an event handler to the list view component, follow these steps:
1. Click on the component handle to open its properties on the right sidebar.
2. Navigate to the **Events** section.
3. Click on the **+Add handler** button.

There are two events that you can use with the List View component:
- **[Row clicked (Deprecated)](#row-clicked)**
- **[Record clicked](#record-clicked)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/newevents.png" alt="ToolJet - List view widget" />

</div>

### Row clicked

The **Row clicked** event is triggered when any row inside the list view is clicked. Similar to other events in ToolJet, you can define multiple actions for this event.

When a row is clicked in the list view component, certain related data is made available through the **selectedRowId** and **selectedRow** variables. For the list view component's available exposed variables, refer to the **[here](#exposed-variables)** section.

:::warning
The Row clicked event is being deprecated, so it is recommended to use the **Record Clicked** event instead.
:::

### Record clicked

The **Record clicked** event is similar to the row click event, as it is triggered whenever an interaction is made with a record in the component.

When a record is clicked in the list view component, relevant data is exposed through the **selectedRecordId** and **selectedRecord** variables. For the list view component's available exposed variables, refer to the **[here](#exposed-variables)** section.

:::info
To get detailed information about all the **Actions**, please consult the [Action Reference](/docs/category/actions-reference) documentation.
:::

## Properties

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/propsnew.png" alt="ToolJet - List view widget" width="300"/>

</div>

| **Properties** | **Description** | **Expected value** |
|---|---|---|
| **List data** | The data that you want to display in the list view component. This can be an array of objects or data from a query that returns an array of objects. | An array of objects or a query that returns an array of objects. |
| **Mode** | The layout of the list view component. You can choose between `List` and `Grid` mode. | `list` or `grid` |
| **Show bottom border** | Whether to show or hide the bottom border on a row. This option is only available when the **Mode** is set to `List`. | `true` or `false` |
| **Columns** | The number of columns in the list view component. This option is only available when the **Mode** is set to `Grid`. | Any numerical value |
| **Row height** | The height of each row in the list view component. | Any number between 1 and 100 |
| **Enable pagination** | Whether to enable pagination. If enabled, you can set the number of rows per page. | `true` or `false` |
| **Rows per page** | The number of rows per page. This option is only available when **Enable pagination** is enabled. | Any numerical value |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/gridmode.gif" alt="ToolJet - List view widget" />

</div>

### General
#### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - List view widget" />

</div>

## Layout

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/listlayout.png" alt="ToolJet - List view widget" />

</div>

| Layout  | description | Expected value |
| ----------- | ----------- | ------------ |
| Show on desktop | Toggle on or off to display the desktop view. | You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile | Toggle on or off to display the mobile view. | You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`   |

## Styles

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/style.png" alt="ToolJet - List view widget" />

</div>

| Style      | Description |
| ----------- | ----------- |
| Background Color |  You can change the background color of the widget by entering the Hex color code or choosing a color of your choice from the color picker. |
| Border Color |  You can change the border color of the listview by entering the `Hex color code` or choosing a color of your choice from the color picker. |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not be visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`. |
| Disable |  This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |
| Border radius | Use this property to modify the border radius of the list view. The field expects only numerical value from `1` to `100`, default is `0`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Example: Displaying data in the list view

- Let's start by creating a new app and then dragging the List view widget onto the canvas.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/emptylist.png" alt="ToolJet - List view widget" />

</div>

- Now lets create a query and select the REST API from the datasource dropdown. Choose the `GET` method and enter the API endpoint - `https://reqres.in/api/users?page=1`. Save this query and fire it. Inspect the query results from the left sidebar, you'll see that it resulted in the `data` object having an array of objects.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/data.gif" alt="ToolJet - List view widget" />

</div>


- Now lets edit the `List data` property of the list view widget for displaying the query data. We will use JS to get the data from the query - `{{queries.restapi1.data.data}}`. Here the last `data` is a data object that includes an array of objects, the first `data` is the data resulted from the `restapi1` query. This will automatically create the rows in the widget using the data.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/datadisplay.png" alt="ToolJet - List view widget" />

</div>


- Finally, we will need to nest widgets into the first row of list view widget and the widget will automatically create the subsequent instances. The subsequent rows will appear the same way you'll display the data in the first row.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/addingwidgets.gif" alt="ToolJet - List view widget" />

</div>


:::tip

Use `{{listItem.key}}` to display data on the nested widgets. Example: For displaying the images we used `{{listItem.avatar}}` where **avatar** is one of the key in the objects from the query result.

:::

## Exposed Variables

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/list-view/exposedvars.png" alt="ToolJet - List view widget" />

</div>

| **Variables**    | **Description** |
| ----------- | ----------- |
| **data** | This variable stores the data loaded into the list view component. You can retrieve the data of each record in the list view using `{{components.listview1.data["0"].text1.text}}` |
| **selectedRowId** (deprecated) | This variable holds the ID of the clicked row in the list view. The row ID starts from `0`. You can access the selectedRowId using `{{components.listview1.selectedRowId}}` |
| **selectedRow** (deprecated) | This variable contains the data of the components within the selected row. You can access the data using `{{components.listview1.selectedRow.text1}}` |
| **selectedRecordId** | This variable holds the ID of the clicked record in the list view. The record ID starts from `0`. You can access the selectedRecordId using `{{components.listview1.selectedRecordId}}` |
| **selectedRow** | This variable stores the data of the components within the selected record. You can access the data using `{{components.listview1.selectedRecord.text1}}` |

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
