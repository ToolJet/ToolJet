---
id: marketplace-plugin-serply
title: Serply
---

Integrating Serply with ToolJet lets applications fetch live Google web and news search results and pull Reddit posts and comment threads. This is useful for building lead research tools, SEO dashboards, market monitoring, and brand tracking apps.

## Connection

To connect with Serply, you will need the **API Key**, which can be generated from **[Serply](https://serply.io)**.

You can optionally set a **Proxy location** (for example US, EU, or GB) to route searches through a specific region. See the **[Serply API documentation](https://serply.io/docs)** for the full list of supported regions and response fields.

## Supported Operations

### Web Search

Returns Google web search results for a query as JSON.

**Required Parameters**

- **Query**: The search query string.

**Optional Parameters**

- **Number of results**: How many results to return, between 10 and 100. Defaults to 10.

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "results": [
    {
      "title": "ToolJet",
      "link": "https://tooljet.com/",
      "description": "ToolJet helps you build enterprise apps, AI agents and workflows in minutes, not months.",
      "position": 1
    }
  ]
}
```

</details>

### News Search

Returns Google news results for a query as JSON.

**Required Parameters**

- **Query**: The news search query string.

**Optional Parameters**

- **Number of results**: How many results to return, between 10 and 100. Defaults to 10.

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "entries": [
    {
      "title": "Ferrari's first ever electric car sold for record $40m",
      "link": "https://news.google.com/rss/articles/...",
      "source": { "href": "https://autos.yahoo.com", "title": "Yahoo Autos" },
      "published": "Sun, 17 Aug 2026 12:04:00 GMT"
    }
  ]
}
```

</details>

### Reddit Post

Fetches a single Reddit post by its ID. The ID is the short code from the post URL, for example `1vfemi1` in `reddit.com/r/Python/comments/1vfemi1/`.

**Required Parameters**

- **Post ID**: The Reddit post ID.

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "title": "Showcase Thread",
  "subreddit": "Python",
  "selftext": "...",
  "score": 12,
  "num_comments": 77
}
```

</details>

### Reddit Comments

Fetches the comment thread of a Reddit post by its ID.

**Required Parameters**

- **Post ID**: The Reddit post ID.

**Optional Parameters**

- **Number of comments**: How many comments to return, between 1 and 100. Defaults to 25.
- **Sort**: Order to return comments in. Best, Top, or New.

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "cached": true,
  "data": [
    { "kind": "Listing", "data": { "children": [ ... ] } },
    { "kind": "Listing", "data": { "children": [ ... ] } }
  ]
}
```

</details>
