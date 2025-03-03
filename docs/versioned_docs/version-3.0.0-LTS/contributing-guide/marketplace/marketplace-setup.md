---
id: marketplace-setup
title: 'Marketplace: Development Setup'
---

The Marketplace offers custom plugins that can be installed in your ToolJet instance. This guide aims to assist you in creating a new plugin for the ToolJet marketplace.

## Requirements
- [Node.js](https://nodejs.org/en/download/) **(v18.18.2)**
- [npm](https://www.npmjs.com/get-npm) **(v9.8.1)**

## Getting started

### Step 1. Setup ToolJet locally

To obtain the ToolJet repository via git, use the command:

```bash
git clone https://github.com/ToolJet/ToolJet.git
```

Next, refer to the appropriate guide for your development environment to follow the Setup instructions:

- **[MacOS](/docs/contributing-guide/setup/macos)**
- **[Docker](/docs/contributing-guide/setup/docker)**
- **[Ubuntu](/docs/contributing-guide/setup/ubuntu)**

### Step 2. Enabling the marketplace for your instance

To enable the marketplace for your ToolJet instance, you need to specify the following environment variables in your **`.env`** file:

#### Marketplace feature enable

Use this environment variable to enable/disable the feature that allows users to use the marketplace.

| variable                   | value             |
| -------------------------- | ----------------- |
| ENABLE_MARKETPLACE_FEATURE | `true` or `false` |

#### Enable Marketplace plugin developement mode

The use of this environment variable facilitates plugin development by enabling automatic builds whenever package changes occur, thus simplifying the development process. Moreover, it also incorporates a reload button that retrieves all the recent local modifications from the file system for installed plugins, making it a valuable feature for improving the overall development experience.

| variable                   | value             |
| -------------------------- | ----------------- |
| ENABLE_MARKETPLACE_DEV_MODE | `true` or `false` |


Please note that the marketplace is not enabled by default. After updating the variable, restart your ToolJet instance. 

For information on running ToolJet on your local machine, please refer to the instructions provided **[here](/docs/contributing-guide/setup/architecture)**. You can access the marketplace by navigating to the **'/integrations'** route.

### Step 3: Installation of tooljet-cli

In order to manage plugins for the ToolJet marketplace, including creating, updating, and deleting, you will need to utilize **[tooljet-cli](https://www.npmjs.com/package/@tooljet/cli)**. This can be installed via npm by entering the following command:
```bash
npm install -g @tooljet/cli

# Ensure the installation was successful
tooljet --version
```

Having completed the environment setup for Marketplace Developer mode, we can proceed to the next section and commence with [developing the first plugin](/docs/contributing-guide/marketplace/creating-a-plugin).


