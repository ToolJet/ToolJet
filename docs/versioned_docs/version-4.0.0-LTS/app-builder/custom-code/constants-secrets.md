---
id: constants-secrets
title: Referencing Constants and Secrets 
---

When building applications in ToolJet, you often need to reuse fixed values (such as URLs or environment flags) or securely handle sensitive information (such as API keys or database credentials). [Workspace Constants and Secrets](/docs/security/constants/) make this process easy, safe, and maintainable, especially when working across multiple apps or with larger teams. 

In this guide, you'll learn how to use Workspace Constants and Secrets within your ToolJet apps. 

You can create a global constant or secret directly from the ToolJet Dashboard. Once created, these constants and secrets can be referenced by builders within the app-builder. 

<img className="screenshot-full img-full" style={{marginBottom:"15px"}} src="/img/security/constants/constants-secret/env-specific-const-v2.png" alt="CMS Page"/>

## Characteristics and Usage

Both constants and secrets allow you to store reusable values for your apps. However, they serve different purposes and have distinct characteristics as shown below:

|   Characteristic        |       Global Constants        |         Secrets           |
|-------------------------|:-----------------------------:|:-------------------------:|
| Components              |             ✅                |           ❌              |
| Data Queries          |             ✅                |           ✅              |
| Encrypted in DB         |             ✅                |           ✅              |
| Masked in Frontend      |             ❌                |           ✅              |
| Resolved on Client Side |             ✅                |           ❌              |
| Resolved on Server Side |             ❌                |           ✅              |
| Naming Convention       | `{{constants.constant_name}}` | `{{secrets.secret_name}}` |

## Access Control

To maintain security and governance:
- Only Admins can create, edit, or delete Constants and Secrets.
- Builders can reference them in their applications but cannot modify them.

## Use Cases

### Reusable Values Across Apps with Global Constants

Imagine you’re building an app that fetches product prices from an API. The base URL of your API is the same across multiple queries.

Instead of hard-coding this URL everywhere, define a Global Constant. Now, if the base URL ever changes, you only need to update it in one place, reducing errors and improving maintainability.

- Name: `API_BASE_URL`
- Value: `https://api.example.com/v1`

You can now reference it in your queries or custom code:

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/constants_usecase.png" alt="constant usecase"/>

### Handling Sensitive Credentials with Secrets

Let’s say your application uses a third-party service such as OpenAI that requires an API key. Storing this key directly in queries or code isn’t a good practice. Instead, define a Secret:

- Name: `OPENAI_API_KEY`
- Value: `sk_****************`

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/secret_usecase.png" alt="secret usecase"/>

Secrets are encrypted and can only be accessed within queries and data sources. They are not accessible in components, ensuring your credentials remain secure.