
# Athena

ToolJet can connect to Amazon Athena which is an interactive query service that makes it easy to analyze data in Amazon S3 using standard SQL.

- [Connection](#connection)
- [Querying-athena](#querying-amazon-athena)
- [Basic Operation](#basic-queries)

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


<img className="screenshot-full" src="/img/datasource-reference/athena/athena-connection.png" alt="Athena connection" />


## Querying Amazon Athena

- Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the datasource. Query manager then can be used to write SQL queries.


<img className="screenshot-full" src="/img/datasource-reference/athena/athena-query.png" alt="Athena query" />


- Click on the `run` button to run the query. 

**NOTE:** Query should be saved before running.

:::tip
**Refer amazon athena docs here for more info:** [link](https://docs.aws.amazon.com/athena/latest/ug/what-is.html)
:::

### Basic queries

#### Creating table 


```sql
CREATE EXTERNAL TABLE student (
    name STRING,
    age INT
)  LOCATION 's3://athena-express-akiatfa53s-2022/';
```

#### Inserting to table

```sql
INSERT INTO student
VALUES ('Lansing',1)
```

#### Select operation

```sql
SELECT * from student WHERE AGE=1
```
