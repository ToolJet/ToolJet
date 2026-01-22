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

<img className="screenshot-full" src="/img/datasource-reference/baserow/operations.png" alt="Amazon SES" />

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

- **[List fields](#list-fields)**
- **[List rows](#list-rows)**
- **[Get row](#get-row)**
- **[Create row](#create-row)**
- **[Update row](#update-row)**
- **[Move row](#move-row)**
- **[Delete row](#delete-row)**

### List Fields

This query lists all the fields in a table.

#### Required Parameter

- **Table ID**

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-list-fields-v2.png" alt="Baserow list fields" />

<details id="tj-dropdown">
  <summary>**Response Example**</summary>

  ```yaml
  [
    {
      "id": 331156,
      "table_id": 57209,
      "name": "Name",
      "order": 0,
      "type": "text",
      "primary": true,
      "text_default": ""
    },
    {
      "id": 331157,
      "table_id": 57209,
      "name": "Last name",
      "order": 1,
      "type": "text",
      "primary": false,
      "text_default": ""
    },
    {
      "id": 331158,
      "table_id": 57209,
      "name": "Notes",
      "order": 2,
      "type": "long_text",
      "primary": false
    },
    {
      "id": 331159,
      "table_id": 57209,
      "name": "Active",
      "order": 3,
      "type": "boolean",
      "primary": false
    }
  ]
  ```

</details>

### List Rows

This query lists all the rows in a table.

#### Required Parameter

- **Table ID**

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-list-rows-v2.png" alt="Baserow list"/>

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
  
  ```json
  {
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 2,
        "order": "0.99999999999999999991",
        "Name": "Bill",
        "Last name": "Gates",
        "Notes": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce dignissim, urna eget rutrum sollicitudin, sapien diam interdum nisi, quis malesuada nibh eros a est.",
        "Active": false
      },
      {
        "id": 3,
        "order": "0.99999999999999999992",
        "Name": "Mark",
        "Last name": "Zuckerberg",
        "Notes": null,
        "Active": true
      },
      {
        "id": 1,
        "order": "0.99999999999999999997",
        "Name": "Elon",
        "Last name": "Musk",
        "Notes": null,
        "Active": true
      }
    ]
  }
  ```

</details>

### Get Row

#### Required Parameters

- **Table ID**
- **Row ID**

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-get-row-v2.png" alt="Baserow get" />

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
  
  ```json
  {
    "id": 1,
    "order": "0.99999999999999999997",
    "Name": "Elon",
    "Last name": "Musk",
    "Notes": null,
    "Active": true
  }
  ```

</details>

### Create Row

#### Required Parameters
- **Table ID**
- **Records**

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-create-row-v2.png"  alt="Bserow create"/>

#### Example

```json
{
  "Name": "Test",
  "Last name": "Test Name",
  "Notes": "Test Note",
  "Active": true
}
```

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
  
  ```json
  {
    "id": 19,
    "order": "0.99999999999999999996",
    "Name": "Test",
    "Last name": "Test Name",
    "Notes": "Test Note",
    "Active": true
  }
  ```

</details>

### Update Row

#### Required Parameters

- **Table ID**
- **Row ID**
- **Records**

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-update-row-v2.png" alt="Baserow update" />

#### Example

```json
{
  "Name": "Test",
  "Last name": "Test Name",
  "Notes": "Test Note",
  "Active": true
}
```

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
  
  ```json
  {
    "id": 19,
    "order": "0.99999999999999999996",
    "Name": "Test",
    "Last name": "Test Name",
    "Notes": "Test Note",
    "Active": true
  }
  ```

</details>

### Move Row

#### Required Parameters

- **Table ID**
- **Row ID**

#### Optional Parameters

- **Before ID** (The row will be moved before the entered ID. If not provided, then the row will be moved to the end )

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-move-row-v2.png" alt="Baserow move row" />

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
    
  ```json
  {
    "id": 3,
    "order": "2.00000000000000000000",
    "Name": "Mark",
    "Last name": "Zuckerburg",
    "Notes": null,
    "Active": true
  }
  ```

</details>

### Delete Row

#### Required Parameters
- **Table ID**
- **Row ID**

<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-delete-row-v2.png" alt="Baserow delete" />

While deleting a row, the response will be either success or failure from Baserow.

</div>
