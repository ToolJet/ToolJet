---
id: athena
title: Athena
---

ToolJet can connect to **Amazon Athena** which is an interactive query service that makes it easy to analyze data in Amazon S3 using standard SQL.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the **Amazon Athena** data source, you can either click on the **+Add new Data source** button located on the query panel or navigate to the **[Data Sources](https://docs.tooljet.com/docs/data-sources/overview)** page from the ToolJet dashboard and choose **Amazon Athena** as the data source.

ToolJet requires the following to connect to your Athena.

- **Database**
- **S3 output location**
- **Access key**
- **Secret key**
- **Region**

:::info
You can also configure for **[additional optional parameters](https://github.com/ghdna/athena-express)**.
:::

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/athena/athena-connection-v2.png" alt="Athena connection" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Amazon Athena

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Amazon Athena** datasource added in previous step.
3. Select the SQL Query from the dropdown and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::tip
**Refer amazon athena docs here for more info:** [link](https://docs.aws.amazon.com/athena/latest/ug/what-is.html)
:::

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/athena/querying-amazon-athena.png" alt="Athena connection" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Basic Queries

### Creating Table 

This query is used to create an external table within the database. The data for this table is stored in an S3 bucket at the provided URL (`s3://athena-express-akiatfa53s-2022/` in this example).

```sql
CREATE EXTERNAL TABLE student (
    name STRING,
    age INT
)  LOCATION 's3://athena-express-akiatfa53s-2022/';
```

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/athena/createTable.png" alt="Athena connection" />

### Inserting to Table

This query is attempting to insert a new record into the *student* table in a database. 

```sql
INSERT INTO student
VALUES ('Lansing',1)
```

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/athena/insertTable.png" alt="Athena connection" />

### Select Operation

This query retrieves all records from the *student* table where the age of the student is exactly 1 year.

```sql
SELECT * from student WHERE AGE=1
```

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/athena/selectOperation.png" alt="Athena connection" />

### List Tables

This query is used to display a list of all tables in the current database.

```sql
SHOW TABLES
```

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/athena/listTables.png" alt="Athena connection" />

</div>