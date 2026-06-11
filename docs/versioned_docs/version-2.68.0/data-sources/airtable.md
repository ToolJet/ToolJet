---
id: airtable
title: Airtable
---

ToolJet can connect to your **Airtable** account to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the **Airtable** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview/)** page from the ToolJet dashboard.

ToolJet requires the following to connect to your Airtable:
- **Personal Access Token**

You can generate the Personal Access Token by visiting **[Developer Hub from your Airtable profile](https://support.airtable.com/docs/creating-and-using-api-keys-and-access-tokens#understanding-personal-access-token-basic-actions)**.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/airtable/airtableconnect-v2.gif" alt="Airtable Data Source Connection" />
</div>

</div>

:::info
Airtable API has a rate limit, and at the time of writing this documentation, the limit is five(5) requests per second per base. You can read more about rate limits here **[Airtable API](https://airtable.com/api)**.
:::


<div style={{paddingTop:'24px'}}>

## Querying Airtable

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Airtable** datasource added in previous step.
3. Select the desired operation from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/airtable/operations.png" alt="Airtable Data Source Operations" />

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

- **[List records](#list-records)**
- **[Retrieve record](#retrieve-record)**
- **[Create record](#create-record)**
- **[Update record](#update-record)**
- **[Delete record](#delete-record)**

</div>

### List Records

This operation retrieves a list of records from the specified table.

#### Required Parameters

- **Base ID**
- **Table name**

#### Optional Parameters

- **Page size**  
- **Offset**
- **Filter by formula** 
- **Fields**

<img className="screenshot-full" src="/img/datasource-reference/airtable/list-records-v2.png" alt="Airtable List Records Query" />

<details>
  <summary>**Response Example**</summary>
  
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
</details>


### Retrieve Record

This operation fetches a specific record from the specified table.

#### Required Parameters

- **Base ID**
- **Table name**
- **Record ID**

<img className="screenshot-full" src="/img/datasource-reference/airtable/retrieve-record-v2.png" alt="Airtable Retrieve Record Query" />

<details>
  <summary>**Response Example**</summary>
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
</details>

### Create Record

This operation creates a new record in the specified table.

#### Required Parameters

- **Base ID**
- **Table name**
- **Records**

<img className="screenshot-full" src="/img/datasource-reference/airtable/create-record-v2.png" alt="Airtable Create Record Query" />

#### Example

```json title="Records"
[{
    "fields": {
      "Name": "Katrina Petersons",
      "Email": "katrina.petersions@example.com"
    }
}]
```
<details>
  <summary>**Response Example**</summary>
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
</details>

### Update record

Update a specific record by providing new data.

#### Required parameters:

- **Base ID**
- **Table name**
- **Record ID**
- **Body**

<img className="screenshot-full" src="/img/datasource-reference/airtable/update-record-v2.png" alt="Airtable Update Record Query" />

#### Example

```json
{
  "Email": "katrina.petersions2@example.com"
}
```
<details>
  <summary>**Response Example**</summary>
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
</details>

### Delete record

This operation removes a record from the specified table.

#### Required parameters:

- **Base ID**
- **Table name**
- **Record ID**

<img className="screenshot-full" src="/img/datasource-reference/airtable/delete-record-v2.png" alt="Airtable Delete Record Query" />

<details>
  <summary>**Response Example**</summary>
  ```json
  {
      deleted: true
      id: "recIKsyZgqI4zoqS7"
  }
  ```
</details>
