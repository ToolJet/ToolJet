---
id: baserow
title: Baserow
---

# Baserow

## Connection

ToolJet can connect to your Baserow account to read and write data. Baserow API token is required to create an Baserow data source on ToolJet. You can follow the steps to create API token from [this link](https://baserow.io/api-docs).

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Baserow](/img/datasource-reference/baserow/baserow-intro.gif)

</div>

:::tip
This guide assumes that you have already gone through [Adding a data source](/docs/tutorial/adding-a-datasource) tutorial.
:::

## Supported queries

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

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Baserow](/img/datasource-reference/baserow/baserow-list-fields.png)

</div>

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

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Baserow](/img/datasource-reference/baserow/baserow-list-rows.png)

</div>

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

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Baserow](/img/datasource-reference/baserow/baserow-get-row.png)

</div>

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

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Baserow](/img/datasource-reference/baserow/baserow-create-row.png)

</div>

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

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Baserow](/img/datasource-reference/baserow/baserow-update-row.png)

</div>

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

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Baserow](/img/datasource-reference/baserow/baserow-move-row.png)

</div>

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

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Baserow](/img/datasource-reference/baserow/baserow-delete-row.png)

</div>

While deleting a row, the response will be either success or failure from Baserow
