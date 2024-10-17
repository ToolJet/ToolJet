---
id: upgrade-to-v3
---

# ToolJet v3 (Beta) Migration Guide

This documentation will help you upgrade your application from ToolJet v2.50.0-LTS to the pre-release/beta version of ToolJet v3.

ToolJet v3 is a new **major version**, including **breaking changes** that require you to adjust your applications accordingly. We will guide you through this process and mention a few important changes.

:::tip Before upgrading

Before upgrading, we recommend reviewing your existing applications for any usage of deprecated features. Addressing these ahead of time will help reduce the work needed to upgrade to ToolJet v3.

For complex applications, we also recommend setting up thorough testing procedures to ensure your apps function correctly after the upgrade.

:::

## Breaking Changes

### Removal of Local Data Sources

Local data sources, which were deprecated in previous versions, have been completely removed in ToolJet v3. All data sources must now be configured globally at the workspace level.

**Action required:** Migrate any remaining local data sources to global workspace data sources before upgrading.

### Removal of Workspace Variables

Workspace Variables, which were deprecated in earlier versions, have been removed in ToolJet v3. Workspace constants have been introduced as a better alternative.

**Action required:** Replace any usage of Workspace Variables with Workspace constants.

Workspace Constants are designed to be resolved on the server-side only, ensuring a high level of security. You can assign users to a specific role and provide create, update, and delete access to Workspace Constants.

For detailed instructions on migrating from Workspace Variables to Workspace Constants, please refer to our [Workspace Variables Migration Guide](https://docs.tooljet.com/docs/beta/org-management/workspaces/workspace-variables-migration).

### Old Kanban Board Removal

The old version of the Kanban board is no longer supported and may cause your application to crash if still in use.

**Action required:** Delete any instances of the old Kanban board and replace them with the new Kanban component.

### Restrictions on Dynamic Input

In ToolJet v3, you can no longer dynamically change references to component names.

**Action required:** Review your applications for any dynamic component name references and refactor as necessary.

**Examples of unsupported dynamic input:**

1. Dynamically referencing components:
   ```javascript
   // This will no longer work
   {{components[componentNameVariable].value}}
   ```

2. Using variables to construct component names:
   ```javascript
   // This is not supported
   {{components['textinput' + index].value}}
   ```

3. Dynamically accessing nested properties:
   ```javascript
   // This dynamic property access is not allowed
   {{components.table1[dynamicColumnName]}}
   ```

**Supported static references:**

Instead, use static references to components:

```javascript
{{components.textinput1.value}}
{{components.table1.selectedRow}}
{{queries.query1.data}}
```

### Changes in Accessing Response Headers and Metadata

We've introduced a capability to expose additional information through metadata for all datasources. Previously, this was only available for REST API and GraphQL data sources.

**Action required:** Update your code to use the new method for accessing response headers and metadata. 

Before, you could access response headers like this:
```
{{queries.<queryName>.responseHeaders}}
```

Now, you should use:
```
{{queries.<queryName>.metadata}}
```

The `metadata` object will contain detailed information about the request and response, including request URL, method, headers, parameters, response status code, and headers.

### Mandatory ToolJet Database

Enabling the ToolJet Database is now mandatory. In previous versions, this was optional.

**Action required:** Ensure that ToolJet Database is enabled for all your workspaces.

### Upgrade Considerations for Components and Queries with Identical Names

During the upgrade to ToolJet v3, there's an important consideration for applications where components and queries share the same name.

**Issue:** When upgrading, if a component is referencing a query with the same name, the upgrade process may break that mapping.

**Explanation:** In the previous version, ToolJet used a global ID-to-name map for both components and queries. During the upgrade to v3, this global map is split, which can cause issues with existing references if components and queries share names.

**Action required before upgrade:** 
- Review your applications for any instances where queries and components share the same name.
- Temporarily rename either the component or the query to ensure unique names across your application.
- Document these changes so you can revert them after the upgrade if desired.

**Example scenario:** If a table component named `userData` is referencing a query also named `userData`, this reference may break during the upgrade process.

:::note
This is only an issue during the upgrade process. Once your application is running on ToolJet v3, you can use identical names for components and queries without any problems.
:::

### Changes in Property Panel Logic and Variable Access

In ToolJet v3, there are changes to how you can access and check for the existence of variables in the property panel.

**Issue:** Certain methods of checking for variable existence are no longer supported in the property panel.

**Unsupported logic:**
```javascript
{{'name' in variables}}
{{Object.keys(variables).includes('name')}}
```

**Recommended approach:**
To check whether a variable exists, use the following format:
```javascript
{{variables['name'] ?? false}}
```

**Additional changes:**
- For components, queries, and page variables, a minimum of two keys must be available after the `component/query/page` keyword.
- For variables, a minimum of one key should be present after the `variables` keyword.

**Supported formats:**
```javascript
components.textinput1.value
components?.textinput1?.value
components["textinput1"].value
queries.restapi1.data
page.variables.name
variables["name"]
variables.name 
```

**Action required:**
- Review your applications for any usage of unsupported logic in the property panel.
- Update variable existence checks to use the recommended approach.
- Ensure that all references to components, queries, page variables, and variables follow the supported formats.

:::caution
These changes may affect how your application interacts with variables and components. Be sure to test thoroughly after making these updates.
:::

## Help and Support

- Feel free to join our [Slack Community](https://tooljet.com/slack) or you can also e-mail us at hello@tooljet.com.
- If you have found a bug, please create a [GitHub issue](https://github.com/ToolJet/ToolJet/issues) for the same.