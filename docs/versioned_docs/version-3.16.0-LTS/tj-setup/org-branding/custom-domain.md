---
id: custom-domain
title: Custom Domain
---

In a self-hosted deployment of ToolJet, you can configure a custom domain by setting the `TOOLJET_HOST `environment variable.

## Prerequisites

- A running self-hosted instance of ToolJet.

- A registered domain name.

- A configured DNS record pointing your domain to the ToolJet server.


## Configuration Steps

### 1. Set the TOOLJET_HOST Environment Variable

The TOOLJET_HOST variable defines the public URL where ToolJet will be accessible. You need to update this variable with your desired domain.

| variable     | description                                                      |
| ------------ | ---------------------------------------------------------------- |
| TOOLJET_HOST | the public URL of ToolJet client ( eg: `https://app.corp.ai`,`https://corp.ai`,`https://corp.ai/app` ) |


### 2. Restart Services

After setting the environment variable and DNS configurations, restart your ToolJet deployment to apply the changes.


:::info
Custom domains will soon be supported in ToolJet Cloud.
:::