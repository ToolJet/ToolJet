---
id: component-state
title: Component State
---

Every ToolJet component maintains a state—a set of values representing its current data and configuration. This state can be accessed through exposed variables, which allow components to interact with other parts of the application. For example, the value entered into a text input component can be passed to a query to fetch data from the database.

Each component has a unique set of exposed variables based on its functionality — for example, a **Table** component exposes `selectedRow`, a checkbox exposes `isChecked`, and so on. 

Component states in ToolJet are dynamic and can be modified at runtime using built-in functions called [Component-Specific Actions (CSAs)](/docs/beta/app-builder/events/use-case/csa), such as `reset()`, `setValue()`, and `setVisibility()`. These actions let you trigger logic in response to user interactions. 

Component states can be used across the application to build interactive and reactive experiences:
- In queries — to send user inputs or component values as parameters.
- In other components — to conditionally display, update, or interact with components.

## Available Component States

In the App-Builder, you can view all available component states using the Inspector located in the left sidebar. For more details, refer to the [Inspector](/docs/beta/app-builder/debugging/inspector) guide.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/app-builder/access-comp-data/inspector.png" alt="App Builder: Properties Panel"/>

- Open the Components dropdown inside the Inspector.
- Select the component whose state you want to inspect.
- A secondary dropdown will appear showing all the available states.

You can also copy the state value or its path, which can be used to access it from another component or query. When you hover over a state in the Inspector, two icons appear — one for copying the path and one for copying the value.

<img className="screenshot-full img-s" style={{ marginBottom:'15px' }} src="/img/app-builder/access-comp-data/comp-inspect.png" alt="App Builder: Properties Panel"/>

## Accessing Component State

You can access a component’s state using the following syntax: <br/>
`{{components.<component-name>.<variable-name>}}`

Example: `{{components.numberinput1.value}}` - This will fetch the value entered by the user in the **numberinput1** component.

