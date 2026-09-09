---
id: marketplace-plugin-firecrawl
title: Firecrawl
---

[Firecrawl](https://docs.firecrawl.dev) turns websites into LLM-ready data. Connecting Firecrawl to ToolJet lets your apps scrape a single page, search the web, discover the URLs of a site, and crawl a whole site — and use the returned markdown or JSON like any other query result.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect with Firecrawl, the following credentials are used:

- **API Key**: API key for Firecrawl can be generated from the [Firecrawl dashboard](https://www.firecrawl.dev/app/api-keys). Required when using Firecrawl Cloud. It can be left empty for a [self-hosted](https://docs.firecrawl.dev/contributing/self-host) instance, which runs without authentication by default.
- **API URL** (optional): Defaults to `https://api.firecrawl.dev`. Set it only to point the datasource at a self-hosted Firecrawl instance, for example `http://localhost:3002`.

:::info
A custom **API URL** is only available on self-hosted ToolJet — on ToolJet Cloud the datasource always talks to Firecrawl Cloud. Custom URLs are also checked against ToolJet's SSRF rules, which block loopback and cloud metadata addresses: reach a local instance via its hostname (`http://localhost:3002`) rather than `http://127.0.0.1:3002`.
:::

Testing the connection calls Firecrawl's credit usage endpoint, or — when a custom **API URL** is set — the readiness endpoint of that instance, which needs no API key.

## Supported Operations

### Scrape URL

Use this operation to fetch the content of a single page.

**Required Parameter**

- **URL:** The page to scrape.

**Optional Parameters**

- **Formats:** JSON array of the formats to return, for example `["markdown", "links"]`. Defaults to `["markdown"]`. Note that `summary` returns an LLM-generated summary of the page rather than its full text.
- **Options:** JSON object of any other [scrape option](https://docs.firecrawl.dev/features/scrape), for example `{ "onlyMainContent": false, "waitFor": 1000 }`. `onlyMainContent` is enabled by default and strips navigation and boilerplate; turn it off if a page comes back nearly empty.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
{
    "markdown": "# Firecrawl Docs\n\nFirecrawl turns websites into LLM-ready data...",
    "metadata": {
        "title": "Firecrawl Docs",
        "description": "Firecrawl docs, API reference and examples.",
        "sourceURL": "https://docs.firecrawl.dev",
        "statusCode": 200,
        "creditsUsed": 1
    }
}
```
</details>

### Search the web

Use this operation to run a web search and get back the matching results.

**Required Parameter**

- **Query:** The search query.

**Optional Parameters**

- **Sources:** JSON array of sources to search, for example `["web", "news"]`. Defaults to `["web"]`.
- **Limit:** Maximum number of results per source.
- **Options:** JSON object of any other [search option](https://docs.firecrawl.dev/features/search), for example `{ "tbs": "qdr:w", "location": "Germany" }`. Pass `scrapeOptions` here to scrape each result in the same request — the results then come back as documents, with the URL and title under `metadata`.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
{
    "web": [{
        "url": "https://tooljet.com/",
        "title": "ToolJet | Build Full-Stack Enterprise Apps in Minutes",
        "description": "Build full-stack enterprise internal apps in minutes..."
    }]
}
```
</details>

### Map site URLs

Use this operation to list the URLs of a site without fetching the content of each page.

**Required Parameter**

- **URL:** The site to map.

**Optional Parameters**

- **Search:** A term used to rank the discovered URLs by relevance.
- **Limit:** Maximum number of URLs to return.
- **Options:** JSON object of any other [map option](https://docs.firecrawl.dev/features/map), for example `{ "includeSubdomains": true, "sitemap": "include" }`.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
{
    "links": [{
        "url": "https://docs.firecrawl.dev/features/scrape",
        "title": "Scrape | Firecrawl",
        "description": "Turn any url into clean data"
    }]
}
```
</details>

### Start crawl

Use this operation to start crawling a site. Crawls run asynchronously: this operation queues the job and returns its ID, which you pass to **Get crawl status** to collect the results.

**Required Parameter**

- **URL:** The site to crawl.

**Optional Parameters**

- **Limit:** Maximum number of pages to crawl. Defaults to **50**. Each page crawled costs a credit, so this default is deliberately lower than Firecrawl's own default of 10,000 pages — raise it when you want a bigger crawl.
- **Options:** JSON object of any other [crawl option](https://docs.firecrawl.dev/features/crawl), for example `{ "includePaths": ["^/blog/.*$"], "maxDiscoveryDepth": 2 }`. A `limit` set here takes precedence over the **Limit** field, but it is validated the same way and cannot remove the cap — a crawl always sends a limit.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
{
    "id": "6c2f4d0e-8f4a-4a7f-9f3f-2f4a1b9c0d11",
    "url": "https://api.firecrawl.dev/v2/crawl/6c2f4d0e-8f4a-4a7f-9f3f-2f4a1b9c0d11"
}
```
</details>

### Get crawl status

Use this operation to check the progress of a crawl and read the pages it has scraped so far.

**Required Parameter**

- **Job ID:** The crawl job ID returned by **Start crawl**, for example `{{queries.startCrawl.data.id}}`.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
{
    "status": "completed",
    "completed": 2,
    "total": 2,
    "creditsUsed": 2,
    "data": [{
        "markdown": "# Scrape\n\nTurn any url into clean data...",
        "metadata": {
            "sourceURL": "https://docs.firecrawl.dev/features/scrape",
            "statusCode": 200
        }
    }]
}
```
</details>
