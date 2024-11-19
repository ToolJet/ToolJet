---
id: create-app
title: Create a New App
---

To create a new app, click on the **+ Create new app** button on the top left corner of the dashboard. Clicking on this button will open a modal where you can enter the name of the app and then click on the **+ Create app** button to create a new app.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/dashboard/new-app-modal-v2.png" alt="Dashboard"/>

There are three dots on the right side of the **+ Create new app** button. Clicking on these dots will open a dropdown menu with two options:

- **[Choose from templates](#choose-from-templates)**
- **[Import from device](#import)**

<div style={{paddingTop:'24px'}}>

## Choose from Templates

This option will open a modal with a list of pre-built templates. You can choose any template from this list to create a new app.

<img className="screenshot-full" src="/img/dashboard/choosefromtemplate-v2.gif" alt="Dashboard"/>

</div>

<div style={{paddingTop:'24px'}}>

## Import

This option will open a file picker to import a JSON file. This JSON file should contain the app data exported from ToolJet.

<img className="screenshot-full" src="/img/dashboard/import-app-v2.gif" alt="Dashboard"/>


</div>

<div style={{paddingTop:'24px'}}>

## Importing an App Connected to Marketplace Plugins

When importing an app with Marketplace plugins, the Marketplace plugin should be installed in the ToolJet workspace where the app is being imported. If the Marketplace plugin is not installed, the app will be imported without the queries for that plugin.

### When Marketplace plugin is installed

If Marketplace plugin is installed in the ToolJet workspace where the app is being imported, the queries connected to the Marketplace plugin will be available in the imported application. The queries will be linked to the data source with the same name if it is already present. If the data source is not present, a new data source will be created of that Marketplace plugin and linked to the queries.

### When Marketplace plugin is not installed

If you have an app with a query linked to a Marketplace plugin, and you import that app in a ToolJet workspace where the Marketplace plugin is not installed as the data source, the queries will be not be available in the imported application.

</div>

<div style={{paddingTop:'24px'}}>

## Importing App Connected to ToolJet Table

When the app (JSON file) that includes the table schema is imported, and the table is not present in the ToolJet database of the workspace where the app is being imported, a new table will be created in the ToolJet database with the same name as the table in the imported app.

If the table with the same name is already present in the workspace, the new table will be created with the name **tableName_unixTimestamp**. <br/>
Example: **tableName_1627980000**.

</div>

