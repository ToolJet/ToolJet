---
id: table
title: Table
---
# Table

Tables can be used for both displaying and editing data.

<iframe height="500" src="https://www.youtube.com/embed/hTrdkUtz3aA" title="ToolJet Table Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Table data

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/data.png" alt="ToolJet - Widget Reference - Table" width="400" />

</div>

Array of objects to be displayed on the table. It is commonly used to display data from query (`{{queries.restapi1.data}}`). Table data expects an array of objects, example: 

```
{{[{ id: 1, name: 'Sarah', email: 'sarah@example.com'}]}}
```

The table component will **auto-generate all the columns** as soon as the expected table data(array of objects) is provided.

## Columns

Whenever data is loaded into a table, the columns are automatically generated. You can add, remove, or modify columns by accessing the table properties under the column section.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/columntypes.png" alt="ToolJet - Widget Reference - Table" />

</div>

### Types of Columns

The table provides different column types based on the data being displayed:

- [String | Default](#string--default)
- [Number](#number)
- [Badge](#badge)
- [Multiple Badges](#multiple-badges)
- [Tags](#tags)
- [Dropdown](#dropdown)
- [Radio](#radio)
- [Multiselect](#multiselect)
- [Toggle switch](#toggle-switch)
- [Date Picker](#date-picker)
- [Image](#image)

#### String | Default

This column type is selected by default when a column is added or when data is auto-populated in the table.

#### Number

Selecting the column type as "Number" will only load numerical data in the column cells.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/numbertype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Badge

The "Badge" column type is used to display labels on the columns using the column data. The "Badge values" and "Badge labels" should be provided as an array.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/badgetype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Multiple Badges

Similar to the "Badge" column type, this type is used to display multiple badges in the column cell. The "Values" and "Labels" should be provided as arrays.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/multibadgetype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Tags

The "Tags" column type is used to show tags in the column cells using the column data. The "key" provided should have values in an array.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/tagtype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Dropdown

The "Dropdown" column type is used to show a dropdown in the column cells using the column data. The "Values" and "Labels" should be provided as arrays.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/droptype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Radio

The "Radio" column type is used to show radio buttons in the column cells using the column data. The "Values" and "Labels" should be provided as arrays.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/radiotype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Multiselect

The "Multiselect" column type is used to show a multiselect dropdown in the column cells using the column data. The "Values" and "Labels" should be provided as arrays.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/multiselecttype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Toggle Switch

The "Toggle Switch" column type is used to show a toggle switch in the column cells using the column data. The "key" provided should be a boolean value, either true or false.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/toggletype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Date Picker

The "Date Picker" column type is used to show a date picker in the column cells using the column data.

The "key" provided should be a date value.

The "Date Display Format" determines how the date should be displayed in the table.

The "Date Parse Format" is the format in which the date is stored in the database.

The "Parse in timezone" is the timezone of the time stored in the database.

The "Display in timezone" is the timezone in which the date should be displayed.

"Parse in timezone" and "Display in timezone" are only required when the "Show time" option is enabled for the column.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/datetype.png" alt="ToolJet - Widget Reference - Table" />

</div>

#### Image

The "Image" column type is used to display images in the column cells using the column data. The cell value of this column should be a URL of the image, and it will be displayed in the cell.

By default, when an image is loaded in the column, its width is set to 100%. The border radius, width, and height of the image can be adjusted in the column properties.

The "Object fit" option allows you to choose how the image should be fitted within its container. The options are:

- "Cover": maintains the aspect ratio of the image but may crop or clip parts of it to cover the container's width.
- "Contain": maintains the aspect ratio and resizes the image to fit within the given dimensions while displaying the entire image.
- "Fill": stretches the image to cover 100% of the width.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/imagetype.png" alt="ToolJet - Widget Reference - Table" />

</div>

:::info
Check this **[how-to guide](/docs/how-to/access-cellvalue-rowdata)** on dynamically change the color of text in a row and column in the table.
:::

### Displaying Data

The data object should be an array of objects. Table columns can be added, removed, rearranged from the inspector. `key` property is the accessor key used to get data from a single element of a table data object. For example:

If the table data is:

```js
[
    {
        "review": {
            "title": "An app review"
        },
    "user": {
            "name": "sam",
            "email": "sam@example.com"
        },
    }
]
```

To display email column, the key for the column should be `user.email`.


### Saving data
Enable `editable` property of a column to make the cells editable. If a data type is not selected, `string` is selected as the data type.

:::tip
You can programmatically **enable**/**disable** the make **editable** field in the columns property by clicking on the **Fx** button.
:::

If the data in a cell is changed, `changeSet` property of the table object will have the index of the row and the field that changed.
For example, if the name field of second row of example in the 'Displaying Data' section is changed, `changeSet` will look like this:

```js
{
    2: {
        "name": "new name"
    }
}
```

Along with `changeSet`, `dataUpdates` property will also be changed when the value of a cell changes. `dataUpdates` will have the whole data of the changed index from the table data. `dataUpdates` will look like this for our example:

```js
[{
    "review": {
        "title": "An app review"
    },
    "user": {
        "name": "new name",
        "email": "sam@example.com"
    },
}]
```

If the data of a cell is changed, "save changes" button will be shown at the bottom of the table. This button when clicked will trigger the `Bulk update query` event. This event can be used to run a query to update the data on your data source.

### Use dynamic column

Enabling the **Use dynamic column** toggle will allow users to set the **Column data** where users can link the column data dynamically from a query. 

The **column data** field expects a JSON value:
```json
{
   "name":"Name",
   "columnType":"string",
   "key":"first_name",
   "cellBackgroundColor":"#000",
   "textColor":"#fff",
   "isEditable":true,
   "regex":"",
   "maxLength":10,
   "minLength":5,
   "customRule":""
}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/dynamic_column.png" alt="ToolJet - Widget Reference - Table" />

</div>

## Validation

Under column properties, expand the detailed view of a column type to access a toggle button called `make editable`. You can toggle it `ON` to apply the validations for each column respectively using the following.

### Regex

Use this field to enter a Regular Expression that will validate the password constraints.
### Min length

Enter the number for a minimum length of password allowed.

### Max length

Enter the number for the maximum length of password allowed.

### Custom validation

If the condition is true, the validation passes, otherwise return a string that should be displayed as the error message. For example: `{{components.passwordInput1.value === 'something' ? true: 'value should be something'}}`

## Action buttons

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/table/action2.png" alt="ToolJet - Widget Reference - Table" width="800" />

</div>

Action buttons will be displayed as the last column of the table. The styles of these buttons can be customised and `on click` actions can be configured. when clicked, `selectedRow` property of the table will have the table data of the row.

| Property | Description |
| -------- | ------------ |
| Button text | Set the text that you want to be displayed on the action button. |
| Button position | Set the button position to the left or right |
| Background color (Action Button) | Background color of the action button. |
| Text color (Action Button) | Color of button-text of the action button. |
| Disable Action Button | Toggle on to disable the action button. You can programmatically set its value by clicking on the `Fx` button next to it, if set to `{{true}}`, the action button will be disabled and becomes non-functional. By default, its value is set to `{{false}}`. |

## Options

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

### Server-side pagination

Server-side pagination can be used to run a query whenever the page is changed. Go to events section of the inspector and change the action for `on page changed` event. Number of records per page needs to be handled in your query. If server-side pagination is enabled, `pageIndex` property will be exposed on the table object, this property will have the current page index. `pageIndex` can be used to query the next set of results when page is changed.

When Server-side pagination is enabled, you'll be able to set three other table properties:
- **Enable previous page button**: When server-side pagination is enabled, this button is enabled by default. Toggle this off to disable the previous page button from the table.
- **Enable next page button**: When server-side pagination is enabled, this button is enabled by default. Toggle this off to disable the next page button from the table.
- **Total records server side**: Set a numerical value to display particular number of records.

### Client-side pagination

Client-side pagination is enabled by default. When the client-side pagination is enabled(`{{true}}`), another property **Number of rows per page** will be shown that can be used to set the number of records per page. By default, the value is set to 10 and if it is disabled(`{{false}}`) then it will show all the records in the single page.

### Server-side search

If server-side search is enabled, `on search` event is fired after the content of `searchText` property is changed. `searchText` can be used to run a specific query to search for the records in your data source.

### Show download button

Show or hide download button at the Table footer.

### Hide/Show columns

Table header has an option(Eye icon) to show/hide one or many columns on the table. 

### Show filter button

Show or hide filter button at the Table header. The following filters are available:
- **contains**
- **does not contain**
- **matches**
- **does not match**
- **equals**
- **does not equal to**
- **is empty**
- **is not empty**
- **greater than**
- **greater than or equal to**
- **less than**
- **less than or equal to**


### Show update buttons

It's enabled by default. Table footer will show two update buttons **Save changes** & **Discard changes** whenever a cell is edited. Toggle `off` to hide update buttons.

### Bulk selection

To let the user select one or more rows from the current page of a table, enable 'Bulk selection' from the inspector. The values of selected rows will be exposed as `selectedRows`.

### Highlight selected row

Enable this option to have the last selected(clicked on) row to be highlighted.

### Disable sorting

Enable this option to lock the sorting of columns when clicked on column name.

### Server-side sort
When Server-side sort is enabled, clicking on the column headers will not automatically sort the table, instead, the `Sort applied` event will be fired and the applied sorting will be exposed as `sortApplied`. You can use this data to run any query that feeds data to the table in a manner that reflects the sorting applied.

### Server-side filter
When Server-side filter is enabled, applying filters will not automatically filter the table, instead, the `Filter changed` event will be fired and the applied filters will be exposed as `filters`. You can use this data to run any query that feeds data to the table in a manner that reflects the filters applied.

### Show search box

It can be used to show or hide Table Search box. Client-side search is enabled by default and server-side search can be enabled from the events section of the inspector. Whenever the search text is changed, the `searchText` property of the table component is updated. If server-side search is enabled, `on search` event is fired after the content of `searchText` property is changed. `searchText` can be used to run a specific query to search for the records in your data source.

If you don't wish to use the search feature altogether, you can disable it from the inspector.

### Loading state (Boolean)

Loading state shows a loading skeleton for the table. This property can be used to show a loading status on the table while data is being loaded. `isLoading` property of a query can be used to get the status of a query.

## Events

- **[Row hovered](#row-hovered)**
- **[Row clicked](#row-clicked)**
- **[Save changes](#save-changes)**
- **[Cancel changes](#cancel-changes)**
- **[Page changed](#page-changed)**
- **[Search](#search)**
- **[Sort applied](#sort-applied)**
- **[Cell value changed](#cell-value-changed)**
- **[Filter changed](#filter-changed)**

### Row hovered

This event is triggered when the mouse pointer is moved over a row in the table. The `hoveredRowId` exposed variable of the table will include the id of the latest hovered row and `hoveredRow` property of the table will have the data of the hovered row in the object format.

### Row clicked

This event is triggered when a table row is clicked. The `selectedRowId` exposed variable of the table will include the id of the selected row and the `selectedRow` property of the table object will have the table data of the selected row.

### Save changes

If any cell of the table is edited, the `save changes` button appears at the footer of the table. Save changes event is triggered when this button is clicked.

### Cancel changes

If any cell of the table is edited, the `Discard changes` button appears at the footer of the table. Cancel changes event is triggered when this button is clicked.

### Page changed

If server-side pagination is enabled, this event is fired when the current page is changed. This event is triggered after updating the `pageIndex` variable.

### Search

This event is triggered when a text is entered to the search input box of the table. `searchText` variable is updated before triggering this event.

### Sort applied

This event is triggered when the column name header is clicked to apply sorting in `asc` or `desc`. The `sortApplied` variable is updated with an object having `column` and `direction` values.

### Cell value changed

If any cell of the table is edited, the `cell value changed` event is triggered.

### Filter changed

This event is triggered when filter is added, removed, or updated from the filter section of the table. `filters` property of the table is updated to reflect the status of filters applied. The objects will have properties: `condition`, `value`, and `column`. 

## Exposed variables

| variable      | description |
| ----------- | ----------- |
| currentData      | Data that is currently being displayed by the table ( including edits if any ) |
| currentPageData  | Data that is displayed on the current page if pagination is enabled ( including edits if any )      |
| pageIndex | Index of the current page, starting from 1
| changeSet | Object with row number as the key and object of edited fields and their values as the value |
| dataUpdates | Just like changeSet but includes the data of the entire row |
| selectedRow | The data of the row that was last clicked. `selectedRow` also changes when an action button is clicked |
| searchText | The value of the search field if server-side pagination is enabled |

## Styles

| Style      | Description |
| ----------- | ----------- |
| Text color | Change the color of the text in table by providing `hex color code` or choosing one from the picker |
| Action button radius | This field can be used to give a radius to all action buttons. The default value is `0` |
| Table type | Select a type of table from the dropdown. |
| Cell size |  This decides the size of table cells. You can choose between a `Compact` size for table cells or a `Spacious` size |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not visible after the app is deployed. By default, it's set to `{{true}}`. |
| Disable | Toggle on to lock the widget. You can programmatically change its value by clicking on the `Fx` button next to it, if set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |
| Border radius | Use this property to modify the border radius of the button. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::


## Component specific actions (CSA)

Following actions of color picker component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| ----------- | ----------- |
| setPage | Set the page on the table via component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.table1.setPage(2)` |
| selectRow | Select the row on the table using via component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.table1.selectRow('id','11')` |
| deselectRow | Deselect the row on the table via component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.table1.deselectRow()` |
| discardChanges | Discard the changes from the table when a cell is edited via component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.table1.discardChanges()` |
| discardNewlyAddedRows | Discard the newly added rows from the add new row popup on the table via component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.table1.discardNewlyAddedRows()` |