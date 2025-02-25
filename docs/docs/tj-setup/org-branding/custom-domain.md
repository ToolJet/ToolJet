---
id: custom-domain
title: Custom Domain
---

In a self-hosted deployment of ToolJet, you can configure a custom domain by setting the `TOOLJET_HOST `environment variable.

## Prerequisites

- A running self-hosted instance of ToolJet

- A registered domain name

- A configured DNS record pointing your domain to the ToolJet server


## Configuration Steps

### 1. Set the TOOLJET_HOST Environment Variable

The TOOLJET_HOST variable defines the public URL where ToolJet will be accessible. You need to update this variable with your desired domain.

| variable     | description                                                      |
| ------------ | ---------------------------------------------------------------- |
| TOOLJET_HOST | the public URL of ToolJet client ( eg: https://app.corp.ai ) |

## 2. Configure DNS

Ensure that your domain name is correctly pointing to the ToolJet server by updating the DNS records:

- For a domain (e.g., `your-custom-domain.com`):

    - Create an A record pointing to your server's IP address.

- For a subdomain (e.g., `app.your-domain.com`):

    - Create a CNAME record pointing to your server's hostname.

## 3. Restart Services

After setting the environment variable and DNS configurations, restart your ToolJet deployment to apply the changes.