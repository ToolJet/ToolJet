---
id: google.sheets
title: Google Sheets
---

# Google Sheets

ToolJet has the capability to establish a connection with Google Sheet for both reading and writing data. By utilizing OAuth 2.0, ToolJet can establish a secure connection with Google Sheet, ensuring that the application's access to a user's account is restricted and limited appropriately.

## Self-Hosted Configuration

If you decide to self-host ToolJet, there are a few additional steps you need to take:

1. Proceed with the setup steps provided in the [Google OAuth 2.0 guide](/docs/setup/env-vars#google-oauth--optional-) to configure the necessary settings.
2. Assign the corresponding values obtained from the previous step to the following environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `TOOLJET_HOST`
3. Activate the Google Sheets API within the Google Cloud Platform (GCP) console.

## Connection

To establish a connection with Google Sheet, you have two options. First, you can click on the **+Add new global datasource** button found on the query panel. Alternatively, you can go to the **[Global Datasources](/docs/data-sources/overview)** page within the ToolJet dashboard.

### Authorization Scopes

When connecting to a Google Sheets datasource, you can choose between two permission scopes:

1. **Read Only**: This scope allows you to access and retrieve data from the Google Sheet.
2. **Read and Write**: This scope grants you both read and write permissions, enabling you to retrieve and modify data within the Google Sheet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/sheetconnect-v2.png" alt="Google Sheet" />

</div>

## Querying Google Sheet

To perform operations on a Google Sheet, click the `+Add` button in the query manager located at the bottom panel of the app builder. Select the Google Sheet datasource under the Global datasource section. Choose the desired operation from the dropdown and click **Save** to save the query.

Using Google sheets data source you can perform several operations from your applications like:

  1. **[Read data from a sheet](/docs/data-sources/google.sheets#read-data-from-a-sheet)**
  2. **[Append data to a sheet](/docs/data-sources/google.sheets#append-data-to-a-sheet)**
  3. **[Update single row of a sheet](/docs/data-sources/google.sheets#update-single-row-of-a-sheet)**
  4. **[Delete row from a sheet](/docs/data-sources/google.sheets#delete-row-from-a-sheet)**
  5. **[Get spreadsheet info](/docs/data-sources/google.sheets#get-spreadsheet-info)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/operations.png" alt="Google Sheet Operations" />

</div>

### Read data from a sheet

This operation allows you to retrieve the table data from a spreadsheet in the form of a JSON object.

| Fields      | description |
| ----------- | ----------- |
| Spreadsheet ID | Entering the spreadsheet ID is required and can be obtained from the URL of the spreadsheet. For example, in the URL `https://docs.google.com/spreadsheets/d/1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM/edit#gid=0`, the `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM` represents the spreadsheet ID. |
| Range | This is optional. You can specify the range of cells in this field. If left empty, it will select the range `A1:Z500`. |
| Sheet | This is optional. You can specify `sheet name` if it has more than 1 sheets, else it will automatically choose the first sheet. |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/read-data-op.png" alt="Google Sheet Operations" />

</div>

### Append data to a sheet

Add additional rows to a table by using the append operation.

| Fields      | description |
| ----------- | ----------- |
| Spreadsheet ID | Entering the spreadsheet ID is required and can be obtained from the URL of the spreadsheet. For example, in the URL `https://docs.google.com/spreadsheets/d/1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM/edit#gid=0`, the `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM` represents the spreadsheet ID. |
| Sheet | This is optional. You can specify `sheet name` if it has more than 1 sheets, else it will automatically choose the first sheet. |
| Rows  | To input row data, use the JSON array format where each object represents a single row. Here's an example: **`[ {"name":"John", "email":"John@tooljet.com"},{...},{...} ]`**. Within each object, the `key` corresponds to the **column name**, and the `value` represents the **cell data**.|

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/append-data-op.png" alt="Google Sheet Operations" />

</div>

### Update single row of a sheet

This operation allows you to update existing data in a sheet.

| Fields      | description |
| ----------- | ----------- |
| Spreadsheet ID | Entering the spreadsheet ID is required and can be obtained from the URL of the spreadsheet. For example, in the URL `https://docs.google.com/spreadsheets/d/1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM/edit#gid=0`, the `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM` represents the spreadsheet ID. |
| Range | This is optional. You can specify the range of cells in this field. If left empty, it will select the range `A1:Z500`. |
| Sheet | This is optional. You can specify `sheet name` if it has more than 1 sheets, else it will automatically choose the first sheet. |
| Where | Specify the column name, such as `id`, to identify the row you want to update. |
| Operator | Select the `===` operator to perform an equality check. |
| Value | Enter the desired value for the `id`, which you want to update. |
| Rows | Enter the row data in the following format: **`{{({id: components.textinput4.value, company: components.textinput1.value, position: components.textinput2.value, url: components.textinput3.value, 'date-applied': components.datepicker1.value, status: components.dropdown1.value})}}`**. This example shows how to structure the row data, where each key represents a column name and its corresponding value is retrieved from the associated component. |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/upd.png" alt="Google Sheet Operations" />

</div>

### Delete row from a sheet

This operation allows you to delete a specific row from the sheet.

| Fields      | description |
| ----------- | ----------- |
| Spreadsheet ID | Entering the spreadsheet ID is mandatory. You can find the spreadsheet ID in the URL of the spreadsheet. For example, in the URL `https://docs.google.com/spreadsheets/d/1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM/edit#gid=23456`, the `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM` is the spreadsheet ID. |
| GID | The GID is located at the end of the spreadsheet URL. In the provided example, the GID is `23456`. |
| Delete Row Number | Simply enter the row number that you wish to delete. |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/del.png" alt="google sheets delete"/>

</div>

### Get spreadsheet info

The "Get spreadsheet info" operation allows you to retrieve basic information about the spreadsheet, including the number of sheets, theme, time zone, format, and URL, among others.

Here is a preview of the query that utilizes the "Get spreadsheet info" operation.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/infoo.png" alt="google sheets get info" />

</div>
