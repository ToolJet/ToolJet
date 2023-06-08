---
id: tooljet-cli
title: ToolJet CLI
---

ToolJet CLI is a powerful tool that empowers developers to effortlessly create and enhance Marketplace plugins for ToolJet workspace.

:::info
Starting from ToolJet CLI version 0.0.14, a significant update has been made. The previous version, 0.0.13 and lower, focused on building datasource plugins. However, with the introduction of v0.0.14, functionality to create datasource plugins has been removed, and now the CLI prioritizes the creation of marketplace plugins by default.
:::

## Installation

In order to manage plugins for the ToolJet marketplace, including creating, updating, and deleting, you will need to utilize **[tooljet-cli](https://www.npmjs.com/package/@tooljet/cli)**. This can be installed via npm by entering the following command:

```bash
npm install -g @tooljet/cli
```

#### Ensure the installation was successful

```bash
tooljet --version
```

## Commands

### info

This command returns the information about where tooljet is being run

```bash
tooljet info
```

### create

This command creates a new plugin.

```bash
tooljet plugin create PLUGIN_NAME
```
:::tip
Read the detailed guide on creating a marketplace plugin [here](/docs/contributing-guide/marketplace/creating-a-plugin).
:::

### delete

This command deletes a plugin.

```bash
tooljet plugin delete PLUGIN_NAME
```

The CLI will prompt developers to verify if the plugin to be deleted is a marketplace plugin before proceeding with the deletion.

### install

Installs a new npm module inside a tooljet plugin

```bash
tooljet plugin install [NPM_MODULE] --plugin <value>
```