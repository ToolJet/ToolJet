---
id: workspace-constants
title: Workspace Constants and Secrets
---

Workspace Constants and Secrets in ToolJet help in maintaining consistency and security across your applications. These are essentially predefined values that remain unaltered during an application's runtime, serving two main purposes: reusable values (Global Constants) and secure storage of sensitive information (Secrets).

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/rwXruKCUOqA?si=u3Cly11OeRYjqVmf&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Types of Constants

1. **Global Constants**: Used for reusable values that can be applied consistently across the product.
2. **Secrets**: Used for secure storage of sensitive data like API keys, database credentials, and encryption keys.

## Environment-Specific Configurations and Security

One of the key functionalities of Workspace Constants and Secrets is allowing environment-specific configurations. This is particularly useful for managing both reusable values and sensitive data across different environments like development, staging, and production. 

To enhance security, both Global Constants and Secrets are resolved server-side. This means the actual values are not sent with network payloads; instead, the server resolves these values, thereby keeping them secure from client-side exposure. Additionally, Secrets are masked in the frontend, providing an extra layer of protection for sensitive information.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/workspace-constants/workspace-constants-preview-v2.png" alt="Workspace Constants and Secrets Preview" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Access Control and Usage in Application Development

Access to creating, updating, or deleting Workspace Constants and Secrets is restricted to Admins, ensuring tight control over these critical values. Users with editing permissions can utilize these constants in various parts of the application:

- Global Constants can be used in the app builder, data sources, data queries, and workflows.
- Secrets can be used in data sources and data queries, but not in the app builder or workflows.

The syntax for using constants is straightforward:
- For Global Constants: `{{constants.constant_name}}`
- For Secrets: `{{secrets.secret_name}}`

</div>

For a deep-dive into workspace constants and secrets, including how to create and manage them, go through **[this](/docs/security/constants/)** documentation.