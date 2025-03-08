---
id: baserow
title: Baserow
---

ToolJet can connect to your Baserow account to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the **Baserow** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to Baserow:

- **API token**
- **Host**
- **Base URL**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-intro-v2.png" alt="Baserow intro" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Baserow

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Baserow** datasource added in previous step.
3. Select the desired operation from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/baserow/operations-v2.png" alt="Amazon SES" />

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

### List Fields

This query lists all the fields in a table.

#### Required Parameter

- **Table ID:** ID of the Table you want to do operations on.

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-list-fields-v3.png" alt="Baserow list fields" />

<details>
  <summary>**Example Value**</summary>

  ```yaml
      Table ID: 136273
  ```

</details>

<details>
  <summary>**Example Response**</summary>

  ```json
      0: {} 11 keys
        id:884868
        table_id:136273
        name:"Name"
        order:0
        type:"text"
        primary:true
        read_only:false
        immutable_type:false
        immutable_properties:false
        description:null
        text_default:""
        "..."
  ```

</details>

### List Rows

This query lists all the rows in a table.

#### Required Parameter

- **Table ID:** ID of the Table you want to do operations on.

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-list-rows-v3.png" alt="Baserow list"/>

<details>
  <summary>**Example Value**</summary>
  ```yaml
      Table ID: 136273
  ```
</details>

<details>
  <summary>**Example Response**</summary>
  ```json
      count:3
      next:null
      previous:null
      results:[] 3 items
        0:{} 5 keys
        id:1
        order:"1.00000000000000000000"
        Name:"Tool"
        Last Name:"Jet"
        Notes:"Welcome to ToolJet"
      '...'
  ```
</details>

### Get Row

#### Required Parameters

- **Table ID:** ID of the Table you want to do operations on.
- **Row ID:** Enter the Row ID you want to do operations on.

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-get-row-v3.png" alt="Baserow get" />

<details>
  <summary>**Example Value**</summary>
  ```yaml
      Table ID: 136273
      Row ID: 1
  ```
</details>

<details>
  <summary>**Example Response**</summary>
  ```json
      id:1
      order:"1.00000000000000000000"
      Name:"Tool"
      Last Name:"Jet"
      Notes:"Welcome to ToolJet"
      '...'
  ```
</details>

### Create Row

#### Required Parameters
- **Table ID:** ID of the Table you want to do operations on.
- **Records:** Enter the values to do the corresponding operations on.

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-create-row-v3.png"  alt="Bserow create"/>

<details>
  <summary>**Example Value**</summary>
  ```yaml
      Table ID: 136273
      Records: {
          "Name": "Test - ToolJet",
          "Last name": "ToolJet Name",
          "Notes": "ToolJet Note",
          }
  ```
</details>

<details>
  <summary>**Response Example**</summary>
  
  ```json
  {
    "id":4,
    "order":"4.00000000000000000000",
    "Name":"Test",
    "Last Name":null,
    "Notes":"Test Note",
    "..."
  }
  ```

</details>

### Update Row

#### Required Parameters

- **Table ID:** ID of the Table you want to do operations on.
- **Row ID** Enter the Row ID you want to do operations on.
- **Records:** Enter the values to do the corresponding operations on.

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-update-row-v3.png" alt="Baserow update" />

<details>
  <summary>**Example Value**</summary>
  ```yaml
      Table ID: 136273
      Row ID: 1
      Records: {
        "Name": "Test - ToolJet",
        "Last name": "ToolJet Name",
        "Notes": "ToolJet Note",
        }
  ```
</details>

<details>
  <summary>**Example Response**</summary>
  
  ```json
  {
    "id":4,
    "order":"4.00000000000000000000",
    "Name":"Test - ToolJet",
    "Last Name":null,
    "Notes":"ToolJet Note"
  }
  ```

</details>

### Move Row

#### Required Parameters

- **Table ID:** ID of the Table you want to do operations on.
- **Row ID** Enter the Row ID you want to do operations on.

#### Optional Parameters

- **Before ID** (The row will be moved before the entered ID. If not provided, then the row will be moved to the end)

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-move-row-v3.png" alt="Baserow move row" />

<details>
  <summary>**Example Value**</summary>
  ```yaml
      Table ID: 136273
      Row ID: 1
      Before ID: 1
  ```
</details>

<details>
  <summary>**Example Response**</summary>
  
  ```json
  {
    "id":4,
    "order":"4.00000000000000000000",
    "Name":"Test - ToolJet",
    "Last Name":null,
    "Notes":"ToolJet Note"
  }
  ```

</details>

### Delete Row

#### Required Parameters
- **Table ID:** ID of the Table you want to do operations on.
- **Row ID:** Enter the Row ID you want to do operations on.

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-delete-row-v3.png" alt="Baserow delete" />

While deleting a row, the response will be either success or failure from Baserow.

</div>
