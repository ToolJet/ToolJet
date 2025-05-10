---
id: component-state
title: Accessing Components State
---

Each component holds some data, which can be used to build dynamic and interactive applications. For example, you can dynamically fetch data of a particular candidate from the database when a user enters the candidate name in the input field.

This data is stored in the form of exposed variables. Each component has a different set of exposed variables based on its functionality — for example, an input field exposes a value, a table exposes a selectedRow, and so on. For detailed information on any specific component and its exposed variables, refer to the [individual component guide](#).

The exposed variables from components can be used:
- Inside queries — to send user inputs or values as parameters.
- Inside other components — to dynamically display values, or interact with the component.

## Available Component States

In the App Builder, you can view all available component states (exposed variables and their current values) using the Inspector located in the left sidebar. For more details, refer to the [Inspector](#) guide.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/app-builder/access-comp-data/inspector.png" alt="App Builder: Properties Panel"/>

- Open the Component dropdown inside the Inspector.
- Select the component you want to inspect.
- A secondary dropdown will appear showing all the available states.

You can also copy the value or copy the path of the state, that can be used to access the value from other component or query. When you will hover over a state, you will be able to see two icons, which can be used to copy the path or the value.

<img className="screenshot-full img-s" style={{ marginBottom:'15px' }} src="/img/app-builder/access-comp-data/comp-inspect.png" alt="App Builder: Properties Panel"/>

In addition to variables, you may also see certain functions — these are known as Component-Specific Actions (CSA). These actions can be used to programmatically control components. Refer to the [Controlling Visibility and Interactivity of Components](#) guide to learn more about CSAs and how to use them.

## Accessing Component State

A state of a component can be accessed using the following syntax: <br/>
`{{components.<component-name>.<variable-name>}}`

Example: `{{components.numberinput1.value}}` - This will fetch the value entered by the user in the **numberinput1** component.

