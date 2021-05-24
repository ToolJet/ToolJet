---
sidebar_position: 2
---

# Adding a datasource

:::tip
The datsources are created on app level and not on organization level.
:::

Datasource manager lives at the left-bottom corner of the app builder. To add a new datasource, click on the `+` icon.

<img class="screenshot-full" src="/img/tutorial/adding-datasource/sources.gif" alt="ToolJet" height="420"/>

You will be prompted to select the datasource that you wish to add. Let's select PostgreSQL for this tutorial. You will then need to provide the credentials of your PostgreSQL database. The fields that are marked as `encrypted` will be encrypted before saving to ToolJet's database. 

<img class="screenshot-full" src="/img/tutorial/adding-datasource/pg.gif" alt="ToolJet" height="420"/>

The name of the datasource must be unique (within the app) and can be changed by clicking on the datasource name at the top of the prompt. Click on `Test Connection` button to verify the connection, this might take a couple of minutes. Once verified, save the datasource. 

:::tip
If you are using ToolJet cloud and if your datasource is not publicly accessible, please white-list our IP address ( shown while creating a new datasource ).
:::