---
id: marketplace-overview
title: 'Marketplace: Overview'
---

# Marketplace: Overview

With ToolJet Marketplace, ToolJet users can conveniently add custom plugins (data sources) to their workspaces. This feature enables users to create plugins that cater to their specific needs and integrate them seamlessly with ToolJet.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/overview/marketplace-v2.png" alt="Marketplace Overview" />
</div>

## Enabling Marketplace 

To **Enable** the marketplace feature, users need to add the following environment variable to their **[`.env`](/docs/setup/env-vars#marketplace)** file:

```bash
ENABLE_MARKETPLACE_FEATURE=true
```

When running ToolJet locally, ensure that all the plugins are available by building marketplace before starting the server.

:::info Note
The logged-in user should be an **Administrator** to access the marketplace page.
:::

## Installing a plugin

To navigate to the Marketplace page, click on the settings icon on the bottom left of the dashboard, and click on **Marketplace** from the selection menu.

The Marketplace page will contain two tabs: **Installed** and **Marketplace**. 

Under the **Marketplace** tab, you will see a list of all the available plugins that can be installed on the workspace. To install a plugin, click on the **Install** button on the plugin's card. Once the installation is complete, the status will change from Install to **Installed**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/overview/allplugins-v2.png" alt="List of All Plugins" /> 
</div>

## Using Marketplace Plugins

You can access any installed plugins by following these steps:

- Navigate to the **Data sources** tab in the dashboard.
- Scroll down to **Plugins**.

You can now see the list of installed marketplace plugins that you can configure as data sources.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/overview/installed-plugins.png" alt="Installed plugins" />
</div>

- After successfully configuring a plugin, you can access it when trying to add a new query from the Query Panel.

<!-- <div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/overview/add-query.png" alt="Marketplace" />
</div> -->

## Removing a Plugin

:::caution
If you remove a plugin, all the queries associated with it will be eliminated from all the applications.
:::

To remove a plugin, follow these steps:
- Click on the settings icon on the bottom left of the dashboard, and click on `Marketplace` from the selection menu.
- On the `Installed` page, click on the `Remove` button of the related plugin that you wish to remove.

## Available Plugins
- **[AWS Redshift](/docs/marketplace/plugins/marketplace-plugin-redshift)**
- **[AWS Textract](/docs/marketplace/plugins/marketplace-plugin-textract)**
- **[AWS Lambda](/docs/marketplace/plugins/marketplace-plugin-aws-lambda)**
- **[Engagespot](/docs/marketplace/plugins/marketplace-plugin-engagespot)**
- **[GitHub](/docs/marketplace/plugins/marketplace-plugin-github)**
- **[HarperDB](/docs/marketplace/plugins/marketplace-plugin-harperdb)**
- **[OpenAI](/docs/marketplace/plugins/marketplace-plugin-openai)**
- **[Plivo](/docs/marketplace/plugins/marketplace-plugin-plivo)**

:::info For Plugin Developers
Refer to the **[Plugin Development guide](/docs/contributing-guide/marketplace/marketplace-setup)** to learn how to create plugins for the ToolJet Marketplace.
:::