---
sidebar_position: 12
---

# Table

Tables can be used for both displaying and editing data.

<img class="screenshot-full" src="/img/widgets/table/adding.gif" alt="ToolJet - Widget Reference - Table" height="420"/>

## Displaying Data

The data object should be an array of objects. Table columns can be added, removed, rearranged from the inspector. `key` property is the accessor key used to get data from a single element of table data object. For example:

If the table data is:

```
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

## Cell data types

- String ( Default )
- Text
- Badge - can be used to display and edit predefined badges such as status of shipment.
- Multiple badges
- Tags - similar to badges but the values are not predefined.
- Dropdown
- Multiselect dropdown
- Toggle switch

## Client-side pagination

Client-side pagination is enabled by default. The number of records per page is 10 by default and can be changed to upto 50.

## Server-side pagination

Server-side pagination can be used to run a query whenever the page is changed. Go to events section of the inspector and change the action for `on page changed` event. Number of records per page needs to be handled in your query. If server-side pagination is enabled, `pageIndex` property will be exposed on the table object, this property will have the current page index. `pageIndex` can be used to query the next set of results when page is changed.

## Search
Client-side search is enabled by default and server-side search can be enabled from the events section of the inspector. Whenever the search text is changed, the `searchText` property of the table component is updated. If server-side search is enabled, `on search` event is fired after the content of `searchText` property is changed. `searchText` can be used to run a specific query to search for the records in your datasource.

If you don't wish to use the search feature altogether, you can disable it from the inspector.

## Event: On row clicked

This event is triggered when a table row is clicked. `selectedRow` property of the table object will have the table data of the selected row.

## Actions
Actions are buttons that will be displayed as the last column of the table. The styles of these buttons can be customised and `on click` actions can be configured. when clicked, `selectedRow` property of the table will have the table data of the row.

## Property: Loading state (Boolean)
Loading state shows a loading skeleton for the table. This property can be used to show a loading status on the table while data is being loaded. `isLoading` property of a query can be used to get the status of a query.

## Saving data
Enable `editable` property of a column to make the cells editable. If a data type is not selected, `string` is selected as the data type.

If the data in a cell is changed, `changeSet` property of the table object will have the index of the row and the field that changed.
For example, if the name field of second row of example in the 'Displaying Data' section is changed, `changeSet` will look like this:

```
{
    2: {
        "name": "new name"
    }
}
```

Along with `changeSet`, `dataUpdates` property will also be changed when the value of a cell changes. `dataUpdates` will have the whole data of the changed index from the table data. `dataUpdates` will look like this for our example:

```
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

If the data of a cell is changed, "save changes" button will be shown at the bottom of the table. This button when clicked will trigger the `Bulk update query` event. This event can be used to run a query to update the data on your datasource.

#### Exposed variables

| variable      | description |
| ----------- | ----------- |
| currentData      | Data that is currently being displayed by the table ( including edits if any ) |
| currentPageData  | Data that is displayed on the current page if pagination is enabled ( including edits if any )      |
| pageIndex | Index of the current page, starting from 1
| changeSet | Object with row number as the key and object of edited fields and their values as the value |
| dataUpdates | Just like changeSet but includes the data of the entire row |
| selectedRow | The data of the row that was last clicked. `selectedRow` also changes when an action button is clicked |
| searchText | The value of the search field if server-side paginaton is enabled |

#### Events

| events      | description |
| ----------- | ----------- |
| Row clicked | Triggered when a table row is clicked. This event is triggered after `selectedRow` variable is changed. |
| Bulk update | If any cell of the table is edited, the `save changes` button appears at the footer of the table. Bulk update event is triggered when this button is clicked. |
| Page changed | If server-side pagination is enabled, this event is fired when the current page is changed. This event is triggered after updating the `pageIndex` variable.|
| Search | This event is triggered when a text is entered to the search field of the table. `searchText` variable is updated before triggering this event. |

#### Properties

| properties      | description |
| ----------- | ----------- |
| Data |  Refer your query data with dynamic variables `{{queries.restapi1.data}}`or populate it with sample data `{{[{ id: 1, name: 'Sarah', email: 'sarah@example.com'}]}}` |
| Loading state | It can be used to show a loading status on the table while data is being loaded. Default value is `false` .|
| Server-side pagination | Server-side pagination can be used to run a query whenever the page is changed. If enabled, `pageIndex` property will be exposed on the table object, this property will have the current page index. |
| Client-side pagination | Client-side pagination is enabled by default. The number of records per page is 10 by default and can be changed to upto 50. |
| Server-side search | If server-side search is enabled, `on search` event is fired after the content of `searchText` property is changed. `searchText` can be used to run a specific query to search for the records in your datasource. |
| Background color (Action Button) | We can use this property to change the background color of the action button. |
| Text color (Action Button) | We can use this property to change the color of button-text of the action button. |
| Show search box | It can be used to show or hide Table Search box. |
| Show download button | It can be used to show or hide download button at the Table footer. |
| Show filter button | It can be used to show or hide filter button at the Table footer. |
