---
title: "Using Modules"
id: "using-modules"
---

Once a module is created, it becomes available in the **Module** section of the component panel inside the App-Builder. You can use it like any other component by dropping it on the canvas and configuring it.


### Steps to Use a Module:

1. Open the application in which you want to use a module.

2. In the component library panel, switch to the **Module** section.

3. **Drag and drop** the Module onto the canvas.

<img className="screenshot-full img-full" src="/img/app-builder/modules/use-module.png" alt="Module Builder" />

5. You can select the module, to see a list of required **inputs** (if any) defined in the module.

6. Bind the inputs to values from your data source or configure static values if needed.

7. If your module has **outputs**, you can reference them using:
   ```js
   {{components.<module_name>.<output_name>}}
   ```

You can reuse the same module multiple times in a single application by dropping it multiple times on the canvas and configuring each instance with different input bindings.
