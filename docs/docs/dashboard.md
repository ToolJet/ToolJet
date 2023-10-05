---
id: dashboard
title: Dashboard
---

The ToolJet Dashboard is the initial landing page that you see upon logging into your workspace. This interface serves as a central hub where you can access a variety of features. Primarily, it displays all the applications you've created within ToolJet. Moreover, you have the capability to create new workspaces and applications directly from this dashboard. Additionally, it provides an option to create folders for categorizing and managing applications for easier organization, access control, and workflow management.

Furthermore, the dashboard serves as a gateway to various essential sections, such as **[Workflows](/docs/workflows/overview)**, **[ToolJet Database](/docs/tooljet-database)**, **[Data Sources](/docs/data-sources/overview)**, **[Marketplace](/docs/marketplace/marketplace-overview)**, **[Workspace Settings](/docs/tutorial/manage-users-groups)**, **[Instance Settings](/docs/enterprise/superadmin/#instance-settings)**, and **[Audit logs](/docs/enterprise/audit_logs/)**. You can effortlessly navigate to these sections directly from the dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/dashboardoptions.png" alt="App menu options"/>

</div>

## Workspace Manager

The workspace manager is located on the top left corner of the dashboard. Clicking on the workspace manager will open a dropdown menu with a list of all the workspaces you are a part of. You can switch between workspaces by clicking on the workspace name from the dropdown menu.

You can also create a new workspace by clicking on the `Add new workspace` button on the bottom of the dropdown menu. Clicking on this button will open a modal, enter the name of the workspace and click on the `Create Workspace` button to create a new workspace. Workspaces can be **renamed** by clicking on the `edit` icon on the right side of the workspace name.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/workspacemenu.png" alt="Dashboard"/>

</div>

## Create a new app

To create a new app, click on the `Create new app` button on the top left corner of the dashboard. Clicking on this button will instantly create a new app and open the **[app builder](/docs/next/app-builder/overview)**. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/newapp.gif" alt="Dashboard"/>

</div>
<br/>

There are three dots on the right side of the `Create new app` button. Clicking on these dots will open a dropdown menu with two options:

### Choose from templates

This option will open a modal with a list of pre-built templates. You can choose any template from this list to create a new app.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/choosefromtemplate.gif" alt="Dashboard"/>

</div>

### Import

This option will open a file picker to import a JSON file. This JSON file should be the app exported from ToolJet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/import.gif" alt="Dashboard"/>

</div>

### Importing app connected to marketplace plugins

When importing an app with marketplace plugins, the marketplace plugin should be installed in the tooljet workspace where the app is being imported. If the marketplace plugin is not installed, the app will be imported without the queries for that plugin. 

#### When marketplace plugin is installed

If marketplace plugin is installed in the tooljet workspace where the app is being imported, the queries connected to the marketplace plugin will be available in the imported application. The queries will be linked to the data source with the same name if it is already present. If the data source is not present, a new data source will be created of that marketplace plugin and linked to the queries.

#### When marketplace plugin is not installed

If you have an app with a query linked to a marketplace plugin, and you import that app in a tooljet workspace where the marketplace plugin is not installed as the data source, the queries will be not be available in the imported application.

### Importing app connected to tooljet table

When the app(JSON file) that includes the table schema is imported, and the table is not present in the tooljet database of the workspace where the app is being imported, a new table will be created in the tooljet database with the same name as the table in the imported app. 

If the table with the same name is already present in the workspace, the new table will be created with the name `<table name>_<unix timestamp>`. Example: `<tablename>_1627980000`.

## Create a new folder

Folders can be created to organize your apps. To create a new folder, click on the `+` button on the left drawer of the dashboard. Clicking on this button will open a modal, enter the name of the folder and click on the `Create Folder` button to create a new folder.

### Delete or Edit Folder

A folder can be **deleted** or **renamed**. To delete or rename a folder, click on the kebab menu on the right side of the folder name. Clicking on kebab menu will open a dropdown menu with two options:

- **Edit folder**: This option will open a modal, enter the new name of the folder and click on the `Edit` button to rename the folder.
- **Delete folder**: This option will open a confirmation modal to delete the folder. Click on the `Delete` button to delete the folder.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/newfolder.gif" alt="Dashboard"/>

</div>

### Search folders

Folders can be searched by clicking on the search icon on the left drawer of the dashboard. Clicking on the search icon will open a search bar, enter the name of the folder to search.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/search.png" alt="Dashboard"/>

</div>

## App cards

The dashboard displays all the apps created in the workspace as cards. These cards are displayed in a grid layout. The app cards display the **name of the app**, the **name of the creator**, and the **date of creation**. The app cards also display the app **icon**, which can be changed by clicking on the `Change Icon` option from the app menu.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/appcard.png" alt="Dashboard"/>

</div>

## App menu

The app menu is located on the top right corner of the app card. Clicking on the app menu will open a dropdown menu with a list of options. These options are:

- **[Change Icon](#change-icon)**
- **[Add to folder](#add-to-folder)**
- **[Clone app](#clone-app)**
- **[Export app](#export-app)**
- **[Delete app](#delete-app)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/appmenu.gif" alt="Dashboard"/>

</div>

### Change Icon

This option will open a modal with a list of icons. You can choose any icon from this list to change the app icon.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/changeicon.png" alt="Dashboard"/>

</div>

### Add to folder

This option will open a modal with a list of folders. You can choose any folder from this list to add the app to the folder.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/addtofolder.png" alt="Dashboard"/>

</div>

### Clone app

Selecting this option will immediately open the cloned app in the app builder with the same configuration as the original app. The new app will be named as `<original app name>` followed by unix timestamp. Example: `<original app name> 1627980000`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/cloneapp.gif" alt="Dashboard"/>

</div>

### Export app

This option will download a JSON file of the application. This JSON file can be [imported](#import) to ToolJet to create a new app. The exported app will include all the queries connected to data sources including the data source created from Marketplace plugins.

This option allows you to select a specific version of the app to export or export all the versions of the app. To export a specific version of the app, select a version from the list of available versions in the modal and click on the `Export selected version` and to export all the versions of the app, click on the `Export All` button.

#### Export ToolJet table schema

Selecting this option will inclue the schema of the tooljet table connected to that application in the exported JSON file. This option is available for all the apps on ToolJet however only the apps with a tooljet table connected(includes tjdb query) will have the schema included in the exported JSON file. 

This JSON file can be used to [import](#importing-app-connected-to-tooljet-table) the application to ToolJet along with the table schema that was connected to the application.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/exportapp.png" alt="Dashboard"/>

</div>

### Delete app

This option will open a confirmation modal to delete the app. Click on the `Delete` button to delete the app.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/deleteapp.png" alt="Dashboard"/>

</div>

## App search

Apps can be searched by clicking on the search bar on the center of the dashboard. Click on the search bar and enter the name of the app to search.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/searchapp.png" alt="Dashboard"/>

</div>

## Current ToolJet Version

The current version of ToolJet is displayed on the top right corner of the dashboard. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/dashboard/currentversion.png" alt="Dashboard"/>

</div>