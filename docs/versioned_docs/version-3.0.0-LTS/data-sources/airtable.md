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

<img className="screenshot-full" src="/img/datasource-reference/airtable/operations-v2.png" alt="Airtable Data Source Operations" />

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

- **Base ID**: The unique identifier of the Airtable base.
- **Table name**: The name or ID of the table to retrieve records from.

#### Optional Parameters*

- **Page size**: The number of records to return per page.
- **Offset**: Used for pagination to fetch the next set of records.
- **Filter by formula**: A formula to filter records. 
- **Fields**: Specifies which fields to include in the response.
- **Timezone**: The timezone to use for date and time fields.
- **User locale**: The locale to use for formatting date and time fields.
- **Cell format**: Determines how cell values are returned. Possible values are:
      - **json**: Returns cell values as JSON objects, depending on the field type.
      - **string**: Returns cell values as strings.
- **View**: Specifies the view to retrieve records from.
- **Sort**: Defines the sorting order of records.

:::info
Timezone and User locale are mutually dependent. If you provide a timezone, you must also provide a user locale and vice versa. These properties are only applied when cell format is set to string. To correctly format date and time fields, make sure the coloumn type is set to Date or Date Time in Airtable.
:::

<img className="screenshot-full" src="/img/datasource-reference/airtable/list-records-v4.png" alt="Airtable List Records Query" />


<details>
<summary>**Example Values**</summary>

```json
Base ID: app6mDmBQLjJNp8vO
Table name: tbltnWU08SBzmAWd5 // Can be Table name or Table ID
```

</details>


<details>
  <summary>**Response Example**</summary>
  
  ```json
{
  "records": [
    {
      "id": "rec2Nix9XrfzsGXfs",
      "createdTime": "2025-03-04T12:22:09.000Z",
      "fields": {
        "Name": "Katrina Petersons",
        "Email": "katrina.petersons@example.com"
      }
    },
    {
      "id": "recK62zueMpI3PErc",
      "createdTime": "2025-03-04T12:25:23.000Z",
      "fields": {
        "Name": "John Doe",
        "Email": "john.doe@example.com"
      }
    }
  ]
}
  ```
</details>

### Retrieve Record

This operation fetches a specific record from the specified table.

#### Required Parameters

- **Base ID**
- **Table name**
- **Record ID**

<img className="screenshot-full" src="/img/datasource-reference/airtable/retrieve-record-v3.png" alt="Airtable Retrieve Record Query" />

<details>
<summary>**Example Values**</summary>

```json
Base ID: app6mDmBQLjJNp8vO
Table name: Teams 
Record ID: rec2Nix9XrfzsGXfs
```

</details>

<details>
  <summary>**Response Example**</summary>
  ```json
{
  "id": "rec2Nix9XrfzsGXfs",
  "createdTime": "2025-03-04T12:22:09.000Z",
  "fields": {
    "Name": "Katrina Petersons",
    "Email": "katrina.petersions@example.com"
  }
}
  ```
</details>

### Create Record

This operation creates a new record in the specified table.

#### Required Parameters

- **Base ID**
- **Table name**
- **Records**

<img className="screenshot-full" src="/img/datasource-reference/airtable/create-record-v3.png" alt="Airtable Create Record Query" />

<details>
<summary>**Example Values**</summary>

```json
Body:[{
    "fields": {
      "Name": "Katrina Petersons",
      "Email": "katrina.petersions@example.com"
    }
}]
```

</details>

<details>
  <summary>**Response Example**</summary>
  ```json
 {
  "records": [
    {
      "id": "rece9HUnz6gulQ6QV",
      "createdTime": "2025-03-06T08:07:55.000Z",
      "fields": {
        "Name": "Katrina Petersons",
        "Email": "katrina.petersions@example.com"
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

<img className="screenshot-full" src="/img/datasource-reference/airtable/update-record-v3.png" alt="Airtable Update Record Query" />

<details>
<summary>**Example Values**</summary>

```json
Body:
   {
  "Email": "katrina.petersions2@example.com"
}
```

</details>

<details>
  <summary>**Response Example**</summary>
  ```json
{
  "records": [
    {
      "id": "rec2Nix9XrfzsGXfs",
      "createdTime": "2025-03-04T12:22:09.000Z",
      "fields": {
        "Name": "Katrina Petersons",
        "Email": "katrina.petersions2@example.com"
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

<img className="screenshot-full" src="/img/datasource-reference/airtable/delete-record-v3.png" alt="Airtable Delete Record Query" />

<details>
<summary>**Example Values**</summary>

```json
Base ID: app6mDmBQLjJNp8vO
Table name: Teams 
Record ID: rec2Nix9XrfzsGXfs
```

</details>

<details>
  <summary>**Response Example**</summary>
  ```yaml
 {
  "deleted": true
  "id": "rec2Nix9XrfzsGXfs"
}
  ```
</details>