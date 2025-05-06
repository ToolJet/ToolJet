---
id: component-data
title: Accessing Components Data
---

Each component holds some data, which can be used to build dynamic and interactive applications. For example, you can dynamically fetch data of a particular candidate from the database when a user enters the candidate name in the input field.

This data is stored in the form of exposed variables. Each component has a different set of exposed variables based on its functionality — for example, an input field exposes a value, a table exposes a selectedRow, and so on. For detailed information on any specific component and its exposed variables, refer to the [individual component guide](#).

This exposed variables can be used inside queries or can be refered to other components.

## Accessing Exposed Variable

An exposed variable of a component can be accessed using the following syntax: <br/>
`{{components.<component-name>.<variable-name>}}`

Example: `{{components.numberinput1.value}}` - This will fetch the value user input in the number input component.






















































<!-- 
Component data can be accessed using the exposed variables. Each component in ToolJet, has it's own set of exposed variables which can be used to pass data or value to different components or queries.

A exposed variable of component can be accessed using the following syntax: <br/>
`{{components.<component-name>.<variable-name>}}`

Example: `{{components.numberinput1.value}}` - This will fetch the value user input in the number input component.

## Inspector Element

To learn more about a component, its exposed variables, and available component-specific actions, use the Inspector located on the left sidebar of the app builder. For more details, refer to the [Inspector](#) guide.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-m" src="/img/app-builder/access-comp-data/inspector.png" alt="App Builder: Properties Panel"/>

Within the Component dropdown of the Inspector, select the desired component to view a secondary dropdown listing all available functions and variables. Functions are also known as Component-Specific Actions (CSA) and can be used to interact with or control the component.

<img className="screenshot-full img-m" src="/img/app-builder/access-comp-data/comp-inspect.png" alt="App Builder: Properties Panel"/> -->

