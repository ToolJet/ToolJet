---
id: googlesheets
title: Google Sheets
---

ToolJet has the capability to establish a connection with Google Sheet for both reading and writing data. By utilizing OAuth 2.0, ToolJet can establish a secure connection with Google Sheet, ensuring that the application's access to a user's account is restricted and limited appropriately.

<div style={{paddingTop:'24px'}}>

## Self-Hosted Configuration

If you decide to self-host ToolJet, there are a few additional steps you need to take:

1. Proceed with the setup steps provided in the [Google OAuth 2.0 guide](/docs/setup/env-vars#google-oauth--optional-) to configure the necessary settings.
2. Assign the corresponding values obtained from the previous step to the following environment variables:
   - **GOOGLE_CLIENT_ID**
   - **GOOGLE_CLIENT_SECRET**
   - **TOOLJET_HOST**
3. Activate the Google Sheets API within the Google Cloud Platform (GCP) console.

</div>

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the Google Sheet datasource, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

### Authorization Scopes

When connecting to a Google Sheets datasource, you can choose between two permission scopes:

1. **Read Only**: This scope allows you to access and retrieve data from the Google Sheet.
2. **Read and Write**: This scope grants you both read and write permissions, enabling you to retrieve and modify data within the Google Sheet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/sheetconnect-v2.png" alt="Google Sheet" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Google Sheet

1. Click the **+ Add** button in the query manager located at the bottom panel of the editor. 
2. Select the **Google Sheet** datasource under the datasource section.
3. Choose the desired operation from the dropdown.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

Using Google sheets data source you can perform several operations from your applications like:

  1. **[Read data from a spreadsheet](#read-data-from-a-spreadsheet)**
  2. **[Append data to a spreadsheet](#append-data-to-a-spreadsheet)**
  3. **[Update single row of a spreadsheet](#update-single-row-of-a-spreadsheet)**
  4. **[Delete row from a spreadsheet](#delete-row-from-a-spreadsheet)**
  5. **[Get spreadsheet info](#get-spreadsheet-info)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/operations-v2.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

</div>

:::info
**Spreadsheet ID** can be obtained from the URL of the spreadsheet. For example, in the URL `https://docs.google.com/spreadsheets/d/1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM/edit#gid=0`, the `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM` represents the spreadsheet ID.
:::

### Read Data From a Spreadsheet

This operation allows you to retrieve the table data from a spreadsheet in the form of a JSON object.

#### Required Parameter
- **Spreadsheet ID**

#### Optional Parameter
- **Range**
- **Sheet**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/read-data-op-v2.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

</div>

### Append Data to a Spreadsheet

Add additional rows to a table by using the append operation.

#### Required Parameter
- **Spreadsheet ID**
- **Rows**

#### Optional Parameter
- **Sheet**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/append-data-op-v2.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

</div>

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

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/upd-v2.png" alt="Google Sheet Operations" />

</div>

#### Example
```yaml
{
  "id": "456",
  "company": "ABC Tech Solutions",
  "position": "Product Manager",
  "url": "https://abctech.com/careers",
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

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/del-v2.png" alt="google sheets delete" style={{marginBottom:'15px'}} />

</div>

### Get Spreadsheet Info

This operation allows you to retrieve basic information about the spreadsheet, including the number of sheets, theme, time zone, format, and URL, among others.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/info-v2.png" alt="google sheets get info" />

</div>

</div>
