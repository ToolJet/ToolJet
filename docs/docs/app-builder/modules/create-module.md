---
id: create-module
title: Creating a Module
---

A module is a reusable interface that can be imported into applications. It allows you to build complex functionality once and reuse it across multiple applications without having to rewrite code each time. This guide explains how to create a module in ToolJet.

Follow these steps to get started with creating a module:

- Go to the **Modules** section from the ToolJet dashboard.

<!-- <img className="screenshot-full img-full" src="/img/app-builder/modules/dashboard.png" alt="Dashboard" />  -->

- Click on the **Create Module** button. In the popup, enter a name for the module.
<img className="screenshot-full img-s" src="/img/app-builder/modules/create-module-modal.png" alt="Create Module" />

- Add components, queries, and actions just like you would in a normal app. place and resize your components on the **Module container**. 

<img className="screenshot-full img-full" src="/img/app-builder/modules/module-builder.png" alt="Module Builder" />

- Click on the module container to open the properties panel Here you can see the **Input** and **Output** that help in defining how the module communicates with the parent application. These settings define how the module communicates with the parent app, making it easier to build dynamic, reusable modules that work across different data sets and queries.

<img className="screenshot-full img-s" src="/img/app-builder/modules/module-container-property.png" alt="Properties Panel" /> 

<!-- ## Example

Suppose you're building a **Form** module that needs to communicate with its parent app. You can do this by configuring inputs to receive data from the parent app and outputs to send data back.

Here’s how it works:

- **Inputs**: Send data or trigger queries from the parent app into the module.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/module-input.png" alt="Module Input" /> 

- **Outputs**: Send data back from the module to the parent app.
<img className="screenshot-full img-m" style={{ marginBottom:'15px' }}  src="/img/app-builder/modules/module-output.png" alt="Module Output" /> 

- **Test Input**: Use this to test your input configuration before importing the module into an app.
<img className="screenshot-full img-full" style={{ marginBottom:'15px' }}   src="/img/app-builder/modules/module-test.png" alt="Test Input" />  -->

Please refer to the **[Input and Output](/docs/beta/app-builder/modules/input-output)** documentation for detailed information on how to manage the inputs and outputs of a module.