---
sidebar_position: 5
---

# Adding a widget

To add a widget, navigate to the 'insert' tab of right sidebar. It will display the list of built-in widgets that can be added to the app. Use the search functionality to quickly find the widget that you want. 

<img src="/img/tutorial/adding-widget/widgets.png" alt="ToolJet - Redis connection" height="720"/>

## Drag and drop a widget
Let's add a table widget to the app to show the customer data from the query that we built in previous steps.
To add a widget, drag and drop the widget to the canvas.

<img src="/img/tutorial/adding-widget/table.png" alt="ToolJet - Table component" height="320"/>

## Resize a widget
The widgets can be resized and repositioned within the canvas.

<img src="/img/tutorial/adding-widget/resize.gif" alt="ToolJet - Resizing widgets" height="320"/>

## Change widget properties
Click on the widget to open the inspect panel on left sidebar. Here you can change the properties of the widgets. Let's configure the table columns to display the customer data. The display order of columns can be changed by dragging icon near the column name.

<img src="/img/tutorial/adding-widget/columns.png" alt="ToolJet - Adding columns" height="320"/>

## Resize table columns
We can resize the column width using the resize handle of the column.

<img src="/img/tutorial/adding-widget/column-width.gif" alt="ToolJet - Resize column width" height="320"/>

## Connecting data with widget 
Now we will connect the `data` object of the `fetch customers` query with the table. Click on the table widget to open the inspector on right sidebar. We can see that the data property of the table have an empty array as the value. The data field, like almost every other field on the editor supports single-line javascript code within double brackets. Variable suggestions will be shows as a dropdown while you type the code in the field.

<img src="/img/tutorial/adding-widget/suggestions.png" alt="ToolJet - Code suggestions" height="280"/>

Let's select `data` object of the 'postgresql' query. 

The field will now look like this: 

<img src="/img/tutorial/adding-widget/field.png" alt="ToolJet - Code suggestions" height="80"/>

Since we have already run the query in previous step, the data will be immedietly displayed in the table.

<img src="/img/tutorial/adding-widget/table-data.png" alt="ToolJet - Table with data" height="280"/>

So far in this tutorial, we have connected to a PostgreSQL database and displayed the data on a table.