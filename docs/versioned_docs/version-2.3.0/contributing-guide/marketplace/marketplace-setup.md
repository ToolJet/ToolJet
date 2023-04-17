---
id: marketplace-setup
title:  'Marketplace: Setup'
---

The Marketplace offers custom plugins that can be installed in your ToolJet workspace. This guide aims to assist you in creating a new plugin for the ToolJet marketplace.

## Requirements
- [Node.js](https://nodejs.org/en/download/) **(v18.3.0)**
- [npm](https://www.npmjs.com/get-npm) **(v8.11.0)**

## Getting started

### Step 1. Enabling the marketplace for your instance

In order to **activate** the marketplace for your ToolJet instance, you must set the following evironment variables in your **`.env`** file:

#### Marketplace feature enable

Use this environment variable to enable/disable the feature that allows users to use the [marketplace](/docs/marketplace).

| variable                   | value             |
| -------------------------- | ----------------- |
| ENABLE_MARKETPLACE_FEATURE | `true` or `false` |

#### Enable Marketplace plugin developement mode

Use this environment variable to enable/disable the developement mode that allows developers to build the plugin.

| variable                   | value             |
| -------------------------- | ----------------- |
| ENABLE_MARKETPLACE_DEV_MODE | `true` or `false` |


Please note that the marketplace is not enabled by default. After updating the variable, restart your ToolJet instance. 

For information on running ToolJet on your local machine, please refer to the instructions provided **[here](/docs/category/contributing-guide)**. You can access the marketplace by navigating to the **'/integrations'** route.

### Step 2: Installation of tooljet-cli

To create and publish plugins for the ToolJet marketplace, you will need to utilize **[tooljet-cli](https://www.npmjs.com/package/@tooljet/cli)**. This can be installed via npm by entering the following command:
```bash
npm install -g tooljet-cli

# Ensure the installation was successful
tooljet --version
```

**Now that we have finished setting up the environment for Marketplace Developer mode, we can move on to the next section and begin [developing the first plugin](/docs/contributing-guide/marketplace/creating-a-plugin).**


