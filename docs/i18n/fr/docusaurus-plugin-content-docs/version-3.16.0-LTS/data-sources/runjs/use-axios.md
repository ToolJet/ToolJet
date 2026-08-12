---
id: use-axios-in-runjs
title: Use Axios in RunJS
---

ToolJet vous permet d'effectuer des requêtes HTTP à l'intérieur des requêtes **Run JavaScript (Run JS)** en utilisant **Axios**, un client HTTP basé sur les promesses. Axios vous permet d'interagir avec des API internes ou externes, d'effectuer des requêtes authentifiées, de récupérer des données dynamiques et de gérer une logique de requête complexe à l'aide de méthodes telles que `GET`, `POST`, `PUT/PATCH` et `DELETE` — tout cela au sein d'une seule requête Run JS.

## Importer Axios

Axios est disponible par défaut dans les environnements Run JavaScript :

```javascript
const axios = require("axios");
```

## Requêtes GET

Nous utiliserons **[JSONPlaceholder](https://jsonplaceholder.typicode.com/)**, une API gratuite, pour illustrer les requêtes GET et PUT.

- Créez une requête RunJS depuis le générateur de requêtes et collez le code ci-dessous :

```javascript
var url = "https://jsonplaceholder.typicode.com/users/1";

var data = (await axios.get(url)).data;

return data;
```

_Ce code définit une variable url, effectue une requête GET vers l'API, et renvoie les données. Prévisualisez la requête pour voir la réponse de l'API._

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/axios-get.png" alt="Use Axios in RunJS"/>

## Requêtes POST

- Créez une requête RunJS depuis le générateur de requêtes et collez le code ci-dessous :

```javascript
var url = "https://jsonplaceholder.typicode.com/users";

var data = axios.post(url, {
  id: 11,
  name: "Michael Brown",
  username: "mbrown99",
  email: "michael.b@example.com",
});

return data;
```

Cette requête POST envoie les détails de l'utilisateur au serveur. La réponse du serveur, comme illustré ci-dessous, inclut **Status: 201** indiquant la création réussie de la ressource.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/axios-post.png" alt="Use Axios in RunJS"/>

## Exemples de requêtes

Voici quelques exemples concrets de la façon dont vous pouvez exploiter Axios dans ToolJet.

### Récupérer des données d'API paginées

Cet exemple récupère une liste d'utilisateurs depuis une API externe, gère la pagination et ne renvoie que les champs pertinents.

```javascript
try {
  const response = await axios.get("https://jsonplaceholder.typicode.com/users", {
    params: { _limit: 20 }
  });

  // Simplify the response
  const users = response.data.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));

  return users;

} catch (error) {
  return { error: true, message: error.message };
}
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/custom-javascript/example1.png" alt="axios fetching api example"/>

### Requête API authentifiée (basée sur un jeton)

Utilisez un jeton Bearer stocké dans les variables ToolJet pour effectuer des requêtes authentifiées.

```javascript
try {
  const response = await axios.get("https://api.example.com/me", {
    headers: {
      Authorization: `Bearer ${variables.auth_token}`,
      "Content-Type": "application/json"
    }
  });

  return response.data;

} catch (error) {
  return { error: true, message: error.response?.data };
}
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/custom-javascript/example2.png" alt="axios auth api example"/>

Pour voir Axios en action dans un projet, consultez ce tutoriel :
**[Créer un outil de suivi de l'historique des étoiles GitHub](https://blog.tooljet.com/build-github-stars-history-app-in-5-minutes-using-low-code/)**.
