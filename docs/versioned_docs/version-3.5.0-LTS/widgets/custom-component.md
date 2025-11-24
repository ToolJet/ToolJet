---
id: custom-component
title: Custom Component
---

ToolJet allows you to create your own React component using the **Custom Component**, providing greater flexibility and customization for your application. The **Custom Component** has two main properties:

1. **[Data](#data)**: Used to pass data or query names to the component. These queries can be triggered from inside the component.
2. **[Code](#code)**: Used to write the React code for the **Custom Component**. ToolJet offers two built-in functions to interact with the component: [Update Data](#update-data-function) function and [Run Query](#run-query-function) function.


## Data

Data can be passed to a custom component using the **Data** field. The data should be structured as an object or an array of objects. Query name can also be passed through this field to trigger queries using the custom component.

<img className="screenshot-full" src="/img/widgets/custom-component/data.png" alt="Custom Component Data Property" />

#### Example:
```json
{{{ 
    title: 'Hi! There', 
    buttonText: 'Update Title',
    queryName: 'fetchData'
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

### Passing Data Through Query

Data fetched from a query can also be passed to the **Custom Component** in the data object.

<img className="screenshot-full" src="/img/widgets/custom-component/query-data.png" alt="Custom Component Data Property" />


## Code

The React code for a **Custom Component** can be added in the **Code** field. You can interact with the application through the custom component using the following parameter and in-built functions.

### Data Parameter

To access the data passed through the [data](#data) field, define the `data` parameter to the *MyCustomComponent* funtion.

#### Example

```js
import React from 'https://cdn.skypack.dev/react';
import ReactDOM from 'https://cdn.skypack.dev/react-dom';
import { Button, Container } from 'https://cdn.skypack.dev/@material-ui/core';

const MyCustomComponent = ({data}) => (
  <Container>
      <p>Employee Name: <b>{data.name}</b></p>
      <p>Designation: <b>{data.designation}</b></p>
      <p>Department: <b>{data.department}</b></p>
    </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
```

<img className="screenshot-full" src="/img/widgets/custom-component/data-prop.png" alt="Custom Component Data Property" />

### Update Data Function

To update the data in the data object, you can use the in-built `updateData` function.

#### Example

```js
import React from 'https://cdn.skypack.dev/react';
import ReactDOM from 'https://cdn.skypack.dev/react-dom';
import { Button, Container } from 'https://cdn.skypack.dev/@material-ui/core';

const MyCustomComponent = ({data, updateData}) => (
  <Container>
    <p>Employee Name: <b>{data.name}</b></p>
    <p>Status: <b>{data.status}</b></p>
    <Button
      color="primary"
      variant="outlined"
      onClick={() => {updateData({status: 'Inactive'})}}
    >
      {data.button}
    </Button>
  </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
```

<img className="screenshot-full" src="/img/widgets/custom-component/update-data.png" alt="Custom Component Data Property" />

### Run Query Function

**Custom Component** in ToolJet can be used to trigger queries. You can specify the query name in the [data](#data) field. Use the in-built `runQuery` function to execute the query dynamically from within the **Custom Component**.

#### Example

```js
import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
import { Button, Container } from "https://cdn.skypack.dev/@material-ui/core";

const MyCustomComponent = ({ data, runQuery }) => (
  <Container>
    <h1>Employee Details</h1>
    <p>Name: <b>{data.name}</b></p>
    <p>Designation: <b>{data.designation}</b></p>
    <p>Department: <b>{data.department}</b></p>
    <p>Address: <b>{data.address}</b></p>
    <Button
      color="primary"
      variant="contained"
      onClick={() => {
        runQuery(data.queryName);
      }}
    >
      Fetch Contact Info
    </Button>
  </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
```

<img className="screenshot-full" src="/img/widgets/custom-component/run-query.png" alt="Custom Component Run Query code" />
