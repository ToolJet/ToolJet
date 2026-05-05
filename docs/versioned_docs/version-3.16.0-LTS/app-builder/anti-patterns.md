---
id: anti-patterns
title: Anti-Patterns to Avoid
---

When building applications with ToolJet, it's essential to follow best practices to ensure your apps are efficient, maintainable, and provide a smooth user experience. This documentation outlines common anti-patterns to avoid while using ToolJet and offers solutions to optimize your applications.

## Naming and Organization

#### Unmanaged Component Naming

- **Anti-Pattern**: Using default or non-descriptive names for components.
- **Solution**: **Rename all components with meaningful names to make the apps more manageable as they grow.**
- **Reason**: Descriptive names improve readability, making it easier for you and others to understand and maintain the app's structure.

#### Naming Components or Queries with Hyphens or Spaces

- **Anti-Pattern**: Naming components or queries with hyphens or spaces in between, such as `run-py1` or `my query`.
- **Solution**: **Use names without hyphens or spaces**, or reference them using bracket notation (e.g., `{{queries['run-py1'].isLoading}}`).
- **Reason**: Hyphens and spaces can cause syntax issues. Using bracket notation or avoiding these characters ensures consistency and prevents errors in query or component references.

## App Structure and Limits

#### Exceeding Component Limits

- **Anti-Pattern**: Having more than 2,500 components in a single app.
- **Solution**: **Limit each app to a maximum of 2,500 components.**
- **Reason**: Exceeding this number can slow down the app builder and live apps, impacting both development speed and user experience.

#### Excessive Number of Pages in an App

- **Anti-Pattern**: Including too many pages within a single app (for example, more than 10-15 pages).
- **Solution**: **Keep the number of pages per app under 10-15.** If your application requires more, consider splitting it into multiple apps and linking between them.
- **Reason**: An excessive number of pages can slow down the app and make it difficult to manage. Every page and its associated components and queries are loaded into memory, increasing the overall footprint.

#### Deeply Nesting Containers

- **Anti-Pattern**: Nesting Container or Modal components several levels deep (e.g., a Container inside a Container inside another Container).
- **Solution**: **Flatten your layout where possible.** Use pages or tabs to separate content instead of stacking containers.
- **Reason**: Each nesting level adds render complexity. Deep nesting increases the number of components the browser must evaluate, leading to slower renders and harder-to-debug layouts.

#### Exceeding ToolJet Database Bulk Upload Limits

- **Anti-Pattern**: Attempting to bulk upload more than 1,000 rows or files larger than 5 MB into the ToolJet Database in a single operation.
- **Solution**: **Split large data imports into batches of 1,000 rows or fewer**, and keep individual CSV files under 5 MB.
- **Reason**: The ToolJet Database enforces these limits (configurable via environment variables `TOOLJET_DB_BULK_UPLOAD_MAX_ROWS` and `TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB`). Exceeding them causes the upload to fail.

## Data Handling

#### Client-Side Operations for Large Data Sets

- **Anti-Pattern**: Handling large data sets with client-side operations on the Table component.
- **Solution**: **Implement [server-side operations](/docs/widgets/table/serverside-operations/overview/) for handling large data sets.** The Table component supports server-side pagination, search, sort, and filter — enable the ones relevant to your use case instead of processing everything on the client.
- **Reason**: Server-side operations reduce the amount of data loaded at once, improving load times and performance.

#### Storing Base64 Data in Variables

- **Anti-Pattern**: Capturing and storing Base64 data directly in variables.
- **Solution**: **Store large data, like base64 images, in a database and retrieve it as needed.**
- **Reason**: Storing Base64 data in variables can consume significant memory and slow down the app. Retrieving data from a database as needed optimizes performance.

#### Triggering Unnecessary Queries on Page Load

- **Anti-Pattern**: Triggering all queries on page load, regardless of their necessity.
- **Solution**: **For multi-page apps, only trigger queries on page load that are needed for the specific page.**
- **Reason**: Loading unnecessary data consumes resources and slows down page load times. Optimizing queries enhances performance.

#### Direct Mutation of Data

- **Anti-Pattern**: Directly mutating data structures through JavaScript code, such as using `queries.getEmployees.data = []`.

```javascript
// Anti-pattern: directly overwriting query data
queries.getEmployees.data = [];
```

