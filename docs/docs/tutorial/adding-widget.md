---
sidebar_position: 5
---

# Adding a widget

To add a widget, navigate to the `Widget manager` on the right sidebar. It will display the list of built-in widgets that can be added to the app. Use the search functionality to quickly find the widget that you want. 

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Adding a widget](/img/tutorial/adding-widget/widget.png)

</div>

## Drag and drop a widget
Let's add a `table` widget to the app to show the customer data from the query that we created in the previous steps.
To add a widget, drag and drop the widget to the canvas.

## Resize a widget
The widgets can be resized and repositioned within the canvas.

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Adding a widget](/img/tutorial/adding-widget/resize.gif)

</div>

## Adding widgets to Modal
To add a widget to Modal, we need to trigger [Show modal action](/docs/tutorial/actions#available-actions)

:::info
Before triggering `Show modal action` we need to add a modal widget to the canvas.
:::

- Add a `modal widget` to the app
- Trigger the **Show modal action**
- Click on the canvas area for the `Widget manager` sidebar
- Navigate to the Widget manager on the right sidebar and Drag and drop a widget into the Modal 

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Adding a widget](/img/tutorial/adding-widget/modal.gif)

</div>

## Resize table columns
We can resize the column width using the resize handle of the column.

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Adding a widget](/img/tutorial/adding-widget/resize-table-column.gif)

</div>

## Change widget properties
Click on the widget to open the inspect panel on right sidebar. Here you can change the properties of the widgets. Let's configure the table columns to display the customer data. The display order of columns can be changed by dragging icon near the column name.

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Adding a widget](/img/tutorial/adding-widget/inspect-panel.gif)

</div>

## Connecting data with widget 
Now we will connect the `data` object of the `fetch customers` query with the table. Click on the table widget to open the inspector on right sidebar. We can see that the data property of the table have an empty array as the value. The data field, like almost every other field on the editor supports single-line javascript code within double brackets. Variable suggestions will be shows as a dropdown while you type the code in the field.

Let's select `data` object of the 'postgresql' query.

` {{queries.postgresql1.data}}`

Since we have already run the query in previous step, the data will be immediately displayed in the table.

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Adding a widget](/img/tutorial/adding-widget/table-data.png)

</div>

So far in this tutorial, we have connected to a PostgreSQL database and displayed the data on a table.

:::tip
Read the widget reference of table [here](/docs/widgets/table) for more customizations such as server-side pagination, actions, editing data.
:::