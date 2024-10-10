---
id: request-types
title: Request Types
---

REST API sends a **JSON** formatted body by default. If you want to send a different type of body, you can enter the appropriate headers in the **Headers** section.

For example, to send a **multipart/form-data** body, you can add the following header:

```javascript
  Content-Type: multipart/form-data;
```

<img className="screenshot-full" src="/img/datasource-reference/rest-api/form-headers.png" alt="ToolJet - Data source - REST API" />

<img className="screenshot-full" src="/img/datasource-reference/rest-api/form-body.png" alt="ToolJet - Data source - REST API" />
