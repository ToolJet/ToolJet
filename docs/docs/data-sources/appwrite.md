---
sidebar_position: 2
sidebar_label: Appwrite
---

# Appwrite Database

Now build applications on top of your Appwrite database.

## Connection 

ToolJet connects to your Appwrite app using :
- **Host (API endpoint)**
- **Project ID**
- **Secret key**

You'll find the Secret key and other credentials on your project settings page. You may need to create a new key if you don't have one already.

:::info
You should also set scope for access of particular resource. Learn more about the **API keys and scopes** [here](https://appwrite.io/docs/keys).
:::

To connect Appwrite datasource to your ToolJet application, go to the data source manager on the left-sidebar and click on the `+` button. Select Appwrite from the list of available datasources, provide the credentials and click **Save**. It is recommended to the check the connection by clicking on 'Test connection' button to verify if the service account can access Appwrite from ToolJet server.

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Appwrite](/img/datasource-reference/appwrite/appwrite-init.gif)

</div>

## Supported operations

1.  **List documents**
2.  **Get document**
3.  **Create document**
4.  **Update document** 
5.  **Delete document**
6.  **Bulk update using document id**

## Querying Appwrite 

After setting up the Appwrite datasource, you can click on the `+` button of the query manager at the bottom panel of the editor and select the Appwrite data source that you added in the previous step.

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Appwrite](/img/datasource-reference/appwrite/appwrite-query.gif)

</div>

After selecting Appwrite datasource, select the operation that you want to perform on Appwrite database and click **Save** to save the query. 

:::tip
Query results can be transformed using Transformations. Read our **Transformation documentation** [here](/docs/tutorial/transformations)
:::