---
id: googlesheets2.0
title: Google Sheets 2.0
---

ToolJet has the capability to establish a connection with Google Sheets 2.0 for both reading and writing data. By utilizing OAuth 2.0, ToolJet can establish a secure connection with Google Sheets 2.0, ensuring that the application's access to a user's account is restricted and limited appropriately.

## Self-Hosted Configuration

If you decide to self-host ToolJet, there are a few additional steps you need to take:

1. Proceed with the setup steps provided in the [Google OAuth 2.0 guide](/docs/setup/env-vars#google-oauth) to configure the necessary settings.
2. Assign the corresponding values obtained from the previous step to the following environment variables:
   - **GOOGLE_CLIENT_ID**
   - **GOOGLE_CLIENT_SECRET**
   - **REDIRECT_URI (TOOLJET_HOST)**
3. Activate the Google Sheets API within the Google Cloud Platform (GCP) console.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/connection-v2.png" alt="GS2.0 data source connection" style={{ marginBottom:'15px' }} />

## Connection

To establish a connection with the Google Sheets 2.0 data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

### Authentication Types

ToolJet supports two authentication methods for connecting Google Sheets 2.0 to your application: **OAuth 2.0** and **Service Account**. Each method provides a secure way to authorize access based on your integration requirements.

### Authorization Scopes

When connecting to a Google Sheets 2.0 data source, you can choose between two permission scopes:

1. **Read Only**: This scope allows you to access and retrieve data from the Google Sheets 2.0.
2. **Read and Write**: This scope grants you both read and write permissions, enabling you to retrieve and modify data within the Google Sheets 2.0.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/service-connection-v2.png" alt="GS2.0 data source connection" style={{ marginBottom:'15px' }} />

## Querying Google Sheets 2.0

1. Click the **+ Add** button in the query manager located at the bottom panel of the editor. 
2. Select the **Google Sheets 2.0** data source under the data source section.
3. Choose the desired operation from the dropdown.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

Using Google sheets 2.0 data source you can perform several operations from your applications like:

  1. **[Create a spreadsheet](#create-a-spreadsheet)**
  2. **[List all sheets of a spreadsheet](#list-all-sheets-of-a-spreadsheet)**
  3. **[List all spreadsheets](#list-all-spreadsheets)**
  4. **[Delete data from a spreadsheet by data filter](#delete-data-from-a-spreadsheet-by-data-filter)**
  5. **[Bulk update using primary key](#bulk-update-using-primary-key)**
  6. **[Copy data between spreadsheets](#copy-data-between-spreadsheets)**
  7. **[Read data from a spreadsheet](#read-data-from-a-spreadsheet)**
  8. **[Append data to a spreadsheet](#append-data-to-a-spreadsheet)**
  9. **[Get spreadsheet info](#get-spreadsheet-info)**
  10. **[Update data to a spreadsheet](#update-data-to-a-spreadsheet)**
  11. **[Delete row from a spreadsheet](#delete-row-from-a-spreadsheet)**
  12. **[Delete data from a spreadsheet by range](#delete-data-from-a-spreadsheet-by-range)**
  13. **[Update spreadsheet](#update-spreadsheet)**

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/listops.png" alt="Google Sheets2.0 Operations" style={{marginBottom:'15px'}} />

:::info
**Spreadsheet ID** can be obtained from the URL of the spreadsheet. For example, in the URL `https://docs.google.com/spreadsheets/d/1W2S4reCqOpPdm_mDEqmLmzj7zNaPk9vqv6_Ve7Nb9WM/edit#gid=0`, the `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLNb9WMmzjVe7` represents the spreadsheet ID.
:::

### Create a Spreadsheet
This operation creates a new Google Sheets spreadsheet in the authenticated account.

#### Required Parameter
- Title

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/create-query.png" alt="create a spreadsheet" style={{marginBottom:'15px'}} />

### List all sheets of a Spreadsheet
This operation retrieves all individual sheets (tabs) within a specified spreadsheet.

#### Required Parameter
- Spreadsheet

### List all Spreadsheets
This operation fetches all accessible spreadsheets associated with the authenticated Google account.

#### Optional Parameter
- Page Size
- Page Token
- Filter

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/listall-query.png" alt="create a spreadsheet" style={{marginBottom:'15px'}} />

### Delete data from a spreadsheet by data filter
This Operation removes rows that match the specified filter conditions.

#### Required Parameter
- Spreadsheet
- Sheet

#### Optional Parameter
- Filter

### Bulk update using primary key
This operation updates multiple rows at once by matching records using a primary key column.

#### Required Parameter
- Spreadsheet
- Sheet
- Primary Key
- Data

### Copy Data Between Spreadsheets
This operation copies selected data from one spreadsheet to another.

#### Required Parameter
- Source Spreadsheet
- Destination Spreadsheet

#### Optional Parameter
- Source range
- Destination range

### Read Data From a Spreadsheet
This operation retrieves data from a specified sheet or range within a spreadsheet in the form of a JSON object.

#### Required Parameter
- Spreadsheet
- Sheet

#### Optional Parameter
- Range
- Major Dimensions
- Value Render
- Date Time

### Append data to a spreadsheet
This operation adds additional rows of data to the end of a sheet without modifying existing data.

#### Required Parameter
- Spreadsheet
- Sheet
- Rows

### Get Spreadsheet info
This operation retrieves metadata and structural details of a spreadsheet.

#### Required Parameter
- Spreadsheet

### Update data to a spreadsheet
This operation modifies existing data in specified cells or ranges.

#### Required Parameter
- Spreadsheet
- Range
- Sheet Name
- Where
- Operator
- Value

#### Optional Parameter
- Body

### Delete row from a spreadsheet
This operation deletes one or more specific rows from a sheet.

#### Required Parameter
- Spreadsheet
- GID
- Delete Row Number

### Delete data from a spreadsheet by range
This operation clears data from a defined cell range within a sheet.

#### Required Parameter
- Spreadsheet
- Range
- Sheet 

#### Optional Parameter
- Shift Dimension

### Update spreadsheet
This operation updates spreadsheet properties such as title or configuration settings.

#### Required Parameter
- Spreadsheet
- Sheet 
- Values

#### Optional Parameter
- Range
- Input Options