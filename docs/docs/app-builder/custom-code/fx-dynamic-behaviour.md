---
title: Using fx for Dynamic Behaviour
id: fx-dynamic-behaviour
---

In ToolJet, you can make your applications more interactive by writing logic directly in component properties using the **fx** editor. For instance, you might want to disable a **Button** until all required form fields are filled, or change the color of an input field based on whether the entered value is valid. You can define this conditional logic using JavaScript expressions in the **fx** editor.

This makes it easy to build intuitive interfaces, with components that respond in real time to user actions and data updates.

## How fx Works
Whenever you see the **fx** icon next to a property in the component settings, it means you can switch to expression mode. Clicking the icon opens an input box where you can write custom logic using JavaScript inside `{{ }}`. You can reference query results, component states, and app-level variables directly within these expressions. ToolJet supports full JavaScript syntax here, including conditional logic, string interpolation, array methods like map, filter, and reduce, and more.

Let’s say you’re building a form that takes user input. You want the **Submit button** to be enabled only if all form validations pass.

With ToolJet’s **fx** support, you can achieve this in the Disabled property of the button component like so:

<img className="screenshot-full img-m" src="/img/app-builder/custom-code/button-disable.png" alt=" button disable "/>

This expression disables the **Button** when the **Form** is invalid. No manual toggling needed. Similarly, you could use the same approach to update other properties such as visibility, background color, font size etc. for different components. 

If you are new to ToolJet and want to learn how to access component properties, check out [this guide](/docs/app-builder/building-ui/component-state#available-component-states).

## Use Cases

### Loading States

Display loading indicators until the data is loaded.

Example: In an app where you are loading data in the table component, you might want to show a loading spinner while fetching employee data.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/loading.png" alt=" button disable "/>

### Conditional Styling

Apply conditional styling (colors, fonts, sizes) based on values from queries or application state.

**Example:** In an employee directory with a user list, you can display different background colors on **Table** cells based on whether the user is active or inactive.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/style.png" alt=" button disable "/>

### Form Validation 

Enable or disable submit buttons based on the validity of form inputs.

**Example:** In **Forms**, you can enable the Submit button only when all required fields are correctly filled.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/form.png" alt=" button disable "/>

### Conditional Visibility

Show or hide components based on specific conditions.

**Example:** In an employee directory application, within the personal details **Form**, you can conditionally display a **Text Input** for entering a custom country name when the user selects “other” from the country dropdown.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/conditional_visibility.png" alt=" button disable "/>

Using the **fx** editor, you can easily add dynamic behavior to your applications with minimal code. 