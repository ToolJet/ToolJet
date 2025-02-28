---
id: anti-patterns
title: Anti-Patterns to Avoid 
---

When building applications with ToolJet, it's essential to follow best practices to ensure your apps are efficient, maintainable, and provide a smooth user experience. This documentation outlines common anti-patterns to avoid while using ToolJet and offers solutions to optimize your applications.

---

## 1. Unmanaged Component Naming

- **Anti-Pattern**: Using default or non-descriptive names for components.
- **Solution**: **Rename all components with meaningful names to make the apps more manageable as they grow.**
- **Reason**: Descriptive names improve readability, making it easier for you and others to understand and maintain the app's structure.

---

## 2. Exceeding Component Limits

- **Anti-Pattern**: Having more than 2,500 components in a single app.
- **Solution**: **Limit each app to a maximum of 2,500 components.**
- **Reason**: Exceeding this number can slow down the app builder and live apps, impacting both development speed and user experience.

---

## 3. Client-Side Operations for Large Data Sets

- **Anti-Pattern**: Handling large data sets with client-side operations on the Table component.
- **Solution**: **Implement [server-side operations](/docs/widgets/table/serverside-operations/overview) for handling large data sets.**
- **Reason**: Server-side operations reduces the amount of data loaded at once, improving load times and performance.

---

## 4. Simultaneous Execution of Multiple JavaScript Queries

- **Anti-Pattern**: Triggering a large amount of JavaScript queries simultaneously through a single event. For example, using an event to trigger a **Run JavaScript code** query that contains code to execute 15-20 other **Run JavaScript code** queries within the application.
- **Solution**: **Limit the number of simultaneous JavaScript queries triggered by a single event.**
- **Reason**: Triggering numerous Run JavaScript queries at the same time can significantly degrade browser performance as it each JavaScript query creates **[new execution environment](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth#javascript_execution_contexts)** within the browser. JavaScript in browsers runs on a single main thread. When multiple scripts are executed concurrently, they compete for execution time on this thread.

---

## 5. Storing Base64 Data in Variables

- **Anti-Pattern**: Capturing and storing Base64 data directly in variables.
- **Solution**: **Store large data, like base64 images, in a database and retrieve it as needed.**
- **Reason**: Storing Base64 data in variables can consume significant memory and slow down the app. Retrieving data from a database as needed optimizes performance.

---

## 6. Loading All Tabs Simultaneously 

- **Anti-Pattern**: Loading all items in the Tab component at once when there are numerous tabs.
- **Solution**: **Enable the “Render only active tabs” option.**
- **Reason**: This prevents unnecessary loading of inactive tabs, reducing initial load times and improving performance.

---

## 7. Excessive Number of Pages in an App

- **Anti-Pattern**: Including too many pages within a single app.
- **Solution**: **Limit the number of pages per app to maintain optimal performance.**
- **Reason**: An excessive number of pages can slow down the app and make it difficult to manage. Organize content efficiently and consider splitting the app if necessary.

---

## 8. Using Non-Blocking Commands in JavaScript for Synchronous Operations

- **Anti-Pattern**: Using non-blocking commands like `Promise.all` and `setTimeout` in the **Run JavaScript code** query when an accurate isLoading state is needed.
- **Solution**: **Avoid non-blocking operations in JavaScript Queries if you require an accurate isLoading status. Ensure your code is synchronous within the Run JavaScript code query.**
- **Reason**: Non-blocking operations can cause **Run JavaScript code** query to exit before these commands complete, leading to an incorrect isLoading status and potentially confusing users.

---

## 9. Triggering Unnecessary Queries on Page Load

- **Anti-Pattern**: Triggering all queries on page load, regardless of their necessity.
- **Solution**: **For multi-page apps, only trigger queries on page load that are needed for the specific page.**
- **Reason**: Loading unnecessary data consumes resources and slows down page load times. Optimizing queries enhances performance.

---

## 10. Using Actions inside Loop Functions
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

---

## 11. Direct Mutation of Data

- **Anti-Pattern**: Directly mutating data structures through JavaScript code, such as using `queries.getEmployees.data = []`.
- **Solution**: Always use ToolJet's built in **[actions](/docs/how-to/run-actions-from-runjs/)** to manipulate data.
- **Reason**: Direct mutation of data can lead to unexpected bugs and make debugging more complex. 

---

## Conclusion

Avoiding these anti-patterns when using ToolJet ensures that your applications are efficient, responsive, and maintainable. By following these best practices, you can enhance user experience and simplify app management. Always consider the impact of your development choices on both performance and scalability.

