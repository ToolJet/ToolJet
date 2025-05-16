---
title: Fx for dynamic behaviour
id: fx-dynamic-behaviour
---

In ToolJet, you can make your applications more interactive and responsive by writing logic directly into component properties using the built-in fx editor. This allows components to react automatically to user input and changes in data.

For instance, you might want to disable a submit button until all required form fields are filled, or change the color of an input field based on whether the entered value is valid. You can define the behavior using JavaScript expressions in the fx editor.

This makes it easy to build interfaces that feel dynamic and intuitive, with components that respond in real time to user actions and data updates.

## How fx Works?
Whenever you see the fx icon next to a property in the component settings, it means you can switch to expression mode. Clicking the icon opens an input GUI where you can write custom logic using JavaScript inside `{{ }}`. You can reference query results, component states, and app-level variables directly within these expressions. ToolJet supports full JavaScript syntax here, including conditional logic, string interpolation, array methods like map, filter, and reduce, and more.

Let’s say you’re building a form that takes user input. You want the Submit button to be enabled only if all form validations pass.

With ToolJet’s fx support, you can achieve this in the Disabled property of the button component like so:

<img className="screenshot-full img-m" src="/img/app-builder/custom-code/button-disable.png" alt=" button disable "/>

This expression disables the button when the form is invalid, no manual toggling needed.

## Common Use Cases

**Loading States**: Display loading indicators while waiting for asynchronous operations like API calls.

Example: In an app where you are loading data in the table component, you might want to show a loading spinner in the table component while fetching employee data.
<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/loading.png" alt=" button disable "/>

**Dynamic Styling**: Apply conditional styling (colors, fonts, sizes) based on values from queries or application state.

Example: In an app like a employee directory with a user list, you can display different text colors based on whether the user is active or inactive.
<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/style.png" alt=" button disable "/>
**Form Validation**: Enable or disable submit buttons based on the validity of form inputs.

Example: In an app where you are using forms, you can enable the “Submit” button only when all required fields are correctly filled.
<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/form.png" alt=" button disable "/>
**Conditional Visibility**: Show or hide components based on specific conditions.

Example: In an employee directory app, you can display the “Add Employee” button only if the user has an admin role.
<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/visibility.png" alt=" button disable "/>

Using fx expressions it is easy to add dynamic behavior to your applications without writing any boilerplate code. Whether it’s showing or hiding components, validating forms, applying styles, or managing loading states with fx you can build more responsive and interactive interfaces.