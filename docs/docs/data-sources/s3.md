---
sidebar_position: 12
---

# Amazon S3

ToolJet can connect to Amazon S3 buckets and perform various operation on them.

## Connection

To add a new S3 source, click on the Add or edit datasource icon on the left sidebar of the app editor and click on `Add datasource` button. Select AWS S3 from the modal that pops up.

ToolJet requires the following to connect to your DynamoDB.

- Region
- Access key
- Secret key

It is recommended to create a new IAM user for the database so that you can control the access levels of ToolJet.

<img src="/img/datasource-reference/aws-s3-connect.png" alt="ToolJet - AWS S3 connection" height="250"/>

Click on 'Test connection' button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on 'Save' button to save the datasource.

## Querying AWS S3

Click on + button of the query manager at the bottom panel of the editor and select the datasource added in the previous step as the datasource. Select the operation that you want to perform and click 'Save' to save the query.

<img src="/img/datasource-reference/aws-s3-query.png" alt="ToolJet - AWS S3 query" height="250"/>

Click on the 'run' button to run the query. NOTE: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
