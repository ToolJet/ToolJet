---
id: component-state
title: Accessing Components State
---

Each component in ToolJet maintains a state — a collection of values that represent its current data and configuration. This state can be accessed through exposed variables, which allow components to interact with other parts of the application. For example, the value entered into a text input component can be passed to a query to dynamically fetch data from the database.

Each component has a different set of exposed variables based on its functionality — for example, a table component exposes `selectedRow`, a checkbox exposes `isChecked`, and so on. For detailed information on any specific component and its exposed variables, refer to the [individual component](#) guide.

Component state can be accessed and used across the app to build interactive and reactive experiences:
- In queries — to send user inputs or component values as parameters.
    <img style={{ marginTop:'15px' }} className="screenshot-full img-l" src="/img/app-builder/access-comp-data/query-eg.png" alt="App Builder: Properties Panel"/>
- In other components — to conditionally display, update, or interact with components. <br/>
    ***Add Screenshot***

## Available Component States

In the App Builder, you can view all available component states using the Inspector located in the left sidebar. For more details, refer to the [Inspector](#) guide.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/app-builder/access-comp-data/inspector.png" alt="App Builder: Properties Panel"/>

- Open the Component dropdown inside the Inspector.
- Select the component you want to inspect.
- A secondary dropdown will appear showing all the available states.

You can also copy the value or the path of a state, which can be used to access it from another component or query. When you hover over a state in the Inspector, two icons appear — one for copying the path and one for copying the value.

<img className="screenshot-full img-s" style={{ marginBottom:'15px' }} src="/img/app-builder/access-comp-data/comp-inspect.png" alt="App Builder: Properties Panel"/>

In addition to variables, you may also see certain functions — these are known as Component-Specific Actions (CSA). These actions can be used to programmatically control components. Refer to the [Controlling Visibility and Interactivity of Components](#) guide to learn more about CSAs and how to use them.

## Accessing Component State

A state of a component can be accessed using the following syntax: <br/>
`{{components.<component-name>.<variable-name>}}`

Example: `{{components.numberinput1.value}}` - This will fetch the value entered by the user in the **numberinput1** component.

