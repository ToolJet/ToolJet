---
id: proxy-server
title: Proxy Server
---

# Proxy Server

You can require all network requests to ToolJet go through a reverse proxy server. This ensures your ToolJet instance is safely exposed to the internet.

A reverse proxy can add additional functions that ToolJet does not come with, such as SSO support for certain identity providers, 2FA, or more (depending on the reverse proxy you use).

Setup differs depending on the reverse proxy you choose.

Self-hosted reverse proxy options include but are not limited to:

- [Pomerium](https://www.pomerium.com/docs), which has a [guide for securing Grafana](https://www.pomerium.com/docs/guides/grafana)
- [NGINX](https://docs.nginx.com/nginx/) using their [guide on restricting access with HTTP basic authentication](https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-http-basic-authentication/)
- [OAuth2 proxy](https://github.com/oauth2-proxy/oauth2-proxy)
