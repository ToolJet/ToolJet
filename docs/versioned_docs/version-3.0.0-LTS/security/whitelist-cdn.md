---
id: whitelist-cdn
title: Whitelist CDN Domains
---

ToolJet allows importing external libraries via [jsDelivr](https://www.jsdelivr.com/) or [Skypack](https://www.skypack.dev/). If you need to load resources from other CDN URLs, you must whitelist them.

To do this, set the CSP_WHITELISTED_DOMAINS environment variable with your custom CDN domains. Once configured, ToolJet automatically updates the Content Security Policy (CSP) headers to include the approved CDN URLs—no server restarts required. This ensures secure loading of external libraries while maintaining CSP compliance.

| Variable | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| CSP_WHITELISTED_DOMAINS | CDN domains ( eg: cdn.example.com, assets.mycompany.com, static.customcdn.net) |


:::note
The ability to Whitelist CDN Domains from the UI is coming soon!
:::