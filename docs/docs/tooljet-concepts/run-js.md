---
id: run-js
title: Run JS
---

The "Run JavaScript code" feature in ToolJet is a powerful tool that enables users to write and execute custom JavaScript code within their applications. This functionality is particularly useful for interacting with different components and queries in your ToolJet application. Here's a simplified overview:

1. **Creating and Running JavaScript Code**: To use this feature, you start by creating a new query in your ToolJet application and selecting "Run JavaScript Code" from the available data sources. This opens a JavaScript editor where you can write your code. For instance, you could write a simple script to generate a random number. Once the code is written, it's saved as a query. The `return` statement in your code determines the output, which is stored in the `data` property of the query. It’s important to note that some common JavaScript functions, like `console.log`, are not available in this context.

2. **Interacting with Components and Actions**: The JavaScript code you write can interact with various components of the ToolJet application. For example, you could attach an event handler to a button so that when it's clicked, it triggers the JavaScript code to run. Additionally, you can manipulate the properties of other widgets based on the output of your JavaScript code. This allows for dynamic interactions within your application.

3. **Advanced Features and Libraries**: ToolJet also supports advanced functionalities such as setting and unsetting variables, showing or closing modals, copying content to the clipboard, and even logging out users through JavaScript code. This is done by using specific syntax and functions provided by ToolJet. Moreover, you can utilize internal libraries like Moment, Lodash, and Axios for more complex operations.

In summary, ToolJet's "Run JavaScript code" feature provides a flexible way to add custom logic and interact with various components in your application. Whether it’s displaying data, manipulating widget properties, or performing actions based on certain conditions, this feature enhances the capabilities of your ToolJet applications significantly.