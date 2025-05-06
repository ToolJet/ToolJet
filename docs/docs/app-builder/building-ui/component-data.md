---
id: component-data
title: Accessing Components Data
---

Each component holds some data, which can be used to build dynamic and interactive applications. For example, you can dynamically fetch data of a particular candidate from the database when a user enters the candidate name in the input field.

This data is stored in the form of exposed variables. Each component has a different set of exposed variables based on its functionality — for example, an input field exposes a value, a table exposes a selectedRow, and so on. For detailed information on any specific component and its exposed variables, refer to the [individual component guide](#).

The exposed variables from components can be used:
- Inside queries — to send user inputs or values as parameters.
- Inside other components — to dynamically display values, or interact with the component.

## Accessing Exposed Variable

An exposed variable of a component can be accessed using the following syntax: <br/>
`{{components.<component-name>.<variable-name>}}`

Example: `{{components.numberinput1.value}}` - This will fetch the value entered by the user in the **numberinput1** component.

## Inspector Panel

In the App Builder, you can view all available exposed variables and their current values using the Inspector located in the left sidebar. For more details, refer to the [Inspector](#) guide.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/app-builder/access-comp-data/inspector.png" alt="App Builder: Properties Panel"/>

- Open the Component dropdown inside the Inspector.
- Select the component you want to inspect.
- A secondary dropdown will appear showing all exposed variables along with their current values.

<img className="screenshot-full img-s" style={{ marginBottom:'15px' }} src="/img/app-builder/access-comp-data/comp-inspect.png" alt="App Builder: Properties Panel"/>

In addition to variables, you may also see certain functions — these are known as Component-Specific Actions (CSA). These actions can be used to programmatically control components. Refer to the [Controlling Visibility and Interactivity of Components](#) guide to learn more about CSAs and how to use them.




















































<!-- 
Component data can be accessed using the exposed variables. Each component in ToolJet, has it's own set of exposed variables which can be used to pass data or value to different components or queries.

A exposed variable of component can be accessed using the following syntax: <br/>
`{{components.<component-name>.<variable-name>}}`

Example: `{{components.numberinput1.value}}` - This will fetch the value user input in the number input component.
 -->

