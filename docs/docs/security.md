---
id: security
title: Security
slug: /security
---

# Security

## Data storage

ToolJet does not store data returned from your data sources. ToolJet server acts as a proxy and passes the data as it is to the ToolJet client. The credentials for the data sources are handled by the server and never exposed to the client. For example, if you are making an API request, the query is run from the server and not from the frontend.

## Datasource credentials
All the datasource credentials are securely encrypted using `aes-256-gcm`. The credentials are never exposed to the frontend ( ToolJet client ).

## Other security features
- **TLS**: If you are using ToolJet cloud, all connections are encrypted using TLS. We also have documentation for setting up TLS for self-hosted installations of ToolJet.
- **Audit logs**: Audit logs are available on the enterprise edition of ToolJet. Every user action is logged along with the IP addresses and user information.
- **Request logging**: All the requests to server are logged. If self-hosted, you can easily extend ToolJet to use your preferred logging service. ToolJet comes with built-in Sentry integration.
- **Whitelisted IPs**: If you are using ToolJet cloud, you can whitelist our IP address (3.129.198.40) so that your datasources are not exposed to the public.
- **Backups**: ToolJet cloud is hosted on AWS using EKS with autoscaling and regular backups.

If you notice a security vulnerability, please let the team know by sending an email to `security@tooljet.com`. 
