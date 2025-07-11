---
id: create-module
title: Creating a Module
---

A module is a reusable component that can be imported into other apps. It allows you to build complex functionality once and reuse it across multiple applications without having to rewrite code each time. This guide explains how to create a module in ToolJet.

Follow these steps to get started with creating a module:

### 1. Navigate to the Modules Tab
   Go to the **Modules** section from the ToolJet dashboard.

<img className="screenshot-full img-full" src="/img/app-builder/modules/dashboard.png" alt="Dashboard" /> 

### 2. Create a New Module
   Click the **Create Module** button. In the popup, enter a name for your module.
<img className="screenshot-full img-s" src="/img/app-builder/modules/create-module-modal.png" alt="Create Module" />


### 3. Build Your Module
   - Add components, queries, and actions just like you would in a normal app.  
   - Use the **Module container** to place and resize your components. The same size will be used when this module is added to any app.

<img className="screenshot-full img-full" src="/img/app-builder/modules/module-builder.png" alt="Module Builder" />

### 4. Configure Module Properties
Click on the module container to open the **properties panel**. Click here to learn more about module properties.

<img className="screenshot-full img-s" src="/img/app-builder/modules/module-container-property.png" alt="Properties Panel" /> 

Let's say you’re building a form module, you can define inputs and outputs to send data from the parent app into the module and receive data back from the module into the parent app.

Here’s how it works:

**Inputs**: Send data or trigger queries from the parent app into the module.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/module-input.png" alt="Module Input" /> 

**Outputs**: Send data back from the module to the parent app.
<img className="screenshot-full img-m" style={{ marginBottom:'15px' }}  src="/img/app-builder/modules/module-output.png" alt="Module Output" /> 

**Test Input**: Use this to test your input configuration before importing the module into an app.
<img className="screenshot-full img-full" style={{ marginBottom:'15px' }}   src="/img/app-builder/modules/module-test.png" alt="Test Input" /> 


Now, let's understand how you can use inputs and outputs in your module to pass data between the parent app and the module. Please refer to [Input and Output](/docs/beta/app-builder/modules/input-output) documentation for detailed information.