---
id: googlesheets
title: Google Sheets
---

ToolJet has the capability to establish a connection with Google Sheet for both reading and writing data. By utilizing OAuth 2.0, ToolJet can establish a secure connection with Google Sheet, ensuring that the application's access to a user's account is restricted and limited appropriately.

## Self-Hosted Configuration

If you decide to self-host ToolJet, there are a few additional steps you need to take:

1. Proceed with the setup steps provided in the [Google OAuth 2.0 guide](/docs/setup/env-vars#google-oauth) to configure the necessary settings.
2. Assign the corresponding values obtained from the previous step to the following environment variables:
   - **GOOGLE_CLIENT_ID**
   - **GOOGLE_CLIENT_SECRET**
   - **TOOLJET_HOST**
3. Activate the Google Sheets API within the Google Cloud Platform (GCP) console.

## Connection

To establish a connection with the Google Sheet data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

### Authorization Scopes

When connecting to a Google Sheets data source, you can choose between two permission scopes:

1. **Read Only**: This scope allows you to access and retrieve data from the Google Sheet.
2. **Read and Write**: This scope grants you both read and write permissions, enabling you to retrieve and modify data within the Google Sheet.

<img className="screenshot-full img-l" src="/img/datasource-reference/google-sheets/sheetconnect-v3.png" alt="Google Sheet" />

## Querying Google Sheet

1. Click the **+ Add** button in the query manager located at the bottom panel of the editor. 
2. Select the **Google Sheet** data source under the data source section.
3. Choose the desired operation from the dropdown.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

Using Google sheets data source you can perform several operations from your applications like:

  1. **[Create a spreadsheet](#create-a-spreadsheet)**
  2. **[List all sheets of a spreadsheet](#list-all-sheets-of-a-spreadsheet)**
  3. **[Read data from a spreadsheet](#read-data-from-a-spreadsheet)**
  4. **[Append data to a spreadsheet](#append-data-to-a-spreadsheet)**
  5. **[Get spreadsheet info](#get-spreadsheet-info)**
  6. **[Update single row of a spreadsheet](#update-single-row-of-a-spreadsheet)**
  7. **[Delete row from a spreadsheet](#delete-row-from-a-spreadsheet)**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/operations-v4.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

:::info
**Spreadsheet ID** can be obtained from the URL of the spreadsheet. For example, in the URL `https://docs.google.com/spreadsheets/d/1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM/edit#gid=0`, the `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM` represents the spreadsheet ID.
:::

### Create a Spreadsheet

This operation can be used to create a new spreadsheet.

#### Required Parameter
- **Title**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/create-sheet-v2.png" alt="create a spreadsheet" />

### List All Sheets of a Spreadsheet

This operation can be used to list all sheets of a spreadsheet.

#### Required Parameter
- **Spreadsheet ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/list-all-sheets-v2.png" alt="create a spreadsheet" style={{marginBottom:'15px'}} />

### Read Data From a Spreadsheet

This operation allows you to retrieve the table data from a spreadsheet in the form of a JSON object.

#### Required Parameter
- **Spreadsheet ID**

#### Optional Parameter
- **Range**
- **Sheet**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/read-data-op-v3.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

### Append Data to a Spreadsheet

Add additional rows to a table by using the append operation.

#### Required Parameter
- **Spreadsheet ID**
- **Rows**

#### Optional Parameter
- **Sheet**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/append-data-op-v3.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

#### Example
```yaml
[
  {
    "name": "John",
    "email": "john@tooljet.com",
    "date": "2024-09-16",
    "status": "Confirmed",
    "phone": "+123456789"
  },
  {
    "name": "Jane",
    "email": "jane@tooljet.com",
    "date": "2024-09-17",
    "status": "Pending",
    "phone": "+987654321"
  },
  {
    "name": "Doe",
    "email": "doe@tooljet.com",
    "date": "2024-09-18",
    "status": "Cancelled",
    "phone": "+112233445"
  }
]
```

### Get Spreadsheet Info

This operation allows you to retrieve basic information about the spreadsheet, including the number of sheets, theme, time zone, format, and URL, among others.

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/info-v3.png" alt="google sheets get info" style={{marginBottom:'15px'}} />

### Update Single Row of a Spreadsheet

This operation allows you to update existing data in a sheet.

#### Required Parameters
- **Spreadsheet ID**
- **Where**
- **Operator**
- **Value**
- **Body**

#### Optional Parameters
- **Range**
- **Sheet**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/upd-v2.png" alt="Google Sheet Operations" />

#### Example
```yaml
{
  "name": "Hugo Lefevre",
  "position": "Product Manager",
  "url": "https://abctech.com/hugo",
  "date-applied": "2024-09-10",
  "status": "Application Under Review"
}
```

### Delete Row From a Spreadsheet

This operation allows you to delete a specific row from the sheet.

#### Required Parameter
- **Spreadsheet ID**
- **Delete row number**

#### Optional Parameter
- **GID**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/del-v3.png" alt="google sheets delete" style={{marginBottom:'15px'}} />
