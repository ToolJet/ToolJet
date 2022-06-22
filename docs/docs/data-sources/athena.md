
# Athena

ToolJet can connect to Amazon Athena databases to read and write data. 

- [Connection](#connection)
- [Querying-athena](#querying-athena)

## Connection

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

![ToolJet - Connection](/img/datasource-reference/athena/athena-connection.png)

</div>

## Querying Amazon Athena

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the datasource. Query manager then can be used to write SQL queries.

<div style={{textAlign: 'center'}}>

![ToolJet - Querying-athena](/img/datasource-reference/athena/athena-query.png)

</div>

Click on the `run` button to run the query. 

**NOTE:** Query should be saved before running.

:::tip
Refer amazon athena docs here for more info: [link](https://docs.aws.amazon.com/athena/latest/ug/what-is.html)
:::

### Basic queries

:::tip
**Refer amazon athena docs here for more info:** [link](https://docs.aws.amazon.com/athena/latest/ug/what-is.html)
:::

- Creating table 


```
CREATE EXTERNAL TABLE student (
    name STRING,
    age INT
)  LOCATION 's3://athena-express-akiatfa53s-2022/';
```

- Inserting to table

```
INSERT INTO student
VALUES ('Lansing',1)
```

- Select operation

```
SELECT * from student WHERE AGE=1
```