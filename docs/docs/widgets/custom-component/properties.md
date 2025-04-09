---
id: properties
title: Properties
slug: /widgets/custom-component/
---

**Custom Component** can be used to create your own react component to use within the ToolJet application. Using a **Custom Component** you can access or update data or run queries to interact with the application.

## Data Field

Data can be passed to a custom component using the **Data** field. The data should be structured as an object or an array of objects.

<img className="screenshot-full" src="/img/widgets/custom-component/data.png" alt="Custom Component Data Property" />

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

### Passing Data Through Query

Data fetched from a query can also be passed to the **Custom Component** in the data object.

<img className="screenshot-full" src="/img/widgets/custom-component/query-data.png" alt="Custom Component Data Property" />


## Code Field

The ReactJS code for a **Custom Component** can be added in the **Code** field. ToolJet provides three key properties for interacting with the app.

### Data

To access the data passed through the [data](#data) field, define the `data` parameter to the *MyCustomComponent* funtion. You can then access the properties of the data object using dot notation.

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

### Update Data

To update the data in the data object, you can use the `updateData` property.

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

### Run Query

**Custom Component** in ToolJet can be used to trigger queries. Specify the query name in the data field and use the `runQuery` function to execute the query dynamically when a specific action occurs, such as a button click.

#### Example

```js
iimport React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
import { Button, Container, Typography } from "https://cdn.skypack.dev/@material-ui/core";

const MyCustomComponent = ({ data, runQuery }) => (
  <Container style={{ textAlign: "center", marginTop : "8px"}}>
    <Button
      color="primary"
      variant="contained"
      onClick={() => {
        runQuery(data.queryName);
      }}
    >
      Run Query
    </Button>
  </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
```

<img className="screenshot-full" src="/img/widgets/custom-component/run-query.png" alt="Custom Component Run Query code" />
