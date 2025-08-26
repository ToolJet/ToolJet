---
id: marketplace-plugin-prometheus
title: Prometheus
---

ToolJet integrates with Prometheus to help you fetch and display metrics in your app. You can use this plugin to run PromQL queries and show real-time or historical data from your Prometheus server. It’s useful for building internal dashboards to monitor systems and track performance.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

Follow the steps in the [Prometheus documentation](https://prometheus.io/docs/prometheus/latest/getting_started/) to set up and run a Prometheus server.

To connect Prometheus with ToolJet, you’ll need the following details:

- **Prometheus server URL**
- **Username**
- **Password**
- **CA certificate**

<img className="screenshot-full img-l" src="/img/marketplace/plugins/prometheus/connection.png" alt="Configuring Prometheus in ToolJet" />

Once connected, you can start using instant and range queries to fetch metric data from your server.

## Supported Operations

- [Instant Query with PromQL](#instant-query-with-promql)
- [Range Query with PromQL](#range-query-with-promql)

### Instant Query with PromQL

Fetches the current value of a metric at a single point in time.

**Required Parameters**

- **Query**: A valid PromQL expression to fetch the metric.
- **Request method**: Defines how the request is sent (GET or POST)

**Optional Parameter**

- **Time**: Specific timestamp to evaluate the query against.
- **Timeout**: Maximum duration the query is allowed to run before timing out.
- **Limit**: Restricts the number of results returned.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/prometheus/instant.png" alt="Instant Query with PromQL in ToolJet" />

### Range Query with PromQL

Retrieves metric data over a specified time range.

**Required Parameters**

- **Query**: A valid PromQL expression to fetch the metric.
- **Start**: Start timestamp of the time range.
- **End**: End timestamp of the time range.
- **Step**: Interval between data points within the time range.
- **Request method**: Defines how the request is sent (GET or POST).

**Optional Parameter**

- **Timeout**: Maximum duration the query is allowed to run before timing out.
- **Limit**: Restricts the number of results returned.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/prometheus/range.png" alt="Range Query with PromQL in ToolJet" />
