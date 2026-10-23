---
id: table-properties
title: Table Properties
slug: /widgets/table/
---

The **Table** component displays and manages data, connecting seamlessly with databases and APIs. It allows users to view and edit data directly within the table. This document goes through all the properties related to the **Table** component.

<img className="screenshot-full img-full" src="/img/widgets/table/table-preview-v3.png" alt="ToolJet - Component Reference - Table Preview" />

## Data

To populate the **Table** component with data, you need to provide the data in the form of an array of objects under its **Data** property. You can utilize data from queries by referring query data to populate the **Table**.

The **Table** component will **automatically generate all the required columns** when the data is provided. The **Table** also loads one level of **nested data**.

Example - Passing an array:

```js
{
  {
    [
      {
        id: 1,
        name: "Sarah",
        email: "sarah@example.com",
        contact: { number: 8881212, address: "25, Huntley Road, Newark" },
      },
    ];
  }
}
```

Example - Passing a query data:

```js
{
  {
    queries.restapi1.data;
  }
}
//replace restapi1 with your query name
```

## Columns

Go to the **[Table Columns](/docs/widgets/table/table-columns)** guide to know more about supported column types.

## Action Buttons (Deprecated)

:::warning
**Action Buttons are deprecated** and may be removed in an upcoming release. It is recommended to use the **[Button column type](/docs/widgets/table/table-columns#button)** instead, which supports multiple button columns, icons, tooltips, loading states, and conditional visibility per row.
:::

<img className="screenshot-full img-full" src="/img/widgets/table/action-v3.png" alt="ToolJet - Component Reference - Actions" />

<br/><br/>

Action buttons are positioned in the Table's final column. These buttons' appearance can be customized, and specific actions can be defined for when they are clicked using the `On click` action. Upon clicking an action button, the `selectedRow` exposed variable of the Table is updated to reflect the data of the selected row.

Below are the button text properties that you can set.

| <div style={{ width:"170px"}}> Property </div> | Description                                                                                                                                                                                                                                                   |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button text                                    | Sets the text that you want to be displayed on the action button.                                                                                                                                                                                             |
| Button position                                | Sets the button position to left or right.                                                                                                                                                                                                                    |
| Background color                               | Sets the background color of the action button.                                                                                                                                                                                                               |
| Text color                                     | Sets the color of button-text of the action button.                                                                                                                                                                                                           |
| Disable Action Button                          | Toggle on to disable the action button. You can programmatically set its value by clicking on the **fx** button next to it, if set to `{{true}}`, the action button will be disabled and becomes non-functional. By default, its value is set to `{{false}}`. |
| New event handler                              | The **New event handler** button lets you create an event handler to define behavior for action buttons based on the `On click` action.                                                                                                                       |

## Events

| <div style={{ width:"150px"}}> Event </div> | Description                                                                                                                                                                                                     |
| :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row hovered                                 | This event is activated when the mouse pointer hovers over a row. The `hoveredRowId` variable captures the ID of the hovered row, and the `hoveredRow` variable stores the row's data in object format.         |
| Row clicked                                 | This event is triggered when a Table row is clicked. The `selectedRowId` and `selectedRow` exposed variables of the Table store the ID and data of the selected row, respectively.                              |
| Save changes                                | If any cell of the Table is edited, the **Save changes** button appears at the footer of the Table. Save changes event is triggered when this button is clicked.                                                |
| Page changed                                | If server-side pagination is enabled, this event is fired when the current page is changed. Page changed event is triggered after updating the `pageIndex` variable.                                            |
| Next page                                   | Fired specifically when the user navigates to the **next** page. Use this instead of **Page changed** when you need to distinguish forward navigation from backward navigation in server-side pagination.        |
| Previous page                               | Fired specifically when the user navigates to the **previous** page. Use this instead of **Page changed** when you need to distinguish backward navigation from forward navigation in server-side pagination.    |
| Search                                      | Search event is triggered when a text is entered to the search input box of the Table. `searchText` variable is updated before triggering this event.                                                           |
| Cancel changes                              | If any cell of the Table is edited, the **Discard changes** button appears at the footer of the Table. Cancel changes event is triggered when this button is clicked.                                           |
| Sort applied                                | This event is triggered when the column name header is clicked to apply sorting. The `sortApplied` variable is updated with an object having `column` and `direction` values.                                   |
| Cell value changed                          | If any cell of the Table is edited, the cell value changed event is triggered.                                                                                                                                  |
| Filter changed                              | Triggeres when filter is added, removed, or updated. `filters` variable of the Table is updated to reflect the status of filters applied. The objects will have properties: `condition`, `value`, and `column`. |
| Add new rows                                | Triggeres when the **Save** button is clicked from the Add new row modal.                                                                                                                                       |
| Row expanded                                | Fired when a row is expanded. The `lastExpandedRow` and `currentExpandedRows` exposed variables are updated before this event fires.                                                                            |
| Refresh                                     | Fired when the refresh button is clicked. If the Table's **Data** property is bound to a query, that query is re-run first; the event fires once it completes. If data comes from a variable or other source, the event fires immediately — use it to run any custom logic or update the data source manually. |
| Header clicked                              | Fired when a column header is clicked. The `selectedColumnHeader` exposed variable is updated with the clicked column's `key`, `name`, and `index` before this event fires.                                     |

## Row Selection

| <div style={{ width:"200px"}}> Property </div> | Description                                                                                                                                       |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Allow selection                                | Enables row selection using checkboxes. Disabling it removes row highlighting and bulk selection options.                                         |
| Highlight selected row                         | Highlights the last clicked row. Replaces checkbox selection with visual highlight.                                                               |
| Disable row deselection                        | When enabled, clicking a selected row again will **not** deselect it. The user can still deselect via the checkbox. If multi-select is off, selecting a new row will deselect the previously selected one. |
| Bulk selection                                 | Allows selecting multiple rows on the current page. Selected values are stored in the selectedRows variable.                                      |
| Default selected row                           | Pre-selects a row when Allow selection is enabled. Use a key-value object like `{"id": variables.x}` where x is a valid variable that returns ID. |
| Select row on cell edit                        | Automatically selects the row being edited if column is editable. Disable to prevent auto-selection during editing.                               |

## Expandable Rows

Expandable rows let end users reveal additional content beneath a row — such as a nested table, a form, or a detailed view — without leaving the current page.

| <div style={{ width:"170px"}}> Property </div> | Description                                                                                                                                 |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| Enable expandable rows                         | Toggles expandable rows on or off. When enabled, each row shows a chevron icon that the user can click to expand or collapse the row.       |
| Expansion height                               | Sets the height (in pixels) of the expanded content area. Defaults to 300 px.                                                               |

When a row is expanded, you can drag components into the expanded container from the component panel. All components inside the expanded area have access to **`rowData`** — a resolvable variable that holds the data of the row they belong to, similar to `listItem` in a List View.

**Exposed variables updated on expand:**

| Variable             | Description                                                                    |
| :------------------- | :----------------------------------------------------------------------------- |
| `lastExpandedRow`    | The index of the most recently expanded row.                                   |
| `currentExpandedRows` | An array of indices of all currently expanded rows.                            |

Use the **Row expanded** event to run a query or trigger an action whenever a row is expanded.

## Search, Sort and Filter

<img className="screenshot-full img-s" src="/img/widgets/table/searchsort-v2.png" alt="ToolJet - Component Reference - Table" />

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

The pagination footer always shows **First**, **Previous**, **Next**, and **Last** page buttons directly in the table footer — no more hunting through overflow menus.

#### Server-side pagination

Server-side pagination can be used to run a query whenever the page is changed. Under events section, you can use the `Page changed` event to execute a query along with the `pageIndex` exposed variable. `pageIndex` can be used to query the next set of results when the page is changed. Use the **Next page** and **Previous page** events when you need to distinguish the direction of navigation.

When Server-side pagination is enabled, you'll be able to set the following additional Table properties:

- **Enable previous page button**: Toggle this off to disable the previous page button from the Table.
- **Enable next page button**: Toggle this off to disable the next page button from the Table.
- **Total records server side**: Set the total number of records on the server. Used to compute page count.
- **Server-side rows per page**: Set the number of records fetched per page from the server. When both this and **Total records server side** are provided, the Table calculates and displays the total page count and enables **First** and **Last** page navigation.

:::tip
Check this how-to guide to learn more about **[server-side pagination](/docs/widgets/table/serverside-operations/pagination)**.
:::

## Additional Actions

| <div style={{ width:"210px"}}> Property </div> | Description                                                                                                                                                                                                  |
| :--------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Show add new row button                        | Shows a button to add new rows via a modal. New data is stored in `newRows`. Use the `Add new rows` event to save to a data source.                                                                          |
| Show download button                           | Enables download of Table data as CSV, Excel, or PDF. Filename format: `Tablename_DD-MM-YYYY_HH-mm.filetype`.                                                                                                |
| Show refresh button                            | Shows a refresh icon in the table footer. If the Table’s **Data** property is bound to a query, clicking the button reruns that query. If data comes from a variable or other source, no query is re-run — use the **Refresh** event instead to run any custom update logic. A loading indicator is shown while any query is in progress. |
| Hide column selector button                    | Controls visibility of the column selector, which lets users choose visible columns.                                                                                                                         |
| Loading state                                  | Shows a loading skeleton while data is loading. Bind it to the query’s `isLoading` property.                                                                                                                 |
| Show update buttons                            | Displays **Save changes** and **Discard changes** buttons when any cell is edited.                                                                                                                           |
| Visibility                                     | Controls whether the Table is visible on the canvas. Can be toggled dynamically.                                                                                                                             |
| Disable                                        | Disables interactivity of the Table when toggled off. Still visible but not usable.                                                                                                                          |
| Dynamic height                                 | Automatically adjusts the component’s height based on its content.                                                                                                                                           |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                 | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Column Header

| <div style={{ width:"105px"}}> Style Property </div> | Description                                 | Configuration Options                             |
| :--------------------------------------------------- | :------------------------------------------ | :------------------------------------------------ |
| Column title                                         | Set the color for column title.             | Select a theme or choose color from color picker. |
| Overflow                                             | Select the overflow type.                   | Choose from **None** or **Wrap**.                 |
| Header casing                                        | Select the header casing type.              | Choose from **As typed** or **AA**.               |
| Background                                           | Set the background color for column header. | Select a theme or choose color from color picker. |

### Data

| <div style={{ width:"160px"}}> Style Property </div> | Description                                                                             | Configuration Options                                            |
| :--------------------------------------------------- | :-------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| Text                                                 | Set the text color of the component.                                                    | Select a theme or choose color from color picker.                |
| Row style                                            | Selects the style of the table rows.                                                    | Choose from dropdown: **Bordered**, **Regular**, or **Striped**. |
| Cell height                                          | Determines the size of the table cells.                                                 | Choose between **Condensed** or **Regular** size.                |
| Max row height                                       | Controls the maximum height of rows when **Content wrap** is enabled.                   | Select **Auto** or define a **Custom** size.                     |
| Selected row color                                   | Sets the highlight color of the selected row. Overrides the default selection highlight. | Select a theme or choose color from color picker.                |
| Action button radius                                 | Sets the radius for all action buttons.                                                 | Enter a value (default is **0**).                                |

:::note
For **Custom Max Row Height**, the minimum value depends on the Cell height setting:

- When **Cell Height** is set to **Regular**, the minimum height is **45 px**.
- When **Cell Height** is set to **Condensed**, the minimum height is **39 px**.
  :::

### Container

| <div style={{ width:"110px"}}> Style Property </div> | Description                                      | Configuration Options                                                                         |
| :--------------------------------------------------- | :----------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| Background                                           | Set the background color for the table.          | Select a theme or choose color from color picker.                                             |
| Border radius                                        | Adds a radius to the borders of the table.       | Enter a value (default is **6**).                                                             |
| Border                                               | Defines the border color of the Table.           | Select a theme or choose color from color picker.                                             |
| Box shadow                                           | Sets the box shadow properties of the component. | Select the box shadow color, adjust related properties, or set programmatically using **fx**. |
| Padding                                              | Sets padding inside table.                       | Choose between **Default** or **None**.                                                       |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
