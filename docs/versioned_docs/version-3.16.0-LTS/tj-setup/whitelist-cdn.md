---
id: whitelist-cdn-domains
title: Whitelist CDN Domains
---

<div className="badge badge--self-hosted">   
 <span>Self Hosted</span>
</div>

You can import an external library in of your preference to extend your app's functionality. ToolJet supports [jsDelivr](https://www.jsdelivr.com/) and [Skypack](https://www.skypack.dev/) by default but you can load any other library by simply whitelisting the CDN URL. Learn how to import libraries using CDNs by following our [Importing External Libraries](/docs/how-to/import-external-libraries-using-runjs) guide.

To do this, set the CSP_WHITELISTED_DOMAINS environment variable with your custom CDN domains. Once configured, ToolJet automatically updates the Content Security Policy (CSP) headers to include the approved CDN. This ensures secure loading of external libraries while maintaining CSP compliance.

| Variable | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| CSP_WHITELISTED_DOMAINS | CDN domains ( eg: cdn.example.com, assets.mycompany.com, static.customcdn.net) |

:::note
The ability to Whitelist CDN Domains from the UI is coming soon!
:::