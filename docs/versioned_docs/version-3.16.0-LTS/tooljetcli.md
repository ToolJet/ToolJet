---
id: tooljet-cli
title: ToolJet CLI
---

ToolJet CLI is a powerful tool that empowers developers to effortlessly create and enhance Marketplace plugins for ToolJet workspace.

:::info
Starting from ToolJet CLI version 0.0.14, the creation of datasource plugins has been deprecated to prioritize marketplace plugins. This change enhances the plugin development experience and aligns with ToolJet's roadmap.
:::

:::info
You can also use the ToolJet CLI to build and publish React components to your workspace. The `login` and `library` commands are only in the beta release, `@tooljet/cli@0.0.15-beta.1`. The latest stable release, `0.0.14`, which the command below installs, has only the commands on this page. See [Custom Component Libraries](/docs/app-builder/custom-component-library/overview).
:::

## Installation

In order to manage plugins for the ToolJet marketplace, including creating, updating, and deleting, you will need to utilize **[tooljet-cli](https://www.npmjs.com/package/@tooljet/cli)**. This can be installed via npm by entering the following command:

```bash
npm install -g @tooljet/cli
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/install.png" alt="ToolJet CLI installation" />

</div>

#### Ensure the installation was successful

```bash
tooljet --version
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/version.png" alt="ToolJet CLI version check" />

</div>

## Commands

Run the `plugin` commands from the root of your local ToolJet repository. They read and write paths relative to the current directory, such as `marketplace/`, `plugins/` and `server/src/assets/marketplace/plugins.json`.

### info

This command returns the information about where tooljet is being run

```bash
tooljet info
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/info.png" alt="ToolJet CLI info" />

</div>

### create

This command creates a new marketplace plugin in `marketplace/plugins/<PLUGIN_NAME>` and adds it to `server/src/assets/marketplace/plugins.json`.

```bash
tooljet plugin create PLUGIN_NAME [--type database|api|cloud-storage] [-b]
```

| Argument or flag | Description |
|:--|:--|
| `PLUGIN_NAME` | Required. The plugin ID. It can't be a number. |
| `--type` | Plugin type: `database`, `api` or `cloud-storage`. If you omit it, the CLI asks you to select one. |
| `-b`, `--build` | Runs `npm run build --workspaces` in `marketplace/` after the plugin is created. |

The CLI prompts for **Enter plugin display name**, which can't be a number, and, if you didn't pass `--type`, **select a type**.

The command fails if `marketplace/`, `docs/` or `marketplace/_templates/` is missing from the current directory, or if `plugins.json` already has a plugin with the same ID (case-insensitive).

:::tip
Read the detailed guide on creating a marketplace plugin [here](/docs/contributing-guide/marketplace/creating-a-plugin).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/create.gif" alt="ToolJet CLI : create plugin" />

</div>

### delete

This command deletes a plugin.

```bash
tooljet plugin delete PLUGIN_NAME [-m] [-b]
```

| Argument or flag | Description |
|:--|:--|
| `PLUGIN_NAME` | Required. The plugin's directory name. For a marketplace plugin, it must also match the plugin's `name` in `plugins.json`. |
| `-m`, `--marketplace` | Treats the plugin as a marketplace plugin and skips the **Is this a marketplace plugin?** prompt. |
| `-b`, `--build` | Rebuilds after deleting: `npm run build --workspaces` in `marketplace/` for a marketplace plugin, otherwise `npm run build:plugins`. |

Without `-m`, the CLI asks **Is this a marketplace plugin?** (default: no). It then asks you to confirm the deletion.

- **Marketplace plugin**: Deletes `marketplace/plugins/<PLUGIN_NAME>` and removes its entry from `server/src/assets/marketplace/plugins.json`.
- **Other plugin**: Deletes `plugins/packages/<PLUGIN_NAME>` and `docs/docs/data-sources/<PLUGIN_NAME>.md`.

:::warning
For a marketplace plugin, the CLI doesn't check that the plugin exists. If no entry in `plugins.json` has a `name` matching `PLUGIN_NAME`, it removes the last entry in the file instead. Check the name before you confirm.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/delete.gif" alt="ToolJet CLI: delete plugin" />

</div>

### install

Installs an npm module into a plugin by running `npm i <NPM_MODULE>` in `plugins/packages/<PLUGIN>`.

```bash
tooljet plugin install NPM_MODULE --plugin PLUGIN
```

Both `NPM_MODULE` and `--plugin` are required. `--plugin` is the plugin's directory name under `plugins/packages/`. This command doesn't find marketplace plugins in `marketplace/plugins/`. If the plugin directory doesn't exist, the command fails with `Plugin not found, make sure that you are running this command in Tooljet directory`.
