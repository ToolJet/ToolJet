---
id: marketplace-plugin-redshift
title: Amazon Redshift
---

ToolJet can connect to Amazon Redshift, enabling your applications to query data directly from a Redshift cluster.


<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/redshift/install.gif" alt="Marketplace Plugin: Amazon Redshift" />
</div>

<br/>

**NOTE:** **Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

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

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/redshift/creds.png" alt="Marketplace Plugin: Amazon Redshift" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Supported Queries

Redshift supports a comprehensive set of SQL commands. You can use the SQL editor to run any SQL query on the connected Redshift cluster. Refer to the [Redshift documentation](https://docs.aws.amazon.com/redshift/latest/dg/c_SQL_commands.html) for more information on the supported SQL commands.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Read Data 

The following example demonstrates how to read data from a table in the connected Redshift cluster. The query selects all the columns from the `employee` table.

```sql
SELECT * FROM employee 
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

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

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Update Data 

The following example demonstrates how to update data in a table in the connected Redshift cluster. The query updates the `first_name` and `last_name` columns of the `employee` table.

```sql
UPDATE employee
SET first_name = 'Glenn',
    last_name = 'Jacobs'
WHERE employee_id = 8;
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete Data

The following example demonstrates how to delete data from a table in the connected Redshift cluster. The query deletes a row from the `employee` table.

```sql
DELETE FROM employee
WHERE employee_id = 7;
```

</div>

