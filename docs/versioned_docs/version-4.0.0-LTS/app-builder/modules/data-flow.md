---
id: data-flow
title: Data Flow
sidebar_label: Data Flow
---

This section explains how data flows work between the parent application and the module.

There are two types of data flows between the parent application and the module:
- **From Parent to Module**
- **From Module to Parent**

## From Parent to Module

When you add a module to an app:
- The parent can pass input values to the module.
- These values can be used anywhere inside the module (UI, queries, logic).

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/data-flow-parent-to-module.png" alt="Data flow from parent to module" />

For example, let's say you want to pass the **userData** from the parent application to the module. Here's what happens:

```js
// Passed from parent
{
  "userData": {{ queries.getUser.data }}
}
```
You can access these values in the module using the `input` object. For instance, to access the userData, you'd use `{{input.userData}}`.

```js
// Consumed in module
{{input.userData}}
```

## From Module to Parent

The module can send data back to the parent using outputs:
- Output values are evaluated inside the module.
- The parent application reads the output values using the components object.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/from-module-to-app.png" alt="Data flow from module to parent" />

For example, let's say you have a module that submits a form and sends the submitted data back to the parent app. Here's what happens:

```js
// Sent from module
{
  "submittedFormData": {{ components.form.formData }}
}
```

You can access these values in the parent application using the `components` object. For instance, to access the submittedFormData, you'd use `{{components.<moduleName>.submittedFormData}}`.

```js
// Received in parent app
{{components.<moduleName>.submittedFormData}}
```

## Query Execution Options

You have two options for managing queries in modules:

### Parent-triggered Queries
- Define queries inside the module.
- From the parent application, trigger them using module Input query.
- Use this when you want full control from the app.

<!-- For example, if you're building a form module where the parent wants to trigger submission, define the query inside the module and use the module input query option. -->

### Self-contained Queries
- Let the module handle its own queries internally (e.g., run on load or button click inside the module).
- These queries remain invisible to the parent app.
- Use this for fully encapsulated behavior.

<!-- For example, if you're building a chart module that fetches data automatically upon loading, define the query inside the module and make it self-executing. -->

Choose based on whether the parent should control the module behavior or let the module manage itself.

