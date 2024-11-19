---
id: app-menu
title: App Menu
---

The app menu is located on the top right corner of the app card. Clicking on the app menu will open a dropdown menu containing various options. These options are:

- **[Rename app](#rename-app)**
- **[Change Icon](#change-icon)**
- **[Add to folder](#add-to-folder)**
- **[Clone app](#clone-app)**
- **[Export app](#export-app)**
- **[Delete app](#delete-app)**

<img className="screenshot-full" src="/img/dashboard/app-menu-v2.gif" alt="Dashboard"/>

<div style={{paddingTop:'24px'}}>

## Rename App

This option will open a modal that will allow you to rename your app.

<img className="screenshot-full" src="/img/dashboard/rename-app.png" alt="Dashboard"/>

</div>

<div style={{paddingTop:'24px'}}>

## Change Icon

This option will open a modal with a list of icons. You can choose any icon from this list to change the app icon.

<img className="screenshot-full" src="/img/dashboard/change-icon-v2.png" alt="Dashboard"/>

</div>

<div style={{paddingTop:'24px'}}>

## Add to Folder

This option will open a modal with a list of folders. You can choose any folder from this list to add the app to the folder.

<img className="screenshot-full" src="/img/dashboard/add-to-folder-v2.png" alt="Dashboard"/>

</div>

<div style={{paddingTop:'24px'}}>

## Clone App

Selecting this option will open a modal where you can enter the desired name for the cloned app. After providing the desired name, click on the Clone app button. This will immediately open the cloned app in the app builder with the same configuration as the original app.

<img className="screenshot-full" src="/img/dashboard/clone-app-v2.gif" alt="Dashboard"/>

</div>

<div style={{paddingTop:'24px'}}>

## Export App

This option downloads a JSON file containing the application data. This JSON file can be [imported](/docs/org-management/dashboard/create-app/#import) to ToolJet to create a new app. The exported app will include all the queries connected to global data sources including the data source created from Marketplace plugins.

This option allows you to select a specific version of the app to export or export all the versions of the app. To export a specific version of the app, select a version from the list of available versions in the modal and click on the `Export selected version` and to export all the versions of the app, click on the `Export All` button.

### Export ToolJet Table Schema

Selecting this option will include the schema of the ToolJet table connected to that application in the exported JSON file. This option is available for all the apps on ToolJet however only the apps with a ToolJet table connected(includes tjdb query) will have the schema included in the exported JSON file.

This JSON file can be used to [import](/docs/org-management/dashboard/create-app/#importing-app-connected-to-tooljet-table) the application to ToolJet along with the table schema that was connected to the application.

<img className="screenshot-full" src="/img/dashboard/export-app-v2.png" alt="Dashboard"/>

</div>

<div style={{paddingTop:'24px'}}>

## Delete App

This option will open a confirmation modal to delete the app. Click on the `Delete` button to delete the app.

<img className="screenshot-full" src="/img/dashboard/delete-app-v2.png" alt="Dashboard"/>

</div>
