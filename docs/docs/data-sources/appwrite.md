---
sidebar_position: 4
---

# Appwrite Database

## Supported operations
1.  List documents
2.  Get document
3.  Create document
4.  Update document 
5.  Delete document 
6.  Bulk update using document id

## Connection 
ToolJet connects to your Appwrite app using :
- Host (API endpoint)
- Project ID
- Secret key

To generate a new secret key and get another credentials, go to your perticular project settings page 

You should also set scopes for access perticular resources.
[Read More about API keys and scopes](https://appwrite.io/docs/keys).

Once the credentails are available, click on `+` button of data sources panel at the left-bottom corner of the app editor. Select Appwrite from the modal that pops up. Provide credentails. Click on 'Test connection' button to verify if the service account can access Appwrite from ToolJet server. Click on 'Save' button to save the datasource.

<img class="screenshot-full" src="/img/datasource-reference/appwrite/appwrite-init.gif" alt="ToolJet - Data source - Appwrite" height="420" />

## Querying Appwrite 

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source.

<img class="screenshot-full" src="/img/datasource-reference/appwrite/appwrite-query.gif" alt="ToolJet - Appwrite Query" height="420"/>

Select the operation that you want to perform on Appwrite database and click 'Save' to save the query. 

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::