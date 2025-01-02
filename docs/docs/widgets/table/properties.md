---
id: table-properties
title: Properties
---

The Table component displays and manages data, connecting seamlessly with databases and APIs. It allows users to view and edit data directly within the table. This document goes through all the properties related to the Table component.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/table-preview-v2.png" alt="ToolJet - Component Reference - Table Preview" />

</div>

## Data
To populate the Table with data, you need to provide the data in the form of an array of objects under its `Data` property. You can utilize data from queries by referring query data to populate the Table. 

The Table component will **automatically generate all the required columns** when the data is provided. The Table also loads one level of **nested data**. 

Example - Passing an array:
```js
{{[{ id: 1, name: 'Sarah', email: 'sarah@example.com', contact:{number: 8881212, address: '25, Huntley Road, Newark'} }]}}
```

Example - Passing a query data:
```js
{{queries.restapi1.data}}
//replace restapi1 with your query name
```



## Columns

Go to the **[columns](/docs/widgets/table/table-columns)** section to read more about columns.

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

## Action Buttons

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/table/action-v2.png" alt="ToolJet - Component Reference - Actions" />
</div>

Action buttons are positioned in the Table's final column. These buttons' appearance can be customized, and specific actions can be defined for when they are clicked using the `On click` action. Upon clicking an action button, the `selectedRow` exposed variable of the Table is updated to reflect the data of the selected row.

Below are the button text properties that you can set. 

| Property | Description |
| :------- | :----------- |
| Button text | Sets the text that you want to be displayed on the action button. |
| Button position | Sets the button position to left or right. |
| Background color | Sets the background color of the action button. |
| Text color | Sets the color of button-text of the action button. |
| Disable Action Button | Toggle on to disable the action button. You can programmatically set its value by clicking on the **fx** button next to it, if set to `{{true}}`, the action button will be disabled and becomes non-functional. By default, its value is set to `{{false}}`. |
| New event handler | The **New event handler** button lets you create an event handler to define behavior for action buttons based on the `On click` action. |


## Events

You can trigger a range of events on the Table component.

