---
id: pass-query-params-in-custom-components
title: Transmettre des paramètres de requête dans les Custom Components
---

Dans ce guide, vous apprendrez à déclencher une requête avec des paramètres dynamiques depuis l'intérieur d'un Custom Component.

Nous utiliserons un exemple simple : récupérer un élément Todo spécifique en transmettant son `id` en tant que paramètre.

1. **Créer la requête**  
    Tout d'abord, créez une requête REST API, renommez-la en `getIndividualTodo` et ajoutez un paramètre nommé `id`.
    Définissez la méthode sur **GET** et saisissez l'URL suivante dans la propriété *URL* :

    ```js
    https://jsonplaceholder.typicode.com/todos/{{parameters.id}}
    ```
    Ici, `{{parameters.id}}` permet à la requête de recevoir une valeur d'id dynamique lorsqu'elle est déclenchée.

    <img className="screenshot-full img-full" src="/img/how-to/use-query-params-in-custom-components/v2/todoQuery.png" alt="Todo Query" />

2. **Ajouter un Custom Component**  
    Faites glisser et déposez un Custom Component sur le canevas.
    Définissez la propriété *Data* comme suit :

    ```js
    {{
        { title: 'Todos', buttonText: 'Get Todo', queryData: queries.getIndividualTodo.data}
    }}
    ```
    
    Ceci transmet le titre, le texte du bouton et les données de la requête au Custom Component.

3. **Ajouter le code du composant**  

    Collez le code suivant dans la propriété *Code* :

    ```js
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

    Dans `runQuery('getIndividualTodo', { id: todoId })`, la valeur de `todoId` est envoyée à la requête en tant que `id` via les paramètres. Cette valeur remplace `{{parameters.id}}` dans l'URL de la requête lorsque la requête s'exécute, ce qui permet de transmettre dynamiquement le Todo ID.

    <img className="screenshot-full img-full" src="/img/how-to/use-query-params-in-custom-components/v2/todoCustomComponent.png" alt="Todo Custom Component" />


4. **Récupérer le Todo**  
    Maintenant, lorsque vous cliquez sur le bouton **Fetch Todo**, la requête *getIndividualTodo* s'exécutera avec le Todo ID transmis en tant que paramètre et renverra les détails du Todo.

    <img className="screenshot-full img-full" src="/img/how-to/use-query-params-in-custom-components/v2/todoCustomComponentWithData.png" alt="Todo Custom Component with Data" />


:::note
Dans une requête JavaScript classique, les paramètres sont transmis d'une manière similaire à un appel de fonction standard. Par exemple, vous pouvez spécifier les paramètres de la requête à l'aide de `queries.getIndividualTodo.run({ id: 2 })`
:::