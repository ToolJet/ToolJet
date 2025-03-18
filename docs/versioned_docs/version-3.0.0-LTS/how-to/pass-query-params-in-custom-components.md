---
id: pass-query-params-in-custom-components
title: Pass Query Parameters in Custom Components
---

In this guide, you'll learn how to trigger a query with parameters inside a Custom Component.

- To begin, create a **REST API** query with an `id` parameter, and rename it to *getIndividualTodo*. 

- Select `GET` as the operation and enter the URL below under the `URL` property:

```javascript
https://jsonplaceholder.typicode.com/todos/{{parameters.id}}
```

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/how-to/use-query-params-in-custom-components/todo-query.png" alt="Table Component With Data" />
</div>

- Next, drag and drop a **Custom Component** on the canvas. Enter the code below under its `Data` property:

```javascript
{{
    { title: 'Todos', buttonText: 'Get Todo', queryData: queries.getIndividualTodo.data}
}}
```

Here, the title for the component, button text, and query data are being passed inside the Custom Component.

- Enter the code below under the `Code` property:

```javascript
import React, { useState, useEffect } from 'https://cdn.skypack.dev/react';
import ReactDOM from 'https://cdn.skypack.dev/react-dom';
import { Button, Container, TextField, Typography } from 'https://cdn.skypack.dev/@material-ui/core';

const MyCustomComponent = ({ data, updateData, runQuery }) => {
  const [todoId, setTodoId] = useState(1);

  const fetchTodo = async () => {
    try {
      const { data: todo } = await runQuery('getIndividualTodo', { id: todoId });
      if (todo) updateData({ ...data, queryData: todo });
    } catch (error) {
      console.error("Error fetching todo:", error);
    }
  };

  return (
    <Container>
      <Typography variant="h4">{data.title}</Typography>
      <TextField
        label="Todo ID"
        value={todoId}
        onChange={(e) => setTodoId(e.target.value)}
        variant="outlined"
        margin="normal"
        fullWidth
      />
      <Button color="primary" variant="outlined" onClick={fetchTodo}>
        Fetch Todo
      </Button>
      {data.queryData?.title && (
        <div>
          <p>ID: <b>{data.queryData.id}</b></p>
          <p>Title: <b>{data.queryData.title}</b></p>
          <p>Completed: <b>{data.queryData.completed ? "Yes" : "No"}</b></p>
        </div>
      )}
    </Container>
  );
};

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);

ReactDOM.render(<ConnectedComponent />, document.body);
```

In the `runQuery('getIndividualTodo', { id: todoId })` function, the parameter is passed by including `id: todoId` as an argument in the query call, which specifies the unique identifier for the todo item being requested.

<div style={{textAlign: 'left', width: '100%', marginTop:'15px', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/use-query-params-in-custom-components/todo-custom-component.png" alt="Custom Component" />
</div>


- Now, when you click the **Fetch Todo** button, the *getIndividualTodo* query will run with the Todo ID passed as a parameter and return the details of the Todo

<div style={{textAlign: 'left', width: '100%', marginTop:'15px', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/use-query-params-in-custom-components/todo-custom-component-with-data.png" alt="Custom Component With Todos Fetched" />
</div>


Note: In a typical JavaScript query, parameters are passed in a manner similar to a standard function call. For example, you can specify the parameters for the query using `queries.getIndividualTodo.run({ id: 2 })`.




