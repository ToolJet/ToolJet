---
id: overview
title: Overview
---

# Data Sources : Overview

Data Sources pull in and push data to various sources, including databases, external APIs, and services. Once a data source is connected to a workspace, the connection can be shared with any application within that workspace.

ToolJet offers a wide range of data sources. If needed, you can develop and integrate a plugin of your choice or use an available one from the marketplace. Checkout **[Marketplace Overview Guide](/docs/marketplace/marketplace-overview)** for more information.

<img className="screenshot-full" src="/img/datasource-reference/overview/datasources-overview.png" alt="Data Sources: Overview" />

## Connecting Data Sources

1. **Create a new app** from the dashboard, and Click on the **+** button from the query panel.
   <img className="screenshot-full" src="/img/datasource-reference/overview/query-panel.png" alt="Data Sources: Overview" />
   Or you can directly go to the **Data Sources** page from the left sidebar of the dashboard.

2. Within the **Data Sources** page, you'll find various categories of data sources on the left side, including Databases, APIs, Cloud Storages, and plugins. Click on each category to view the list of accessible data sources. As you hover over the desired data source, an **+ Add** button will appear. Upon clicking this button, the selected data source will be integrated into the workspace.
   <img className="screenshot-full" src="/img/datasource-reference/overview/datasources-overview.png" alt="Overview of Data Sources" />

3. Once the data source is added, you'll be required to input the configuration details for establishing a connection. <br/>
   **_Note: For paid plans, configuration entry and saving are necessary to enable availability across [multiple environments](/docs/development-lifecycle/environment/self-hosted/multi-environment)._**
   <img className="screenshot-full" img-m src="/img/datasource-reference/newui/overview/googlesheets-datasource" alt="Overview of Data Sources" />
   <img className="screenshot-full" img m src="/img/datasource-reference/newui/overview/gs-dev" alt="Overview of Data Sources" />

4. Return to your application query panel. The recently added data source will be accessible within the query panel under the **Available data sources** section. Data Sources that have been added can now be utilized in both **existing applications** and **newly created applications**.
   <img className="screenshot-full" src="/img/datasource-reference/overview/available-ds.png" alt="Overview of Data Sources" />

5. At this point, you can create queries to the connected data sources. Within these queries, the option exists to switch between **distinct connections** associated with the same data source, in cases where multiple connections have been established.
   <img className="screenshot-full" src="/img/datasource-reference/newui/overview/switch1.gif" alt="Overview of Data Sources" />

## Default Data Sources

By default, 4 data sources will be available on every app on ToolJet:

- **[ToolJet Database](/docs/tooljet-db/tooljet-database/)**
- **[RestAPI](/docs/data-sources/restapi/)**
- **[Run JavaScript Query](/docs/data-sources/run-js/)**
- **[Run Python Query](/docs/data-sources/run-py/)**

<img className="screenshot-full" src="/img/datasource-reference/newui/overview/defds.png" alt="Data Sources: Overview" />