- **[Row hovered](#row-hovered)**
- **[Row clicked](#row-clicked)**
- **[Save changes](#save-changes)**
- **[Page changed](#page-changed)**
- **[Search](#search)**
- **[Cancel changes](#cancel-changes)**
- **[Sort applied](#sort-applied)**
- **[Cell value changed](#cell-value-changed)**
- **[Filter changed](#filter-changed)**
- **[Add new rows](#add-new-rows)**

### Row hovered

This event is activated when the mouse pointer hovers over a row. The `hoveredRowId` variable captures the ID of the hovered row, and the `hoveredRow` variable stores the row's data in object format.

### Row clicked

This event is triggered when a Table row is clicked. The `selectedRowId` and `selectedRow` exposed variables of the Table store the ID and data of the selected row, respectively.

### Save changes

If any cell of the Table is edited, the **Save changes** button appears at the footer of the Table. Save changes event is triggered when this button is clicked.

### Page changed

If server-side pagination is enabled, this event is fired when the current page is changed. Page changed event is triggered after updating the `pageIndex` variable.

### Search

Search event is triggered when a text is entered to the search input box of the Table. `searchText` variable is updated before triggering this event.

### Cancel changes

If any cell of the Table is edited, the `Discard changes` button appears at the footer of the Table. Cancel changes event is triggered when this button is clicked.

### Sort applied

This event is triggered when the column name header is clicked to apply sorting in `asc` or `desc`. The `sortApplied` variable is updated with an object having `column` and `direction` values.

### Cell value changed

If any cell of the Table is edited, the cell value changed event is triggered.

### Filter changed

Filter event is triggered when filter is added, removed, or updated from the filter section of the Table. `filters` variable of the Table is updated to reflect the status of filters applied. The objects will have properties: `condition`, `value`, and `column`. 

### Add new rows

This event is triggered when the **Save** button is clicked from the **Add new row** modal on the Table. 

## Row Selection

### Allow selection

This option is active by default. **Enabling** this functionality allows users to choose a row in the Table by utilizing `checkboxes` placed next to each row. If this option is disabled, the ability to highlight selected rows and perform bulk selection will not be accessible. 

### Highlight selected row

Enable this option to visually emphasize the last clicked row. **Enabling** this feature will alter the row selection appearance of the Table from a `checkbox`-based theme to a `highlight`-based theme.

### Bulk selection

To enable the selection of one or more rows from the current page of a table, you can activate the `Bulk selection` setting in the inspector. The values of the selected rows will be available in the `selectedRows` exposed variable.

### Default selected row

Default selected row will only be available when the `Allow selection` property is enabled. 

To set a default selected row, you need to provide an object with a single key-value pair. For instance, you can use the `id` key and dynamically obtain the value from a variable, let's say `x`, to specify the default selected row in the Table. We assume that the variable `x` holds a valid numerical id.

Example:
```js
{{{"id": variables.x}}} //assuming variables.x is already set
```

Please ensure that the value provided in the object corresponds to an id in the Table to ensure proper functionality.

### Select row on cell edit
Enabling the `Make editable` property for a column allows the app users to edit the column. While editing, the related row will be selected by default. To stop the row from getting selected by default, turn off `Select row on cell edit`.

## Search, Sort and Filter

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/table/searchsort.png" alt="ToolJet - Component Reference - Table" /> 
</div>

### Show search

The Show search property controls the search box on the Table. Client-side search is enabled by default and server-side search can be enabled from the events section of the inspector. Whenever the search text is changed, the `searchText` exposed variable of the Table component is updated. 
 

#### Server-side search

If server-side search is enabled, `Search` event is fired after the content of `searchText` variable is changed. `searchText` can be used to run a specific query to search for the records in your data source.

### Enable column sorting

Disable this option to lock the sorting of columns when the users clicks on the column header.

#### Server-side sort
When server-side sort is enabled, clicking on the column headers will not automatically sort the table, instead, the `Sort applied` event will be fired and the applied sorting will be accessible in the `sortApplied` exposed variable. This information can be leveraged to execute queries that update the table content in accordance with the specified sorting.

### Enable filtering

The filter button in the Table header is visible by default. You can choose to hide it by disabling this option. 

The Table data can be filtered using the Filter data option on its top-left. You have the option to choose from various filters, such as:

- **contains**
- **does not contain**
- **matches**
- **does not match**
- **equals**
- **does not equal**
- **is empty**
- **is not empty**
- **greater than**
- **greater than or equal to**
- **less than**
- **less than or equal to**

#### Server-side filter
When Server-side filter is enabled, applying filters will not automatically filter the table, instead, the `Filter changed` event will be fired and the applied filters will be accessible in the `filters` exposed variables. This data can be utilized to execute queries that update the table content according to the applied filters.


## Pagination

Pagination helps manage the display of large data sets by dividing them into manageable segments. Client-side pagination is enabled by default. When enabled, an additional property, **Number of rows per page**, becomes available to set the number of records per page. The default value is set to 10; if disabled, all records will appear on a single page.

#### Server-side pagination

Server-side pagination can be used to run a query whenever the page is changed. Under events section, you can use the `Page changed` event to execute a query and along with the `pageIndex` exposed variable. `pageIndex` can be used to query the next set of results when page is changed.

When Server-side pagination is enabled, you'll be able to set three other Table properties:
- **Enable previous page button**: Toggle this off to disable the previous page button from the Table.
- **Enable next page button**: Toggle this off to disable the next page button from the Table.
- **Total records server side**: Set a numerical value to display particular number of records.

:::tip
Check this how-to guide to learn more about **[server-side pagination](/docs/how-to/use-server-side-pagination)**.
:::

## Additional actions

### Show add new row button

The **Add new row button** is located on the bottom-right of the Table is visible by default. You can choose to hide it by disabling this option.  

Upon clicking this button, a pop-up modal will show, providing users with the ability to insert new rows. If users input data into this row, it will be stored within the `newRows` exposed variable associated with the Table. Clicking on the **Discard** button will clear the data within this variable. However, if the users close the popup without any action (neither saving nor discarding), the data will persist. The Table incorporates an **Add new rows** event handler, which can be employed to execute queries that store the data into the data source upon clicking the **Save** button.


### Show download button
The download button in the Table footer is visible by default. You can choose to hide it by disabling this option. The download button allows users to download the Table data in three formats - CSV, Excel and PDF.

The name of the downloaded file will be in the following format: <br/>
`Tablename_DD-MM-YYYY_HH-mm.filetype` <br/><br/>
Example: <i>Customers_25-03-2022_16-10.csv</i>

### Hide column selector button

The column selector button on the Table footer is visible by default. You can choose to hide it by disabling this option. The column selector allows you define which columns you want to view on the Table.

### Loading state

Loading state shows a loading skeleton for the Table. This property can be used to show a loading status on the Table while data is being loaded. `isLoading` property of a query can be used to get the status of a query.

### Show update buttons

The update button is enabled by default. Table footer will show two update buttons **Save changes** and **Discard changes** whenever a cell is edited. Disable this option to hide update buttons.

### Visibility
Visibility condition allows you to control whether the Table is visible or hidden on the canvas. It is enabled by default and can be turned off to hide the Table. 

### Disable
Disable condition allows you to control whether the Table is enabled or disabled on the canvas. It is enabled by default and can be turned off to hide the Table. When disabled, the Table will not be interactive.

## Devices

| Property  | Description | Expected value |
|:----------- |:----------- |:----------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.|
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.|

## Styles
### Data
| Style Property  | Description | Configuration Options   |
|-----------------|------------------|--------------------|
| **Text color**  | Change the text color of the component.  | Provide a **hex color code**, choose from the picker, or set programmatically using **fx**.   |
| **Column header** | Defines how the column header text is displayed. | Choose between **Fixed** or **Wrap**. You can also set it programmatically using **fx**. |
| **Header casing** | Specifies the casing style for column headers. | Choose between **AA** or **As Typed**. You can also set it programmatically using **fx**. |
| **Row style**   | Selects the style of the table rows. | Choose from dropdown: **Bordered**, **Regular**, or **Striped**. You can also set it programmatically using **fx**. |
| **Cell height** | Determines the size of the table cells.  | Choose between **Condensed** or **Regular** size. You can also set it programmatically using **fx**.  |
| **Max row height** | Controls the maximum height of rows when **Content wrap** is enabled. | Select **Auto** or define a **Custom** size. You can also set it programmatically using **fx**. |

## Action Button
| Action     | Description     | Configuration Options    |
|:-------------------|:----------------|:-----------------------|
| **Button radius**  | Sets the radius for all action buttons. | Enter a value (default is **0**) or dynamically configure using **fx**. |


## Container
| Style Property | Description  | Configuration Options |
|:---------------|:-----------|:----------------------|
| **Border radius** | Adds a radius to the borders of the Table.  | Enter a value (default is **8**) or dynamically configure using **fx**. |
| **Border**        | Defines the border color of the Table.  | Change the color by providing a **hex color code**, choosing from the picker, or setting programmatically using **fx**. |
| **Box shadow**    | Sets the box shadow properties of the component.  | Select the box shadow color, adjust related properties, or set programmatically using **fx**. |
