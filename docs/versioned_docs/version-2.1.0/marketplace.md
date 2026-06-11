---
id: marketplace
title: Marketplace
---

# ToolJet Marketplace

ToolJet marketplace for plugins will allow users to install the custom plugins (datasources) for their ToolJet instances. This will allow ToolJet users to build their own custom plugins according to their requirements and then easily connect them to ToolJet.

## Enabling the marketplace for your instance

Users must add the following environment variable to the [`.env`](/docs/setup/env-vars#marketplace-feature-enable--optional-) file to enable the marketplace feature:

```bash
ENABLE_MARKETPLACE_FEATURE=true
```

Once the marketplace feature is enabled, users can open the **Marketplace** page from the dropdown on the navbar of the dashboard. Users can also directly access the marketplace using the URL: `https://tooljet.yourcompany.com/integrations`

:::info
The user logged-in should be the **Administrator** to access the marketplace page.
:::

## Installing a plugin

When you [create a plugin](#creating-a-marketplace-plugin) using the [tooljet cli](https://www.npmjs.com/package/@tooljet/cli), an object is created in the **plugins.json** (`ToolJet/server/src/assets/marketplace/plugins.json`) file for that particular plugin.

Here's an example of an entry created for AWS S3 plugin:

```json
[
  {
    "name": "AWS S3 plugin",
    "description": "Datasource plugin for AWS S3",
    "version": "1.0.0",
    "id": "s3",
    "repo": "",
    "author": "Tooljet",
    "timestamp": "Mon, 31 Oct 2022 11:02:10 GMT"
  }
]
```

Now to install the plugin to the marketplace, you'll have to install npm package to a plugin:

```bash
npm i <npm-package-name> --workspace=<plugin-name-in-package-json>
```

Finally, run the build commands:

```bash
npm install
npm run build --workspaces
```

Once done, you'll find the plugin on the marketplace page.


## Removing a plugin

To remove a plugin from the marketplace, you can simply remove the object entry of the plugin from the **plugins.json**(`ToolJet/server/src/assets/marketplace/plugins.json`) and then re-run the build commands.

## Using a plugin as datasource

The flow for installing and using a plugin as a datasource is really simple. The steps are:
- Go to the **Marketplace**
- Click the Marketplace link in the left sidebar to view all available plugins.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/marketplace/marketplacemain.png" alt="Marketplace" />

    </div>
- Click on the **Install** button of the plugin that you want to install
- Once installed, you can check the installed plugins from **Installed** on the left sidebar. You can also **remove** the plugins from the Installed section of the marketplace.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/marketplace/installed.png" alt="Installed plugins" />

    </div>
- Now, let's use the installed plugin as the datasource for an application. User will have to open the application, go to the **Add Datasource** button on the left sidebar of the app builder, and then select Plugins on the modal that pops-up. The Plugins section will include all the plugins installed via Marketplace. The next steps are same as connecting a datasource to the application.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/marketplace/datasource.png" alt="Installed plugins as datasource" />

    </div>

## Creating a marketplace plugin

The steps for creating a Marketplace plugin are similar to those for creating [plugins for ToolJet](/docs/2.1.0/contributing-guide/tutorials/creating-a-plugin/) except that for a Marketplace plugin, the user will have to type `yes` when prompted `Is it a marketplace integration?` in the `tooljet command line`.

The steps to create a marketplace plugin are:

- Install [tooljet-cli](https://www.npmjs.com/package/@tooljet/cli):
  ```bash
  npm i -g @tooljet/cli
  ```
- Bootstrap a new plugin using cli
  ```bash
  tooljet plugin create bigquery
  ```
- On the CLI, you'll be prompted to enter a display name:
  ```bash
  Enter plugin display name:
  ```
- In the next step, you'll be asked to choose a plugin type **database**, **api**, or **cloud-storage**
- Now choose if `Is it a marketplace integration?` by entering `y/N`
- Enter the repository URL if the plugin is hosted on GitHub or else just press enter to skip to the next step
- Once done, all the plugin files will be generated inside the marketplace directory
  ```bash
  creating plugin... done
  Plugin: bigquery created successfully
  └─ marketplace
    └─ plugin
        └─ bigquery
  ```

:::info
For more information on **[creating plugin for ToolJet](/docs/contributing-guide/tutorials/creating-a-plugin)**, please see the documentation on creating plugins.
:::