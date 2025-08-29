---
id: create-module
title: Creating a Module
---

A module is a reusable interface that can be imported into applications. It allows you to build complex functionality once and reuse it across multiple applications without having to rewrite code each time. This guide explains how to create and use a module in ToolJet.

### Create a Module

Follow these steps to get started with creating a module:

1. Go to the **Modules** section from the ToolJet dashboard.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/app-builder/modules/dashboard.png" alt="Dashboard" /> 
2. Click on the **Create Module** button. In the popup, enter a name for the module.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/modules/create-module-modal.png" alt="Create Module" />
3. Add components, queries, and actions just like you would in a normal app. place and resize your components on the **Module container**. 
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/app-builder/modules/module-builder.png" alt="Module Builder" />
4. Click on the module container to open the properties panel Here you can see the **Input** and **Output** that help in defining how the module communicates with the parent application. These settings define how the module communicates with the parent app, making it easier to build dynamic, reusable modules that work across different data sets and queries. Checkout [Configuring Inputs and Outputs](/docs/app-builder/modules/input-output) guide to learn more.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/modules/module-container-property.png" alt="Properties Panel" /> 

### Use a Module

Once a module is created, it becomes available in the **Module** section of the component panel inside the App-Builder. You can use it like any other component by dropping it on the canvas and configuring it.

1. Open the application in which you want to use a module.
2. In the component library panel, switch to the **Module** section.
3. **Drag and drop** the Module onto the canvas.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/app-builder/modules/use-module.png" alt="Module Builder" />
5. You can select the module, to see a list of required **inputs** (if any) defined in the module.
6. Bind the inputs to values from your data source or configure static values if needed.
7. If your module has **outputs**, you can reference them using:
   ```js
   {{components.<module_name>.<output_name>}}
   ```

You can reuse the same module multiple times in a single application by dropping it multiple times on the canvas and configuring each instance with different input bindings.

Please refer to the **[Input and Output](/docs/app-builder/modules/input-output)** documentation for detailed information on how to manage the inputs and outputs of a module.