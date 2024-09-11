---
id: adding-a-datasource
title: Adding a data source
---

# Adding a data source

:::tip
The data sources are created on app level and not on workspace level.
:::

**Datasource manager** is on the left-sidebar of the app builder. To add a new data source, click on the <br/> `Add datasource` button.


<img className="screenshot-full" src="/img/tutorial/adding-datasource/add-datasource.png" alt="adding datasource" />


You will be prompted to select the data source that you wish to add. Let's select PostgreSQL for this tutorial. You will then need to provide the credentials of your PostgreSQL database. The fields that are marked as `encrypted` will be encrypted before saving to ToolJet's database. 

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Adding a data source](/img/tutorial/adding-datasource/datasources.png)

</div>

The name of the data source must be unique (within the app) and can be changed by clicking on the data source name at the top of the prompt. Click on `Test Connection` button to verify the connection, this might take a couple of minutes. Once verified, save the data source. 

:::tip
If you are using ToolJet cloud and if your data source is not publicly accessible, please white-list our IP address ( shown while creating a new data source ).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/adding-datasource/postgres.png" alt="postgre add datasource" />

</div>