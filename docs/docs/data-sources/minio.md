# MinIO

ToolJet can connect to minio and perform various operation on them.

## Connection

To add a new minio source, click on the Add or edit datasource icon on the left sidebar of the app editor and click on `Add datasource` button. Select minio from the modal that pops up.

ToolJet requires the following to connect to your DynamoDB.

- Host
- Port
- Access key
- Secret key


<img src="/img/datasource-reference/minio-connect.png" alt="ToolJet - Minio connection" height="250"/>

Click on 'Test connection' button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on 'Save' button to save the datasource.

## Querying Minio

Click on + button of the query manager at the bottom panel of the editor and select the datasource added in the previous step as the datasource. Select the operation that you want to perform and click 'Save' to save the query.

<img src="/img/datasource-reference/minio-query.png" alt="ToolJet - Mino query" height="250"/>

Click on the 'run' button to run the query. NOTE: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
