---
id: metadata-and-cookies
title: Metadata and Cookies
---

## Metadata

Metadata is additional information about the data returned by the REST API. This information includes the request URL, method, headers, and response status code, headers, and body. The metadata can be accessed within queries and components using the `{{queries.<queryname>.metadata}}` syntax.

:::info
While accessing the properties of the metadata object, which contains a hyphen, you can use the bracket notation. For example, to access the `user-agent` property, you can use `{{queries.restapi1.metadata.request.headers["user-agent"]}}` or `{{queries.restapi1.metadata.request.headers."user-agent"}}`.
:::

<details>
<summary>**Example Metadata**</summary>

```json
{
  "request": {
    "url": "https://dummyjson.com/users",
    "method": "GET",
    "headers": {
      "user-agent": "got (https://github.com/sindresorhus/got)",
      "tj-x-forwarded-for": "103.171.99.41",
      "accept-encoding": "gzip, deflate, br"
    },
    "params": {}
  },
  "response": {
    "statusCode": 200,
    "headers": {
      "server": "[REDACTED]",
      "report-to": "{"group":"heroku-nel","max_age":3600,"endpoints":[{"url":"https://nel.heroku.com/reports?ts=1726207652&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&s=1ICCahr5yl4s1cOLwZ5JI7Le2a5Hp57L8DugEP6oEZQ%3D"}]}",
      "reporting-endpoints": "heroku-nel=https://nel.heroku.com/reports?ts=1726207652&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&s=1ICCahr5yl4s1cOLwZ5JI7Le2a5Hp57L8DugEP6oEZQ%3D",
      "nel": "{"report_to":"heroku-nel","max_age":3600,"success_fraction":0.005,"failure_fraction":0.05,"response_headers":["Via"]}",
      "connection": "close",
      "access-control-allow-origin": "*",
      "x-dns-prefetch-control": "off",
      "x-frame-options": "SAMEORIGIN",
      "strict-transport-security": "max-age=15552000; includeSubDomains",
      "x-download-options": "noopen",
      "x-content-type-options": "nosniff",
      "x-xss-protection": "1; mode=block",
      "x-ratelimit-limit": "100",
      "x-ratelimit-remaining": "99",
      "date": "Fri, 13 Sep 2024 06:07:32 GMT",
      "x-ratelimit-reset": "1726207656",
      "content-type": "application/json; charset=utf-8",
      "etag": "W/"7d39-+rQ7kyHBCLIn9tjTeKVf4oegWkQ"",
      "vary": "Accept-Encoding",
      "content-encoding": "gzip",
      "transfer-encoding": "chunked",
      "via": "1.1 vegur"
    }
  }
}
```
</details>

## Cookies

In addition to the data source level cookies, you can add query-specific cookies in the Query builder. These cookies will be sent only with the specific query created using this data source instance.

To add cookies:

1. In the Query builder, navigate to the **Setup** tab.
2. Find the **Cookies** section.
3. Add your cookies as key-value pairs.

You can use both static values and dynamic values for cookie values.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/datasource-reference/rest-api/query-cookies.png" alt="ToolJet - Query Builder - REST API Cookies" />
</div>

:::info
Query-specific cookies will override data source level cookies with the same name for that particular query.
:::