- **Solution**: Always use ToolJet's built in **[actions](/docs/how-to/run-actions-from-runjs/)** to manipulate data.

```javascript
// Correct: use actions to update data
actions.setVariable("employees", []);
```

- **Reason**: Direct mutation of data can lead to unexpected bugs and make debugging more complex.

## JavaScript Query Patterns

#### Simultaneous Execution of Multiple JavaScript Queries

- **Anti-Pattern**: Triggering a large amount of JavaScript queries simultaneously through a single event. For example, using an event to trigger a **Run JavaScript code** query that contains code to execute 15-20 other **Run JavaScript code** queries within the application.
- **Solution**: **Limit the number of simultaneous JavaScript queries triggered by a single event.**
- **Reason**: Triggering numerous Run JavaScript queries at the same time can significantly degrade browser performance as each JavaScript query creates a **[new execution environment](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth#javascript_execution_contexts)** within the browser. JavaScript in browsers runs on a single main thread. When multiple scripts are executed concurrently, they compete for execution time on this thread.

#### Using Non-Blocking Commands for Synchronous Operations

- **Anti-Pattern**: Using non-blocking commands like `Promise.all` and `setTimeout` in the **Run JavaScript code** query when an accurate isLoading state is needed.

```javascript
// Anti-pattern: the query finishes before the timeout fires
setTimeout(() => {
  actions.setVariable("status", "done");
}, 2000);
```

- **Solution**: **Avoid non-blocking operations in JavaScript Queries if you require an accurate isLoading status. Ensure your code is synchronous within the Run JavaScript code query.**

```javascript
// Correct: use await so the query stays in a loading state until complete
const result = await queries.fetchData.run();
actions.setVariable("status", "done");
```

- **Reason**: Non-blocking operations can cause **Run JavaScript code** query to exit before these commands complete, leading to an incorrect isLoading status and potentially confusing users.

#### Using Actions Inside Loop Functions

- **Anti-Pattern**: Using actions inside loop functions.

Example:
You have a Table displaying data from `{{page.variables.data}}` and a **Save Changes** button that updates the data. When users edit rows and click **Save Changes**, you might initially implement the update like this:

```javascript
const data = page.variables.data;
Object.values(components.table1.dataUpdates).forEach(ele => {
  data[ele.id] = ele;
  actions.setPageVariable("data", data);
});
```

The setPageVariable action is executed inside the loop for each row update. This causes the table to re-render every time the variable is updated, leading to significant performance degradation, especially when multiple rows or cells are updated simultaneously.

- **Solution**: **Modify your code to update the page variable once after all changes are processed**:

```javascript
const data = page.variables.data;
Object.values(components.table1.dataUpdates).forEach(ele => {
  data[ele.id] = ele;
});
actions.setPageVariable("data", data);
```

- **Reason**: By updating the variable after the loop completes, the table re-renders only once. This reduces unnecessary processing and significantly improves performance when handling multiple updates.

## Component Configuration

#### Loading All Tabs Simultaneously

- **Anti-Pattern**: Loading all items in the Tab component at once when there are numerous tabs.
- **Solution**: **Enable the "Render only active tabs" option.**
- **Reason**: This prevents unnecessary loading of inactive tabs, reducing initial load times and improving performance.

#### Using Deprecated Component Properties or Events

- **Anti-Pattern**: Continuing to use deprecated properties or events, such as `onRowClicked` in the ListView component.
- **Solution**: **Switch to the current equivalents.** For example, use `onRecordClicked` instead of `onRowClicked` in ListView.
- **Reason**: Deprecated properties may be removed in future releases. Migrating early avoids breaking changes when you upgrade.

#### Not Using Dynamic Height in Containers and Tabs

- **Anti-Pattern**: Leaving the `dynamicHeight` option disabled on Container, Tabs, or ListView components when the content inside varies in size.
- **Solution**: **Enable the `dynamicHeight` property**, so the component automatically adjusts to fit its content.
- **Reason**: Without dynamic height, content may overflow or leave excessive empty space, resulting in a poor user experience. Enabling it ensures the layout adapts to the content.

## Conclusion

Avoiding these anti-patterns when using ToolJet ensures that your applications are efficient, responsive, and maintainable. By following these best practices, you can enhance user experience and simplify app management. Always consider the impact of your development choices on both performance and scalability.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)