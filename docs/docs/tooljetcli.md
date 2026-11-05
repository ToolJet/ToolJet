---
id: tooljet-cli
title: ToolJet CLI
---

ToolJet CLI is a powerful tool that empowers developers to effortlessly create and enhance Marketplace plugins for ToolJet workspace. You can also use it to build and publish custom component libraries.

:::info
Starting from ToolJet CLI version 0.0.14, the creation of datasource plugins has been deprecated to prioritize marketplace plugins. This change enhances the plugin development experience and aligns with ToolJet's roadmap.
:::

## Installation

In order to manage plugins for the ToolJet marketplace, including creating, updating, and deleting, you will need to utilize **[tooljet-cli](https://www.npmjs.com/package/@tooljet/cli)**. This can be installed via npm by entering the following command:

```bash
npm install -g @tooljet/cli
```

The CLI needs Node.js 18 or later.

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

Run the `plugin` commands from inside a clone of the [ToolJet repository](https://github.com/ToolJet/ToolJet). They read and write plugin files relative to the repository root.

### info

This command returns the information about where tooljet is being run

```bash
tooljet info
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/info.png" alt="ToolJet CLI info" />

</div>

### create

This command creates a new plugin.

```bash
tooljet plugin create PLUGIN_NAME
```
:::tip
Read the detailed guide on creating a marketplace plugin [here](/docs/contributing-guide/marketplace/creating-a-plugin).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/create.gif" alt="ToolJet CLI : create plugin" />

</div>

### delete

This command deletes a plugin.

```bash
tooljet plugin delete PLUGIN_NAME
```

The CLI will prompt developers to verify if the plugin to be deleted is a marketplace plugin before proceeding with the deletion.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/delete.gif" alt="ToolJet CLI: delete plugin" />

</div>

### install

Installs a new npm module inside a tooljet plugin

```bash
tooljet plugin install [NPM_MODULE] --plugin <value>
```

## Custom Component Library Commands

These commands build and publish React components to your workspace. `lib` is an alias for `library`, so `tooljet lib publish` and `tooljet library publish` are the same command.

| <div style={{ width:"250px"}}> Command </div> | <div style={{ width:"120px"}}> Run From </div> | <div style={{ width:"300px"}}> What It Does </div> |
|:---------- | :---------- | :------------ |
| `tooljet login` | Anywhere | Signs the CLI in to a ToolJet workspace with a personal access token. |
| `tooljet library init <dir>` | Anywhere | Registers a library in the workspace and creates the project. |
| `tooljet library build` | Library directory | Builds to `dist/`. No sign-in needed and nothing is uploaded. |
| `tooljet library dev` | Library directory | Watches `src/` and uploads to your dev track on every save. |
| `tooljet library publish -v <version>` | Library directory | Builds and publishes a new version. |

To get started, see [Custom Component Libraries](/docs/app-builder/custom-component-library/overview). For every flag and limit, see the [CLI Reference](/docs/app-builder/custom-component-library/cli-reference).
