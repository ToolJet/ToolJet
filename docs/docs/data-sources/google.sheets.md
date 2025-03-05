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

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/sheetconnect-v3.png" alt="Google Sheet" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Google Sheet

1. Click the **+** button in the query manager located at the bottom panel of the editor. 
2. Select the **Google Sheet** datasource under the datasource section.
3. Choose the desired operation from the dropdown.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

:::info
**Spreadsheet ID** can be obtained from the URL of the spreadsheet. For example, in the URL `https://docs.google.com/spreadsheets/d/1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM/edit#gid=0`, the `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM` represents the spreadsheet ID.
:::

### Create a Spreadsheet

This operation can be used to create a new spreadsheet.

#### Required Parameter
- **Title:** Name of the Google Sheet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/create-sheet-v2.png" alt="create a spreadsheet" style={{marginBottom:'15px'}} />

</div>

<details>
<summary>**Example Value**</summary>
```yaml
"Title": "Hello World"
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    spreadsheetId: "12rcJ-VV4D3SuKX5WFjE7bulUHg4zV-Xq0FEWSgTX8So"
```
</details>

### List All Sheets of a Spreadsheet

This operation can be used to list all sheets of a spreadsheet.

#### Required Parameter
- **Spreadsheet ID:** ID of the spreadsheet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/list-all-sheets-v2.png" alt="create a spreadsheet" style={{marginBottom:'15px'}} />

</div>

<details>
<summary>**Example Value**</summary>
```yaml
"Spreadsheet ID": "1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    sheets: [] 1 item
      0: {} 1 key
      properties: {} 5 keys
        sheetId:0
        title:"Sheet1"
        index:0
        sheetType:"GRID"
        "..."
```
</details>

### Read Data From a Spreadsheet

This operation allows you to retrieve the table data from a spreadsheet in the form of a JSON object.

#### Required Parameter
- **Spreadsheet ID:** ID of the spreadsheet.

#### Optional Parameter
- **Range:** Used to specify a group of cells for data manipulation or analysis in Google Sheets.
- **Sheet:** Name of the Sheet you want to use.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/read-data-op-v3.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

</div>

<details>
<summary>**Example Value**</summary>
```yaml
"Spreadsheet ID": "1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
"Range": "A1:Z500"
"Sheet": "// Leave black to use first sheet"
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    0: {} 4 keys
      Country:"USA"
      Name:"User-1"
      Age:"20"
      Passion:"Using ToolJet"
      "..."
```
</details>

### Append Data to a Spreadsheet

Add additional rows to a table by using the append operation.

#### Required Parameter
- **Spreadsheet ID:** ID of the spreadsheet.
- **Rows:** Data you want to append to the row.

#### Optional Parameter
- **Sheet:** Name of the Sheet you want to use.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/append-data-op-v-3.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

</div>

<details>
<summary>**Example Value**</summary>
```yaml
"Spreadsheet ID": "1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
"Sheet": "// Leave black to use first sheet"
"Rows": "[{"Country":"Nepal","Name":"User-5","Age":"17","Passion":"Using ToolJet"}]"
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    spreadsheetId:"1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
    tableRange:"Sheet1!A1:D5"
    updates: {} 5 keys
      spreadsheetId:"1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
      updatedRange:"Sheet1!A6:D6"
      updatedRows:1
      updatedColumns:4
      updatedCells:4
      "..."
```
</details>

### Get Spreadsheet Info

This operation allows you to retrieve basic information about the spreadsheet, including the number of sheets, theme, time zone, format, and URL, among others.

#### Required Parameter
- **Spreadsheet ID:** ID of the spreadsheet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/get-info-v3.png" alt="google sheets get info" style={{marginBottom:'15px'}} />

</div>

<details>
<summary>**Example Value**</summary>
```yaml
"Spreadsheet ID": "1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    spreadsheetId:"1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
    properties:: {} 6 keys
      title:"Population"
      locale:"en_GB"
      autoRecalc:"ON_CHANGE"
      timeZone:"Asia/Calcutta"
    "..."
```
</details>

### Update Single Row of a Spreadsheet

This operation allows you to update existing data in a sheet.

#### Required Parameters
- **Spreadsheet ID:** ID of the Spreadsheet.
- **Where:** Used to specify conditions for filtering rows based on column values.
- **Operator:** Used to define comparison logic (for e.g., `===`) in filter conditions.
- **Value:** Used to provide the data for matching conditions in a query.
- **Body:** Used to define the new data to update in the specified row(s).

#### Optional Parameters
- **Range:** Used to specify a group of cells for data manipulation or analysis in Google Sheets.
- **Sheet name:** Name of the Sheet you want to use.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/update-data.png" alt="Google Sheet Operations" />

</div>

<details>
<summary>**Example Value**</summary>
```yaml
    Spreadsheet ID: "1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
    Range: "// A1:Z500"
    Sheet name: // Leave blank to use first sheet
    Where: "Age"
    Operator: "==="
    Value: "22"
    Body: "[{"Country":"Germany","Name":"User-21","Age":"37","Passion":"Using ToolJet"}]"
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    spreadsheetId:"1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
```
</details>

### Delete Row From a Spreadsheet

This operation allows you to delete a specific row from the sheet.

#### Required Parameter
- **Spreadsheet ID:** ID of the Spreadsheet.
- **Delete row number:** Number of the row you want to delete.

#### Optional Parameter
- **GID:** Name of the Google Sheet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/google-sheets/delete-row.png" alt="google sheets delete" style={{marginBottom:'15px'}} />

</div>

</div>

<details>
<summary>**Example Value**</summary>
```yaml
    Spreadsheet ID: "1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
    GID: "// Enter Sheet"
    Delete row number: "3"
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    spreadsheetId:"1YwUn7fSs3Q_6bjADI5O1nFMGY39hNLPHt51_TUO1kjs"
    replies: [] 1 item
    "..."
```
</details>