---
id: overview
title: Overview
---

# Data Sources : Overview

Data sources pull in and push data to various sources, including databases, external APIs, and services. Once a data source is connected to a workspace, the connection can be shared with any application within that workspace.

ToolJet offers a wide range of data sources. If needed, you can develop and integrate a plugin of your choice or use an available one from the marketplace. Checkout **[Marketplace Overview Guide](/docs/marketplace/marketplace-overview)** for more information.

<img className="screenshot-full" src="/img/datasource-reference/overview/overview-v2.png" alt="Data Sources: Overview" />

## Connecting data sources

1. **Create a new app** from the dashboard, and Click on the **+** button from the query panel.
    <img className="screenshot-full" src="/img/datasource-reference/overview/query-panel.png" alt="Data Sources: Overview" />
    Or you can directly go to the **Data Sources** page from the left sidebar of the dashboard.

2. Within the **Data Sources** page, you'll find various categories of data sources on the left side, including Databases, APIs, Cloud Storages, and plugins. Click on each category to view the list of accessible data sources. As you hover over the desired data source, an **+ Add** button will appear. Upon clicking this button, the selected data source will be integrated into the workspace.
    <img className="screenshot-full" src="/img/datasource-reference/newui/overview/gdsadd-v2.png" alt="Overview of Data Sources" />
  
3. Once the data source is added, you'll be required to input the configuration details for establishing a connection. <br/>
    ***Note: For paid plans, configuration entry and saving are necessary to enable availability across [multiple environments](/docs/development-lifecycle/environment/self-hosted/multi-environment).***
    <img className="screenshot-full" src="/img/datasource-reference/newui/overview/connectinggds-v2.gif" alt="Overview of Data Sources" />
  
4. Return to your application query panel. The recently added data source will be accessible within the query panel under the **Available data sources** section. Data Sources that have been added can now be utilized in both **existing applications** and **newly created applications**.
    <img className="screenshot-full" src="/img/datasource-reference/overview/available-ds.png" alt="Overview of Data Sources" />
  
5. At this point, you can create queries to the connected data sources. Within these queries, the option exists to switch between **distinct connections** associated with the same data source, in cases where multiple connections have been established.
    <img className="screenshot-full" src="/img/datasource-reference/newui/overview/switch1.gif" alt="Overview of Data Sources" />

## Default data sources

By default, 4 data sources will be available on every app on ToolJet:
- **[ToolJet Database](/docs/tooljet-db/tooljet-database/)**
- **[RestAPI](/docs/data-sources/restapi/)**
- **[Run JavaScript Query](/docs/data-sources/run-js/)**
- **[Run Python Query](/docs/data-sources/run-py/)**

<img className="screenshot-full" src="/img/datasource-reference/newui/overview/defds.png" alt="Data Sources: Overview" />

## Changing Scope of Data Sources on an App Created on Older Versions of ToolJet

On ToolJet versions below 2.3.0, the data source connection was made from within the individual apps. To make it backward compatible, we added an option to change the scope of the data sources and make it global data source.

1. When dealing with apps that were created using ToolJet versions prior to 2.3.0, you will notice the presence of the data source manager in the left sidebar of the App Builder.
    <img className="screenshot-full" src="/img/datasource-reference/overview/leftsidebar.png" alt="Data Sources: Overview" />

2. To change the scope, locate the kebab menu situated next to the connected data source. From this menu, select the **change scope** option.
    <img className="screenshot-full" src="/img/datasource-reference/overview/changescope.png" alt="Data Sources: Overview" />

3. Once you change the scope of the data source and make it global, you'll see that the **data source manager** is removed from the left sidebar and now you'll find the data source on the **query panel** under Global Data sources. You can now configure the data source from the Data Sources page on the **dashboard**.

4. Once you have successfully changed the scope of the data source, thereby transforming it into a global data source, you will observe that the **data source manager** from the left sidebar is removed. Subsequently, the data source will be accessible within the **query panel** under the Available data sources section. Now you can configure this data source from the Data Sources page located on the **Dashboard**.
    <img className="screenshot-full" src="/img/datasource-reference/overview/queryadd.png" alt="Data Sources: Overview" />
