---
id: workspace-constants
title: Workspace Constants
---

Workspace Constants in ToolJet help in maintaining consistency and security across your applications. These constants are essentially predefined values like tokens, secret keys, or API keys, which remain unaltered during an application's runtime.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Environment-Specific Configurations and Security
One of the key functionalities of Workspace Constants is allowing environment-specific configurations. This is particularly useful for managing sensitive data such as API keys and database credentials securely. The Constants ensure that such critical information is effectively managed across different environments like development, staging, and production. Moreover, to enhance security, Workspace Constants are resolved server-side. This means the actual values of the constants are not sent with network payloads; instead, the server resolves these values, thereby keeping them secure from client-side exposure.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/workspace-constants/workspace-constants-preview-v2.png" alt="Workspace Constants Preview" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Access Control and Usage in Application Development
Access to creating, updating, or deleting Workspace Constants is restricted to Admins, ensuring tight control over these critical values. All users with editing permissions in the app builder and global datasource connection can utilize these constants, promoting consistent usage across various application components. The syntax for using a Workspace Constant is straightforward: `{{constants.constant_name}}`. This uniform approach simplifies the application building process, making it more efficient and secure.

</div>

For a deep-dive in workspace constants, go through **[this](/docs/org-management/workspaces/workspace_constants/)** documentation.