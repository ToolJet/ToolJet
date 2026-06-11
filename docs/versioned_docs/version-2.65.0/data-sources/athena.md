---
id: athena
title: Athena
---

ToolJet can connect to **Amazon Athena** which is an interactive query service that makes it easy to analyze data in Amazon S3 using standard SQL.

- **[Connection](#connection)**
- **[Querying-athena](#querying-amazon-athena)**
- **[Basic Operation](#basic-queries)**

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the **Amazon Athena** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](https://docs.tooljet.com/docs/data-sources/overview)** page from the ToolJet dashboard and choose **Amazon Athena** as the data source.

ToolJet requires the following to connect to your Athena.

- **Database**
- **S3 output location**
- **Access key**
- **Secret key**
- **Region**

Click on the **Test Connection** button to verify the correctness of the provided credentials and the accessibility of the database to the ToolJet server. Finally, click on the **Save** button to save the data source configuration.

:::info
You can also configure for **[additional optional parameters](https://github.com/ghdna/athena-express)**.
:::

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/athena/athena-connection-v2.png" alt="Athena connection" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Amazon Athena

- Click on the **+ Add** button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. Query manager then can be used to write SQL queries.
- Click on the **Run** button to run the query. 

:::tip
**Refer amazon athena docs here for more info:** [link](https://docs.aws.amazon.com/athena/latest/ug/what-is.html)
:::

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/athena/querying-amazon-athena.png" alt="Athena connection" />

</div>

</div>

### Basic Queries

#### Creating Table 


```sql
CREATE EXTERNAL TABLE student (
    name STRING,
    age INT
)  LOCATION 's3://athena-express-akiatfa53s-2022/';
```

This query is used to create an external table within the database. The data for this table is stored in an S3 bucket at the provided URI, (`s3://athena-express-akiatfa53s-2022/` in this example).

#### Inserting to Table

```sql
INSERT INTO student
VALUES ('Lansing',1)
```

This query is attempting to insert a new record into the *student* table in a database. 

#### Select Operation

```sql
SELECT * from student WHERE AGE=1
```

This query retrieves all records from the *student* table where the age of the student is exactly 1 year.

#### List Tables

```sql
SHOW TABLES
```

This query is used to display a list of all tables in the current database.