---
id: airtable
title: Airtable
---

# Airtable

ToolJet can connect to your Airtable account to read and write data. **Personal Access Token** is required to connect to the Airtable data source on ToolJet. You can generate the Personal Access Token by visiting [Developer Hub from your Airtable profile](https://support.airtable.com/docs/creating-and-using-api-keys-and-access-tokens#understanding-personal-access-token-basic-actions).

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/airtable/airtableconnect-v2.gif" alt="Airtable Data Source Connection" />
</div>

<br/>

:::info
Airtable API has a rate limit, and at the time of writing this documentation, the limit is five(5) requests per second per base. You can read more about rate limits here **[Airtable API](https://airtable.com/api)**.
:::

## Supported Operations

- **[List records](#list-records)**
- **[Retrieve record](#retrieve-record)**
- **[Create record](#create-record)**
- **[Update record](#update-record)**
- **[Delete record](#delete-record)**

### List records

This operation returns a list of records from the specified table.

#### Required parameters:

- **Base ID:** To find the Base ID, first visit **airtable.com/api**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`

- **Table name:** The name of the table from which you want to fetch the records.

#### Optional parameters:

- **Page size:** The number of records returned in each request. Default is 100 records.  

- **offset:** The offset value is used to fetch the next set of records. The offset value is returned in the response of the previous request.

Example response from Airtable:

```json
{
  "records": [
    {
      "id": "recu9xMnUdr2n2cw8",
      "fields": {
        "Notes": "sdfdsf",
        "Name": "dsfdsf"
      },
      "createdTime": "2021-05-12T14:30:33.000Z"
    },
    {
      "id": "recyIdR7bVdQvmKXa",
      "fields": {
        "Notes": "sdfdsf",
        "Name": "dfds"
      },
      "createdTime": "2021-05-12T14:30:33.000Z"
    },
    {
      "id": "recAOzdIHaRpvRaGE",
      "fields": {
        "Notes": "sdfsdfsd",
        "Name": "sdfdsf"
      },
      "createdTime": "2021-05-12T14:30:33.000Z"
    }
  ],
  "offset": "recAOzdIHaRpvRaGE"
}
```

### Retrieve record

#### Required parameters:

- **Base ID**: To find the Base ID, first visit **airtable.com/api**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`

- **Table name**: The name of the table from which you want to fetch the records.

- **Record ID**: The ID of the record you want to retrieve.


Example response from Airtable:

```json
{
  "id": "recu9xMnUdr2n2cw8",
  "fields": {
    "Notes": "sdfdsf",
    "Name": "dsfdsf"
  },
  "createdTime": "2021-05-12T14:30:33.000Z"
}
```

### Create record

#### Required parameters:

- **Base ID**: To find the Base ID, first visit **airtable.com/api**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`

- **Table name**: The name of the table from which you want to fetch the records.

- **Records**: The records you want to create. The records should be in the form of an array of objects. Each object should have a `fields` key, which contains the fields of the record. The field names should be the same as the field names in the Airtable table.

  **Example creating two records:**
  
  ```json title="Records"
  [
    {
      "fields": {
        "Notes": "sdfdsf",
        "Name": "dsfdsf"
      }
    },
    {
      "fields": {
        "Notes": "note1",
        "Name": "dsfdsf"
      }
    }
  ]
  ```

Query returns the following response when the records are created successfully:

```json
{
  "records": [
    {
      "id": "rec5RuZ1COoZGtGDY",
      "fields": {
        "Notes": "sdfdsf",
        "Name": "dsfdsf"
      },
      "createdTime": "2022-02-07T20:25:27.000Z"
    },
    {
      "id": "recaYbFPonNNu6Cwj",
      "fields": {
        "Notes": "note1",
        "Name": "dsfdsf"
      },
      "createdTime": "2022-02-07T20:25:27.000Z"
    }
  ]
}
```

### Update record

#### Required parameters:

- **Base ID**: To find the Base ID, first visit **airtable.com/api**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`

- **Table name**: The name of the table from which you want to fetch the records.

- **Record ID**: The ID of the record you want to update.

- **Body**: The fields you want to update. The fields should be in the form of an object. The field names should be the same as the field names in the Airtable table.

  **Example updating a record:**
  
  ```json title="Body"
  {
    "Notes": "Example Notes",
    "Name": "change"
  }
  ```

Query returns the following response when the record is updated successfully:

```json
{
  "id": "recu9xMnUdr2n2cw8",
  "fields": {
    "Notes": "Example Notes",
    "Name": "change"
  },
  "createdTime": "2021-08-08T17:27:17.000Z"
}
```

### Delete record

#### Required parameters:

- **Base ID**
- **Table name**
- **Record ID**

Query returns the following response when the record is deleted successfully:

```json
{
    deleted: true
    id: "recIKsyZgqI4zoqS7"
}
```
