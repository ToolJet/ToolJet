---
sidebar_position: 2
---

# Adding a datasource

:::caution
The datsources are created on app level and not on organization level.
:::

Datasource manager lives at the left-bottom corner of the app builder. To add a new datasource, click on the `+` icon.

<img src="/img/tutorial/adding-datasource/sources.png" alt="ToolJet - Redis connection" height="550"/>

You will be prompted to select the datasource that you wish to add. Let's select PostgreSQL for this tutorial. You will then need to provide the credentials of your PostgreSQL database. The fields that are marked as **encrypted** will be encrypted before saving to ToolJet's database. 

<img src="/img/tutorial/adding-datasource/pg.png" alt="ToolJet - Redis connection" height="250"/>

The name of the datasource must be unique (within the app) and can be changed by clicking on the datasource name at the top of the prompt. Click on 'Test Connection' button to verify the connection, this might take a couple of minutes. Once verified, save the datasource. 