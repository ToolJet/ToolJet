---
id: marketplace-plugin-datacircle
title: Datacircle
---

Datacircle can be integrated with ToolJet to read the [Datacircle](https://datacircle.dev) sheet of GTM APIs: every API, who is best for each, and every plan with its price and score.

## Connection

The Datacircle API needs no key. Install the plugin, add the data source and press **Test connection**. The API is at `https://api.datacircle.dev/v1` and its spec is at [api.datacircle.dev/v1/openapi.json](https://api.datacircle.dev/v1/openapi.json).

## Supported Operations

Choose an operation in the query editor. Each one is a GET call.

- **List the APIs**: every API on the sheet.
- **Who is best for an API**: the plans of one API, best first. Set the `slug` path parameter, for example `linkedin-profile`.
- **List the plans**: every plan, filtered by API, provider or price.
- **One provider**: the ranks of one provider. Set the `slug` path parameter.

At most 60 calls a minute from one address.
