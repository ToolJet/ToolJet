---
sidebar_position: 5
---

# Adding a widget

To add a widget, navigate to the `insert` tab of right sidebar. It will display the list of built-in widgets that can be added to the app. Use the search functionality to quickly find the widget that you want. 

<img src="/img/tutorial/adding-widget/widgets.gif" alt="ToolJet - widgets list" height="420"/>

## Drag and drop a widget
Let's add a `table` widget to the app to show the customer data from the query that we created in the previous steps.
To add a widget, drag and drop the widget to the canvas.

## Resize a widget
The widgets can be resized and repositioned within the canvas.

## Resize table columns
We can resize the column width using the resize handle of the column.

<img class="screenshot-full" src="/img/tutorial/adding-widget/table.gif" alt="ToolJet - Table component" height="420"/>

## Change widget properties
Click on the widget to open the inspect panel on left sidebar. Here you can change the properties of the widgets. Let's configure the table columns to display the customer data. The display order of columns can be changed by dragging icon near the column name.

## Connecting data with widget 
Now we will connect the `data` object of the `fetch customers` query with the table. Click on the table widget to open the inspector on right sidebar. We can see that the data property of the table have an empty array as the value. The data field, like almost every other field on the editor supports single-line javascript code within double brackets. Variable suggestions will be shows as a dropdown while you type the code in the field.

Let's select `data` object of the 'postgresql' query. 

Since we have already run the query in previous step, the data will be immedietly displayed in the table.

<img class="screenshot-full" src="/img/tutorial/adding-widget/table-data.gif" alt="ToolJet - Table with data" height="420"/>

So far in this tutorial, we have connected to a PostgreSQL database and displayed the data on a table.