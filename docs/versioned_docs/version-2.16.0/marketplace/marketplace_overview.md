---
id: marketplace-overview
title: 'Marketplace : Overview'
---

# Marketplace : Overview

With ToolJet Marketplace, ToolJet users can conveniently add custom plugins (datasources) to their workspaces. This feature enables users to create plugins that cater to their specific needs and integrate them seamlessly with ToolJet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/overview/marketplace.png" alt="Marketplace" />

</div>

## Enabling the Marketplace 

To **Enable** the marketplace feature, users need to add the following environment variable to their **[`.env`](/docs/setup/env-vars#marketplace)** file:

```bash
ENABLE_MARKETPLACE_FEATURE=true
```

Once the marketplace feature has been activated, a Marketplace icon will appear on the left-hand sidebar of the dashboard, providing users with access to the Marketplace.

When running ToolJet locally, ensure that all the plugins are available. Specifically, building the marketplace and then starting the server is mandatory.

:::info Note
The user logged-in should be the **Administrator** to access the marketplace page.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/overview/icon.png" alt="Marketplace" />

</div>

## Installing a plugin

The Marketplace page will contain two tabs: **Installed** and **Marketplace**. 

Under the **Marketplace** tab, you will see a list of all the available plugins that can be installed on the workspace. To install a plugin, click on the **Install** button on the plugin's card. Once the installation is complete, the status will change from Install to **Installed**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/overview/allplugins.png" alt="Marketplace" />

</div>

## Using Marketplace plugins

You can access any installed plugins by following these steps:

- Navigate to the **Global Datasources** Page.
- Click on the **Add new datasource** button.
- Open the **Plugins** tab in the modal that appears.
- From here, you can connect to any of the plugins that were installed from the Marketplace.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/overview/gdsplugin.png" alt="Marketplace" />

</div>

- After successfully connecting to a plugin, you can access it under the Global Datasource section when creating queries.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/overview/query.png" alt="Marketplace" />

</div>

## Removing a plugin

:::caution
If you remove a plugin, all the queries associated with it will be eliminated from all the applications.
:::

To remove a plugin, follow these steps:
- Go to the Marketplace page from the dashboard.
- Go to the **Installed** tab and click on the **Remove** button next to the plugin that you want to remove.
- By doing so, the plugin will be removed from the global datasource section, and no user will be able to establish a connection with it.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/overview/remove.png" alt="Marketplace" />

</div>

## Available Plugins
- **[GitHub](/docs/marketplace/plugins/marketplace-plugin-github)**
- **[OpenAI](/docs/marketplace/plugins/marketplace-plugin-openai)**
- **[Plivo](/docs/marketplace/plugins/marketplace-plugin-plivo)**

:::info For Plugin Developers
Refer to the **[Plugin Development guide](/docs/contributing-guide/marketplace/marketplace-setup)** to learn how to create plugins for the ToolJet Marketplace.
:::