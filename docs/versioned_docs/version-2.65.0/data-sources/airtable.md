---
id: airtable
title: Airtable
---

ToolJet can connect to your **Airtable** account to read and write data. **Personal Access Token** is required to connect to the Airtable data source on ToolJet. You can generate the Personal Access Token by visiting **[Developer Hub from your Airtable profile](https://support.airtable.com/docs/creating-and-using-api-keys-and-access-tokens#understanding-personal-access-token-basic-actions)**.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/airtable/airtableconnect-v2.gif" alt="Airtable Data Source Connection" />
</div>

<br/>

:::info
Airtable API has a rate limit, and at the time of writing this documentation, the limit is five(5) requests per second per base. You can read more about rate limits here **[Airtable API](https://airtable.com/api)**.
:::

<div style={{paddingTop:'24px'}}>

## Supported Operations

- **[List records](#list-records)**
- **[Retrieve record](#retrieve-record)**
- **[Create record](#create-record)**
- **[Update record](#update-record)**
- **[Delete record](#delete-record)**

</div>

<div style={{paddingTop:'24px'}}>

### List records

This operation returns a list of records from the specified table.

#### Required parameters:

- **Base ID:** To find the Base ID, first visit **[Airtable API](https://airtable.com/api)**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`
- **Table name:** The name of the table from which you want to fetch the records.

#### Optional parameters:

- **Page size:** The number of records returned in each request. Default is 100 records.  
- **Offset:** The offset value is used to fetch the next set of records. The offset value is returned in the response of the previous request.
- **Filter by formula:** This parameter will only return records that satisfy the formula. The formula will be evaluated for each record, and if the result is not 0, false, "", NaN, [], or #Error!, the record will be included in the result. e.g. `Name = 'John'`
- **Fields:** The fields you want to retrieve. If you don't specify the fields, all fields will be returned. e.g. `["Name", "Email", "Survey Response"]`

<br/>
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/airtable/list-records-v2.png" alt="Airtable List Records Query" />
</div>

Example response from Airtable:

```json
{
  "records": [
    {
      "id": "recu9xMnUdr2n2cw8",
      "fields": {
        "Notes": "Meeting to discuss project details",
        "Name": "John Doe"
      },
      "createdTime": "2021-05-12T14:30:33.000Z"
    },
    {
      "id": "recyIdR7bVdQvmKXa",
      "fields": {
        "Notes": "Follow-up call regarding contract",
        "Name": "Jane Smith"
      },
      "createdTime": "2021-05-12T14:30:33.000Z"
    },
    {
      "id": "recAOzdIHaRpvRaGE",
      "fields": {
        "Notes": "Client feedback review meeting",
        "Name": "Alice Johnson"
      },
      "createdTime": "2021-05-12T14:30:33.000Z"
    }
  ],
  "offset": "recAOzdIHaRpvRaGE"
}
```

</div>

### Retrieve record

#### Required parameters:

- **Base ID**: To find the Base ID, first visit **[Airtable API](https://airtable.com/api)**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`
- **Table name**: The name of the table from which you want to fetch the records.
- **Record ID**: The ID of the record you want to retrieve.
<br/>
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/airtable/retrieve-record-v2.png" alt="Airtable Retrieve Record Query" />
</div>


Example response from Airtable:

```json
{
  "id": "recu9xMnUdr2n2cw8",
  "fields": {
    "Notes": "Discuss project timeline",
    "Name": "Michael Scott"
  },
  "createdTime": "2021-05-12T14:30:33.000Z"
}
```

### Create record

#### Required parameters:

- **Base ID**: To find the Base ID, first visit **[Airtable API](https://airtable.com/api)**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`
- **Table name**: The name of the table where you want to create the record.
- **Records**: The records you want to create. The records should be in the form of an array of objects. Each object should have a `fields` key, which contains the fields of the record. The field names should be the same as the field names in the Airtable table.
<br/>
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/airtable/create-record-v2.png" alt="Airtable Create Record Query" />
</div>

Example creating a record:

```json title="Records"
[{
    "fields": {
      "Name": "Katrina Petersons",
      "Email": "katrina.petersions@example.com"
    }
}]
```

Query returns the following response when the record is created successfully:

```json
{
  "records": [
    {
      "id": "recu6jhA7tzv4K66s",
      "createdTime": "2024-06-11T06:01:44.000Z",
      "fields": {
        "Name": "Katrina Petersons",
        "Email": "katrina.petersions@example.com",
        "Date": "06-11-2024",
      }
    }
  ]
}
```

### Update record

#### Required parameters:

- **Base ID**: To find the Base ID, first visit **[Airtable API](https://airtable.com/api)**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`
- **Table name**: The name of the table where you want to update the record.
- **Record ID**: The ID of the record you want to update.
- **Body**: The fields you want to update. The fields should be in the form of an object. The field names should be the same as the field names in the Airtable table.
<br/>
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/airtable/update-record-v2.png" alt="Airtable Update Record Query" />
</div>

Example updating a record:

```json title="Body"
{
  "Email": "katrina.petersions2@example.com"
}
```

Query returns the following response when the record is updated successfully:

```json
{
  "records": [
    {
      "id": "recu6jhA7tzv4K66s",
      "createdTime": "2024-06-11T07:01:44.000Z",
      "fields": {
        "Name": "Katrina Petersons",
        "Email": "katrina.petersions2@example.com",
        "Date": "06-11-2024",
      }
    }
  ]
}
```

### Delete record

#### Required parameters:

- **Base ID**: To find the Base ID, first visit **[Airtable API](https://airtable.com/api)**. Then select the base you want to connect to. The Base ID will be mentioned in the API documentation. Example Base ID: `appDT3UCPffPiSmFd`
- **Table name**: The name of the table where you want to delete the record.
- **Record ID**: The ID of the record you want to delete.
<br/>
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/airtable/delete-record-v2.png" alt="Airtable Delete Record Query" />
</div>

Query returns the following response when the record is deleted successfully:

```json
{
    deleted: true
    id: "recIKsyZgqI4zoqS7"
}
```