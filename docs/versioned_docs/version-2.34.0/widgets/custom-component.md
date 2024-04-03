---
id: custom-component
title: Custom Component
---

# Custom Component

Custom Component can be used to do create your own React component when the needed functionality isn't available in other components.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/custom-component/custom-component.png" alt="ToolJet - Widget Reference - Custom Component" />

</div>

## Properties

### Data

The data needs to be an objects which needs to be passed as `data` props to the custom component

**Example:**

```json
{{{
    title: "Hi! There",
    buttonText: "Updated Text",
    queryName: "runjs1"
}}}
```

### Code

This field is used to add a React code for your custom component. The packages for the custom component can be imported from [Skypack](https://www.skypack.dev/) or [esm](https://esm.sh/). For example, to import `React` package into the custom component it can be imported as `import React from 'https://cdn.skypack.dev/react'`.

Tooljet provides 3 props to interact with the app: `data`, `updateData` and `runQuery`.

- `data` is a shared object between custom component and Tooljet app.
- `updateData` is a function which accepts a single object used to update the data passed to the custom component.
- `runQuery` is a function which accepts a query name as a string used to run the query from the custom component.

**Example:**

```js
import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
import { Button, Container, Link } from "https://cdn.skypack.dev/@material-ui/core";

const MyCustomComponent = ({data, updateData, runQuery}) => (
    <Container>
        <h1>{data.title}</h1>
        <Button
            color="primary"
            variant="outlined"
            onClick={() => {updateData({...data, title: 'Hello World!!'})}}>
            {data.buttonText}
        </Button>
        <Button
            color="primary"
            variant="outlined"
            onClick={() => {runQuery(data.queryName)}}
        >
            Run Query
        </Button>
    </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);

ReactDOM.render(<ConnectedComponent />, document.body);
```

:::info
`Tooljet.connectComponent` acts as a HOC and it is required to get access to the data passed into the custom component and run the query
:::

### General
#### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Custom Component" />

</div>

## Layout

| Layout          | description                               | Expected value                                                                                                |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

## Styles

| Style      | Description                                                                                                                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed Variables

| Variables      | Description |
| ----------- | ----------- |
| data | This variable will hold the variables assigned inside the `code` for custom component. You can access the value dynamically using JS: `{{components.customcomponent1.data.title}}`|


## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
