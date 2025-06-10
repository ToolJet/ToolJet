---
id: constants-secrets
title: Referring Constants and Secrets 
---

When building apps in ToolJet, you often need to reuse fixed values (such as currency codes, URLs, or environment flags) or securely handle sensitive information (such as API keys or database credentials). Workspace Constants and Secrets make this process easy, safe, and maintainable, especially when working across multiple apps or with larger teams. 

In this guide, we’ll walk you through how to use Workspace Constants and Secrets within your ToolJet apps.

You can create a global constant or secret directly from the ToolJet UI, or by visiting `https://app.corp.com/your-workspace/workspace-constants`. Once created, these values are accessible to all users within the workspace.

<img className="screenshot-full img-full" style={{marginBottom:"15px"}} src="/img/security/constants/constants-secret/env-specific-const-v2.png" alt=" CMS Page"/>

To use them in your app, reference them directly in the app builder using the following syntax:

- For Global Constants: `{{constants.constant_name}}`
- For Secrets: `{{secrets.secret_name}}`

For more details on creating, managing, and using constants and secrets, check out the [Constants & Secrets documentation](/docs/security/constants/).

## Access Control

To maintain security and governance:
- Only Admins can create, edit, or delete Constants and Secrets.
- Builders can use them in their applications but cannot modify them.

## Use Cases

### Avoiding Hardcoding with Global Constants

Imagine you’re building an app that fetches product prices from an API. The base URL of your API is the same across multiple queries:

```js 
https://api.example.com/v1/products
```

Instead of hardcoding this URL everywhere, define a Global Constant:
- Name: `API_BASE_URL`
- Value: `https://api.example.com/v1`

Now in your custom code or queries, use:

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/constants_usecase.png" alt="constant usecase"/>


This way, if the base URL ever changes, you only need to update it in one place, reducing errors and improving maintainability.

### Handling Sensitive Credentials with Secrets

Let’s say your application uses a third-party service such as Open AI that requires an API key. Storing this key directly in queries or code isn’t a good practice. Instead, define a Secret:

- Name: `OPENAI_API_KEY`
- Value: `sk_****************`

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/secret_usecase.png" alt="secret usecase"/>

Secrets are encrypted and are only available in queries and data sources. They are not accessible in app-builder components, ensuring your credentials remain secure.