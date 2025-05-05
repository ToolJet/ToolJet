---
id: component-properties
title: Component Properties
---

Using **Component Properties**, you can define how a component looks, behaves, or interacts with the application. Each component has its own set of properties based on its functionality.

This guide provides an overview of component properties using a few example components. For detailed information on any specific component and its properties, refer to the [individual component guide](#).

## Text Input

Using the component properties of the **Text Input** component, you can customize its appearance, define validation rules for the input, and control how it interacts with the rest of the application. You can define the following properties:

- **Label**: Defines the text label displayed alongside the input field.
- **Placeholder**: Displays example text inside the input field when it is empty, offering users a hint about the type of input required.
- **Default Value**: The default value that the component will hold when the app is loaded.
- **Events**: By configuring event properties, you can make the component perform certain tasks when a defined interaction occurs. For example, run a query when the user enters input, or reset a form when the input changes.
- **Validation**: Validation properties allow you to add a layer of input checking to ensure data quality and enforce rules before submission. For example, making the field mandatory, adding a regex to validate input or define minimum or maximum numbers of characters allowed.
- **Styles**: Define visual attributes like colors, spacing, alignment, and border radius to adjust how the component appears.

## Table

Using the component properties of the **Table** component, you can define how data is presented, how users interact with rows and columns, and what actions are triggered during interaction.

- **Data**: Populate the table with data by entering an array of objects or dynamically fetching it through a query.
- **Columns**: Customize each column’s behavior and appearance — such as type, visibility, editability, and data transformation. You can also use dynamic columns.
- **Row Selection**: Enable features like single or bulk row selection, highlight selected rows, or set a default selection.
- **Action Buttons**: Add row-level action buttons and configure interactions to trigger queries, display alerts, and more.
- **Events**: By configuring event properties, you can make the component perform certain tasks when a defined interaction occurs. For example, show a modal, when a row is clicked.
- **Search, Sort, Filter, Pagination**: Control how users explore data, with support for both client-side and server-side processing.
- **Additional Actions**: Enable or disable buttons like add new row, download data, column selectors, or manage loading state, visibility or disability.
- **Styles**: Customize visual attributes like colors and spacing, or set layout-related properties such as column header type, row style, cell height, and maximum row height.

## Chart

Using the component properties of the **Chart** component, you can control how data is visualized, define the structure of the chart, and specify interactions.

- **Title**: Add a title to the chart.
- **Use Plotly JSON Schema**: Directly define the chart using Plotly's JSON configuration for advanced customization and layout control.
- **Chart Type**: Choose from a variety of supported chart types (e.g., bar, line, pie) to represent the data.
- **Chart Data**: Bind the component to the data by providing an array of object with "x" and "y" keys, or fetch data dynamically through a query. 
- **Events**: Configure actions to be triggered based on user interaction with the chart, such as opening a specified webpage when a user clicks on a data point.
