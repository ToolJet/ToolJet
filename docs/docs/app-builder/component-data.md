---
id: component-data
title: Accessing Components Data
---

Component data can be accessed using the exposed variables. Each component in ToolJet, has it's own set of exposed variables which can be used to pass data or value to different components or queries.

A exposed variable of component can be accessed using the following syntax: <br/>
`{{components.<component-name>.<variable-name>}}`

Example: `{{components.numberinput1.value}}` - This will fetch the value user input in the number input component.

## Inspector Element

To learn more about a component, its exposed variables, and available component-specific actions, use the Inspector located on the left sidebar of the app builder. For more details, refer to the [Inspector](#) guide.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-m" src="/img/app-builder/access-comp-data/inspector.png" alt="App Builder: Properties Panel"/>

Within the Component dropdown of the Inspector, select the desired component to view a secondary dropdown listing all available functions and variables. Functions are also known as Component-Specific Actions (CSA) and can be used to interact with or control the component.

<img className="screenshot-full img-m" src="/img/app-builder/access-comp-data/comp-inspect.png" alt="App Builder: Properties Panel"/>

