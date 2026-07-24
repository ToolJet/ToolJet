---
id: accessing-values
title: Access and Reference Values
---

ToolJet's flexibility in integrating dynamic data within applications is facilitated through the ability to use custom code, and access and manipulate values derived from components, queries, globals. You can use double curly braces `{{}}` in the app-builder to access values or enter JavaScript code.

## Accessing Values

You can check all the accessible values using the left sidebar's **[Inspector](/docs/how-to/use-inspector/)** tab. This functionality can be handy to check data returned by queries and components on the canvas and reference it in queries or components. Inspector also displays other values like global values, variables, page variables, etc. 

![Check Available Values Using Inspector](/img/tooljet-concepts/writing-custom-code/inspector.png)

### Example Scenarios

**Query Data Access**:
- **Purpose**: Retrieve sales data from a query.
- **Implementation**: Use the expression `{{queries.getSalesData.data}}` to fetch data from the `getSalesData` query.

**Component Data Access**:
- **Purpose**: Access data from a selected row in a table.
- **Implementation**: Use the expression `{{components.table1.selectedRow.id}}` to get the ID of the selected row in `table1`.

**Accessing Globals**
- **Purpose**: Access global settings and variables predefined in the ToolJet environment.
- **Implementation**: To check the current theme and adjust styles dynamically, use:
`{{globals.theme.name}}`

## More on the Left Sidebar

The left sidebar in ToolJet is a hub for navigation and application configuration, featuring several options including Pages, Inspector, Debugger, and Global Settings.

### Key Features

- **Pages**: Manage multiple pages within a single application, enhancing organizational structure and user navigation.
  
- **Inspector**: Inspect data linked to queries and components, essential for debugging and data manipulation.

- **Debugger**: Track and display errors during query execution, providing insights into application issues.

- **Global Settings**: Configure application-wide settings such as app slug, header visibility, and maintenance mode.

## Practical Tips

- Use the Inspector to ensure correct data bindings and troubleshoot data flow issues.
- Leverage the Debugger to maintain smooth operation and quick error resolution.
- Adjust Global Settings to tailor app behavior to specific user or organizational needs.

