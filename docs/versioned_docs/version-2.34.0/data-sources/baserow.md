---
id: baserow
title: Baserow
---

# Baserow

ToolJet can connect to your Baserow account to read and write data.

## Connection

To connect to Baserow, you need to provide the following details:

- **API token**: You can create an API token from your Baserow dashboard. You can follow the steps to create API token from [this link](https://baserow.io/user-docs/personal-api-tokens).
- **Host**: You can either select the Baserow Cloud or Self-hosted option.
  - **Base URL**: If you select the self-hosted option, you need to provide the base URL of your Baserow instance.



<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-intro-v2.png" alt="Baserow intro" />


## Supported Operations

- [List fields](#list-fields)
- [List rows](#list-rows)
- [Get row](#get-row)
- [Create row](#create-row)
- [Update row](#update-row)
- [Move row](#move-row)
- [Delete row](#delete-row)

### List fields

This query lists all the fields in a table.

#### Required parameters:

- **Table ID**


<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-list-fields.png" alt="Baserow list fields" />


Example response from Baserow:

```json
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

### List rows

This query lists all the rows in a table.

#### Required parameters:

- **Table ID**


<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-list-rows.png" alt="Baserow list"/>


Example response from Baserow:

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
      "Last name": "Zuckerburg",
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

### Get row

#### Required parameters:

- **Table ID**
- **Row ID**


<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-get-row.png" alt="Baserow get" />


Example response from Baserow:

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

### Create row

#### Required parameters:

- **Table ID**
- **Records**


<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-create-row.png"  alt="Bserow create"/>


#### Example Records:

```json
{
  "Name": "Test",
  "Last name": "Test Name",
  "Notes": "Test Note",
  "Active": true
}
```

Example response from Baserow:

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

### Update row

#### Required parameters:

- **Table ID**
- **Row ID**
- **Records**


<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-update-row.png" alt="Baserow update" />

#### Example Records:

```json
{
  "Name": "Test",
  "Last name": "Test Name",
  "Notes": "Test Note",
  "Active": true
}
```

Example response from Baserow:

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

### Move row

#### Required parameters:

- **Table ID**
- **Row ID**

#### Optional parameters:

- **Before ID** (The row will be moved before the entered ID. If not provided, then the row will be moved to the end )


<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-move-row.png" alt="Baserow move row" />


Example response from Baserow:

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

### Delete row

#### Required parameters:

- **Table ID**
- **Row ID**


<img className="screenshot-full" src="/img/datasource-reference/baserow/baserow-delete-row.png" alt="Baserow delete" />


While deleting a row, the response will be either success or failure from Baserow
