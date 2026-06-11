---
id: baserow
title: Baserow
---

<div style={{paddingBottom:'24px'}}>

ToolJet can connect to your Baserow account to read and write data.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Connection

To connect to Baserow, you need to provide the following details:

- **API token**: You can create an API token from your Baserow dashboard. You can follow the steps to create API token from **[this link](https://baserow.io/user-docs/personal-api-tokens)**.
- **Host**: You can either select the Baserow Cloud or Self-hosted option.
- **Base URL**: If you select the self-hosted option, you need to provide the base URL of your Baserow instance.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-intro-v2.png" alt="Baserow intro" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Supported Operations

- **[List fields](#list-fields)**
- **[List rows](#list-rows)**
- **[Get row](#get-row)**
- **[Create row](#create-row)**
- **[Update row](#update-row)**
- **[Move row](#move-row)**
- **[Delete row](#delete-row)**

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### List fields

This query lists all the fields in a table.

#### Required parameters:

- **Table ID**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-list-fields-v2.png" alt="Baserow list fields" />

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

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### List rows

This query lists all the rows in a table.

#### Required parameters:

- **Table ID**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-list-rows-v2.png" alt="Baserow list"/>

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

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Get row

#### Required parameters:

- **Table ID**
- **Row ID**


<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-get-row-v2.png" alt="Baserow get" />

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

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Create row

#### Required parameters:

- **Table ID**
- **Records**


<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-create-row-v2.png"  alt="Bserow create"/>

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

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Update row

#### Required parameters:

- **Table ID**
- **Row ID**
- **Records**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-update-row-v2.png" alt="Baserow update" />

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

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Move row

#### Required parameters:

- **Table ID**
- **Row ID**

#### Optional parameters:

- **Before ID** (The row will be moved before the entered ID. If not provided, then the row will be moved to the end )

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-move-row-v2.png" alt="Baserow move row" />

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

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete row

#### Required parameters:

- **Table ID**
- **Row ID**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/baserow/baserow-delete-row-v2.png" alt="Baserow delete" />

</div>


While deleting a row, the response will be either success or failure from Baserow

</div>
