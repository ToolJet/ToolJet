---
id: marketplace-plugin-awsredshift
title: Amazon Redshift
---

ToolJet can connect to Amazon Redshift, enabling your applications to query data directly from a Redshift cluster.

<img className="screenshot-full" src="/img/marketplace/plugins/redshift/install.gif" alt="Marketplace Plugin: Amazon Redshift" />

<br/>

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

<div style={{paddingTop:'24px'}}>

## Configuration

To connect to Amazon Redshift, you need to provide the following details:

#### Required Parameters

- **Region**: The region where your Redshift cluster is located. For example, `us-east-1`.
- **Database Name**: The name of the database you want to connect to. 
- **Authentication Type**: The type of authentication you want to use to connect to the Redshift cluster. Currently, only **IAM** is supported.
- **Access Key**: The access key of the user you want to use to connect to the Redshift cluster. 
- **Secret Key**: The secret key of the user you want to use to connect to the Redshift cluster.

#### Optional Parameters

- **Port**: The port number of the Redshift cluster. The default port number is `5439`.
- **Workgroup name**: The name of the workgroup you want to use to connect to the Redshift cluster.

<img className="screenshot-full" src="/img/marketplace/plugins/redshift/creds-v2.png" alt="Marketplace Plugin: Amazon Redshift" />

</div>

<div style={{paddingTop:'24px'}}>

## Supported Queries

Redshift supports a comprehensive set of SQL commands. You can use the SQL editor to run any SQL query on the connected Redshift cluster. Refer to the [Redshift documentation](https://docs.aws.amazon.com/redshift/latest/dg/c_SQL_commands.html) for more information on the supported SQL commands.

</div>

<div style={{paddingTop:'24px'}}>

### Read Data 

The following example demonstrates how to read data from a table in the connected Redshift cluster. The query selects all the columns from the `employee` table.

```sql
SELECT * FROM employee 
```

</div>

<img className="screenshot-full" src="/img/marketplace/plugins/redshift/read-data.png" alt="Read Data query" />

<details>
<summary>**Example Response**</summary>

```yaml
[
  [
  [
    {
      "longValue": 1
    },
    {
      "stringValue": "Tom"
    },
    {
      "stringValue": "Hudson"
    },
    {
      "stringValue": "tom.hudson@example.com"
    },
    {
      "stringValue": "234843294323"
    },
    {
      "stringValue": "2024-01-01"
    },
    {
      "stringValue": "Test Automation Engineer"
    },
    {
      "stringValue": "245000.00"
    },
    {
      "longValue": 12
    }
  ]
]
]
```
</details>

<div style={{paddingTop:'24px'}}>

### Write Data 

The following example demonstrates how to write data to a table in the connected Redshift cluster. The query inserts a new row into the `employee` table.

```sql
INSERT INTO employee (
    first_name,
    last_name,
    email,
    phone_number,
    hire_date,
    job_title,
    salary,
    department_id
) VALUES ( 
    'Tom', 
    'Hudson', 
    'tom.hudson@example.com', 
    '234843294323', 
    '2024-01-01', 
    'Test Automation Engineer', 
    245000.00, 
    12
);
```
<img className="screenshot-full" src="/img/marketplace/plugins/redshift/write-data.png" alt="Write Data query" />

<details>
<summary>**Example Response**</summary>

```yaml
[
  {
  "$metadata": {
    "httpStatusCode": 200,
    "requestId": "33853e10-4e4f-4f62-adb7-b4a9e58a5324",
    "attempts": 1,
    "totalRetryDelay": 0
  },
  "CreatedAt": "2025-03-04T07:56:52.707Z",
  "Database": "dev",
  "DbUser": "IAM:user",
  "Duration": 349809084,
  "HasResultSet": false,
  "Id": "3d142983-cfda-4733-b9fd-8bfac2072e9a",
  "QueryString": "INSERT INTO employee (\n first_name,\n last_name,\n email,\n phone_number,\n hire_date,\n job_title,\n salary,\n department_id\n) VALUES ( \n 'Tom', \n 'Hudson', \n 'tom.hudson@example.com', \n '234843294323', \n '2024-01-01', \n 'Test Automation Engineer', \n 245000.00, \n 12\n);",
  "RedshiftPid": 1073848426,
  "RedshiftQueryId": 817289,
  "ResultRows": 1,
  "ResultSize": 0,
  "Status": "FINISHED",
  "UpdatedAt": "2025-03-04T07:56:53.668Z",
  "WorkgroupName": "testing"
}
]
```
</details>

</div>

<div style={{paddingTop:'24px'}}>

### Update Data 

The following example demonstrates how to update data in a table in the connected Redshift cluster. The query updates the `first_name` and `last_name` columns of the `employee` table.

```sql
UPDATE employee
SET first_name = 'Glenn',
    last_name = 'Jacobs'
WHERE employee_id = 8;
```
<img className="screenshot-full" src="/img/marketplace/plugins/redshift/update-data.png" alt="Update Data query" />

<details>
<summary>**Example Response**</summary>

```yaml
[
  {
  "$metadata": {
    "httpStatusCode": 200,
    "requestId": "40490a00-de4e-42ba-bea4-6fecd6c3ba70",
    "attempts": 1,
    "totalRetryDelay": 0
  },
  "CreatedAt": "2025-03-04T07:53:38.340Z",
  "Database": "dev",
  "DbUser": "IAM:user",
  "Duration": 471831597,
  "HasResultSet": false,
  "Id": "7c4bf808-9546-430f-9646-fb71cf53554c",
  "QueryString": "UPDATE employee\nSET first_name = 'Glenn',\n last_name = 'Jacobs'\nWHERE employee_id = 8;",
  "RedshiftPid": 1073954914,
  "RedshiftQueryId": 817186,
  "ResultRows": 0,
  "ResultSize": 0,
  "Status": "FINISHED",
  "UpdatedAt": "2025-03-04T07:53:39.463Z",
  "WorkgroupName": "testing"
}
]
```
</details>

</div>

<div style={{paddingTop:'24px'}}>

### Delete Data

The following example demonstrates how to delete data from a table in the connected Redshift cluster. The query deletes a row from the `employee` table.

```sql
DELETE FROM employee
WHERE employee_id = 7;
```
<img className="screenshot-full" src="/img/marketplace/plugins/redshift/delete-data.png" alt="Delete Data query" />

<details>
<summary>**Example Response**</summary>

```yaml
[
  {
  "$metadata": {
    "httpStatusCode": 200,
    "requestId": "06e1c6b8-d8fa-4191-99d0-cea62b6bd721",
    "attempts": 1,
    "totalRetryDelay": 0
  },
  "CreatedAt": "2025-03-04T08:00:43.103Z",
  "Database": "dev",
  "DbUser": "IAM:user",
  "Duration": 349611717,
  "HasResultSet": false,
  "Id": "7bb4be08-5bd0-4736-b76f-8c7dfb0d282d",
  "QueryString": "DELETE FROM employee\nWHERE employee_id = 7;",
  "RedshiftPid": 1073913965,
  "RedshiftQueryId": 817428,
  "ResultRows": 1,
  "ResultSize": 0,
  "Status": "FINISHED",
  "UpdatedAt": "2025-03-04T08:00:44.063Z",
  "WorkgroupName": "testing"
}
]
```
</details>

</div>