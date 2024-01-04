---
id: v2-migration-guide
title: V2 migration guide
---
# Version 2 migration guide

ToolJet version 2 comes with a bunch of exciting features, with the major ones being:
1. Multi page
2. Multi env
3. Forms widget
4. [Database](/docs/tooljet-database) (Requires opt-in)
5. [Marketplace](/docs/marketplace) (Requires opt-in)

Checkout the latest changelog for v2 [here](https://github.com/ToolJet/ToolJet/releases).

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
## Deployment

Based on your opted deployment method from our [setup doc](/docs/setup/), you can directly deploy v2 without any additional configuration for the default setup.

Additional configuration are only required for the opt-in features mentioned above. You can check the respective documentation of those features for the configuration changes needed.

:::info
Server may take some time to be ready to handle the HTTP request as v2 changes requires some data migrations for the initial deployment. This is automatically triggered as a part of the server boot.
::::

## Deprecations

#### Deployments
- Docker compose deployments with [auto SSL](/docs/1.x.x/setup/docker) is deprecated

## Help and Support
- Feel free to join our highly active **[Slack Community](https://tooljet.com/slack)** or you can also e-mail us at **hello@tooljet.com**.
- If you have found a bug, please create a **[GitHub issue](https://github.com/ToolJet/ToolJet/issues)** for the same.
