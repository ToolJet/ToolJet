---
id: use-custom-component
title: Use Custom Component
---

In this guide we will see how to use **[Custom Component](/docs/widgets/custom-component/)** in ToolJet.

## Data

We can pass data to our custom react component, using the **Data** property. The data needs to be an object.

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

We can write React code our custom component in the "Code" field. ToolJet provides three key properties to interact with the app:
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
          onClick={() => {updateData({title: 'Hello World!!'})}}
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
