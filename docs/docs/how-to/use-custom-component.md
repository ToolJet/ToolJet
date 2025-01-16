---
id: use-custom-component
title: Use Custom Component
---

This guide explains how to use **[Custom Component](/docs/widgets/custom-component/)** in ToolJet.

## Data

Data can be passed to a custom component using the **Data** property. The data should be structured as an object.

#### Example:
```json
{{{ 
    title: 'Hi! There', 
    buttonText: 'Update Title',
    queryName: 'runQueryExample'
}}}
```
**OR**
```json
{{{ 
    images: [ 
	  { "url" : "https://reqres.in/img/faces/7-image.jpg", "title" : "Olivia"}, 
	  { "url" : "https://reqres.in/img/faces/5-image.jpg", "title" : "Liam"}, 
	  { "url" : "https://reqres.in/img/faces/3-image.jpg", "title" : "Sophia"}
    ]
}}}
```

<img className="screenshot-full" src="/img/how-to/use-custom-component/data.png" alt="Custom Component Data" />

<div style={{paddingTop:'24px'}}>

## Code

The ReactJS code for a custom component can be added in the **Code** field. ToolJet provides three key properties for interacting with the app.
- **data**: Access the passed data.
- **updateData**: Update the data object.
- **runQuery**: Run a query by its name.

#### Example:

```js
import React from 'https://cdn.skypack.dev/react';
  import ReactDOM from 'https://cdn.skypack.dev/react-dom';
  import { Button, Container } from 'https://cdn.skypack.dev/@material-ui/core';
  const MyCustomComponent = ({data, updateData, runQuery}) => (
    <Container>
        <h1>{data.title}</h1>
        <Button
          color="primary"
          variant="outlined"
          onClick={() => {updateData({title: 'Dinner Menu'})}}
        >
          {data.buttonText}
        </Button>
      </Container>
  );
  const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
  ReactDOM.render(<ConnectedComponent />, document.body);
```

<img className="screenshot-full" src="/img/how-to/use-custom-component/code.png" alt="Custom Component Data" />

</div>

<div style={{paddingTop:'24px'}}>

## Running Queries Using Custom Component

Custom components in ToolJet can be used to trigger queries.

Specify the query name in the Data property of the custom component.

<img className="screenshot-full" style={{marginBottom:'15px'}} src="/img/how-to/use-custom-component/run-query-data.png" alt="Custom Component Run Query Data" />

Write the code and use the `runQuery` function to execute the query dynamically when a specific action occurs, such as a button click.

#### Example

```js
import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
import { Button, Container, Typography } from "https://cdn.skypack.dev/@material-ui/core";

const MyCustomComponent = ({ data, updateData, runQuery }) => (
  <Container style={{ textAlign: "center", marginTop : "8px"}}>
    <Button
      color="primary"
      variant="contained"
      onClick={() => {
        runQuery(data.queryName);
      }}
    >
      Search
    </Button>
  </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);

ReactDOM.render(<ConnectedComponent />, document.body);
```

<img className="screenshot-full" src="/img/how-to/use-custom-component/run-query-code.png" alt="Custom Component Run Query code" />

</div>
