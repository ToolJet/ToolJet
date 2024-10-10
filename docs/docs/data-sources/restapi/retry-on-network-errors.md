---
id: retry-on-network-errors
title: Retry on Network Errors
---

ToolJet provides an option to automatically retry REST API requests in case of certain network errors or specific HTTP status codes. By default, this feature is enabled and will retry the request up to 3 times in case of failure. This feature can be toggled on or off at both the data source level and the individual query level. When enabled, retries will occur for the following scenarios:

1. Specific HTTP status codes: 408, 413, 429, 500, 502, 503, 504, 521, 522, 524.
2. Network errors:
   - **ETIMEDOUT**: One of the timeout limits was reached.
   - **ECONNRESET**: Connection was forcibly closed by a peer.
   - **EADDRINUSE**: Could not bind to any free port.
   - **ECONNREFUSED**: Connection was refused by the server.
   - **EPIPE**: The remote side of the stream being written has been closed.
   - **ENOTFOUND**: Couldn't resolve the hostname to an IP address.
   - **ENETUNREACH**: No internet connection.
   - **EAI_AGAIN**: DNS lookup timed out.


You can configure this feature at two levels:
## Data Source Level
In the REST API data source configuration, you'll find a toggle for **Retry on network errors** This sets the default behavior for all queries using this data source.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/datasource-reference/rest-api/rest-api-data-source.png" alt="ToolJet - Data source - REST API" />
</div>

## Query Level
In the query builder for each REST API query, you'll find a similar toggle for for **Retry on network errors** under the **Settings** tab. This sets the behavior for that specific query.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/datasource-reference/rest-api/query-builder-retry.png" alt="ToolJet - Data source - REST API" />
</div>

:::info
If the data source-level configuration is enabled but a specific query has it disabled, the query-level setting takes precedence.
:::