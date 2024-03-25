---
id: overview
title: Overview
---

# Data Sources : Overview

Data Sources can pull and push data from various sources such as databases, external APIs, or services. Once connected to a workspace, the data source can be used with any app within that workspace.

:::caution
Data Source page is available only on **ToolJet version 2.3.0 and above**.
:::

<div style={{textAlign: 'center'}}>


<img className="screenshot-full" src="/img/datasource-reference/overview/overview-v2.png" alt="Data Sources: Overview" style={{width: '100%', height: '100%', border: '0'}}/>

</div>

## Connecting Data Sources

1. **Create a new app** from the dashboard, and click on the `+ Add new` button from the query panel. Alternatively, you can access the **Data Sources** page from the left sidebar of the dashboard.

  <div style={{textAlign: 'left'}}>

  <img className="screenshot-full" src="/img/datasource-reference/newui/overview/newgds.png" alt="Data Sources: Overview" />

  </div>

2. Within the **Data Sources** page, you'll find various categories of data sources on the left side, including Databases, APIs, Cloud Storages, and Plugins. You can click on each category to view the list of accessible data sources. When you hover over the desired data source, an `+ Add` button will appear. After clicking on this button, the selected data source will be added to the workspace, and it will be accessible across all apps within the workspace.

  <div style={{textAlign: 'center'}}>
  
  <img className="screenshot-full" src="/img/datasource-reference/newui/overview/gdsadd.gif" alt="Overview of Data Sources" />
  
  </div>

3. Once the data source is added, you'll be required to enter the configuration details for establishing a connection to the data source.

   **_Note: For paid plans, configuration entry and saving are necessary to enable availability across [multiple environments](/docs/release-management/multi-environment/)._**

  <div style={{textAlign: 'center'}}>
  
  <img className="screenshot-full" src="/img/datasource-reference/newui/overview/connectinggds.gif" alt="Overview of Data Sources" />
  
  </div>

4. Return to the dashboard, and proceed to create a new application. The recently added data source will be accessible within the query panel under the **Available data sources** section. Data sources that have been added can now be utilized in both **existing** and **newly created applications**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/newui/overview/gdslist.png" alt="Overview of Data Sources" />
  
  </div>

5. You can now create queries to the connected data sources. Within these queries, the option exists to switch between **distinct connections** associated with the same data source, in cases where multiple connections have been established.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/newui/overview/switch1.gif" alt="Overview of Data Sources" />
  
  </div>

## Default data sources

By default, 4 data sources will be available on every app on ToolJet:

- **[ToolJet Database](/docs/tooljet-database/)**
- **[RestAPI](/docs/data-sources/restapi/)**
- **[Run JavaScript Query](/docs/data-sources/run-js/)**
- **[Run Python Query](/docs/data-sources/run-py/)**

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/newui/overview/defds.png" alt="Data Sources: Overview" />

  </div>

## User Permissions

Changing the **Permissions** for Data Sources is a privilege reserved for **Admins** and **[Super Admins](/docs/Enterprise/superadmin)** within the workspace.

To configure these permissions, navigate to **Workspace Settings** -> **Groups Settings**. Admins and Super Admins have the authority to assign the following permissions to user groups:

<br/>

#### Creation and Deletion of data sources within the workspace

| Permission                    | Description                                                                                                                        |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Just Create**               | Add new data sources and modify existing ones. Delete button will not be visible on hovering over the connected data source.       |
| **Just Delete**               | Remove connected data sources from the workspace. Delete button will show up on hovering over the connected data source.           |
| **Both Create and Delete**    | Add new data sources and remove connected data sources from the workspace.                                                         |
| **Neither Create nor Delete** | No access to the Data Sources page from the Dashboard. Error toast will popup on trying to access the Data Sources page using URL. |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/newui/overview/newpermissions.png" alt="Data Sources: Overview" />

</div>

<br/>

#### Authorization to View or Edit permitted data sources from the Data Source page

| Permission | Description                                                                                                             |
| :--------- | :---------------------------------------------------------------------------------------------------------------------- |
| **View**   | Connect to authorized data sources for their user group. Users can't update the credentials of authorized data sources. |
| **Edit**   | Users can update the credentials of authorized data sources.                                                            |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/newui/overview/viewedit.png" alt="Data Sources: Overview" />

</div>

<br/>

## Changing scope of data sources on an app created on older versions of ToolJet

On ToolJet versions below 2.3.0, the data source connection was made from within the individual apps. To make it backward compatible, we added an option to change the scope of the data sources and make it global data source.

1. When dealing with apps that were created using ToolJet versions prior to 2.3.0, you will notice the presence of the data source manager in the left sidebar of the App Builder.
<div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/leftsidebar.png" alt="Data Sources: Overview" />

  </div>

2. To change the scope, click on the kebab(three-dot) menu situated next to the connected data source. From this menu, select the **change scope** option.
<div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/changescope.png" alt="Data Sources: Overview" />

  </div>

3. After successfully changing the scope of the data source to a global data source, the **data source manager** will be removed from the left sidebar, and you will find the data source in the **query panel** under Global Data Sources. You can now configure the data source from the Data Sources page on the **dashboard**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/queryadd.png" alt="Data Sources: Overview" />

  </div>