---
id: graphql
title: GraphQL
---

ToolJet peut établir des connexions avec des points de terminaison GraphQL, permettant l'exécution de requêtes et de mutations.

## Connexion

Pour établir une connexion avec la source de données globale GraphQL, vous pouvez soit cliquer sur le bouton **+ Add new datasource** situé sur le panneau de requêtes, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** via le tableau de bord ToolJet.

ToolJet nécessite les éléments suivants pour se connecter à une source de données GraphQL.

### Identifiants

- **Base URL** : L'URL du point de terminaison de l'API GraphQL vers lequel les requêtes sont envoyées.
- **Headers** : Paires clé-valeur envoyées avec la requête pour fournir des métadonnées telles que des jetons d'authentification ou le type de contenu.
- **URL parameters** : Paires clé-valeur supplémentaires ajoutées à l'URL de la requête sous forme de paramètres de chaîne de requête.
- **Body** : La charge utile de la requête contenant la requête GraphQL, les variables ou les données de mutation.
- **Cookies** : Valeurs de cookies incluses avec la requête pour la gestion de session ou l'authentification.

<img className="screenshot-full img-l" src="/img/datasource-reference/graphql/connection-v4.png" alt="Data source GraphQL"/>

### Types d'authentification

La méthode d'authentification à utiliser avec les requêtes GraphQL.

  - **None** : Aucune identifiant ni jeton requis.

  - **Basic** : Nécessite un nom d'utilisateur et un mot de passe.
  <img className="screenshot-full img-full" src= "/img/datasource-reference/graphql/basic-conenction.png" alt="basic GraphQL Connection" style={{marginBottom:'15px'}} />

  - **Bearer** : Nécessite un jeton, généralement un JSON Web Token (JWT), pour accorder l'accès.
  <img className="screenshot-full img-full" src="/img/datasource-reference/graphql/bearer-connection.png" alt="bearer-GraphQL-Connection" style={{marginBottom:'15px'}}/>

  - **OAuth 2.0** : Le protocole OAuth 2.0 impose de fournir les paramètres suivants : URL du jeton d'accès, en-têtes personnalisés de l'URL du jeton d'accès, ID client, secret client, portées, authentification du client, jetons d'accès, URL d'autorisation, paramètres d'authentification personnalisés et paramètres de requête personnalisés.
  <img className="screenshot-full img-l" src="/img/datasource-reference/graphql/oauth-connection.png" alt="oauth 2.0-GraphQL-Connection"/>

## Interroger GraphQL

1. Cliquez sur le bouton **+** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **GraphQL** ajoutée à l'étape précédente.
3. Ajoutez la requête.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour créer et déclencher la requête.

**Paramètres requis**
- Query

**Paramètres optionnels**
- Variables
- Headers
- Params
- Cookies

<img className="screenshot-full img-full" src="/img/datasource-reference/graphql/query-v4.png" alt="GraphQl querying" style={{marginBottom:'15px'}}/>

#### Exemple

```yaml
{
  todos {
    id
    description
  }
}
```

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour savoir comment procéder : [link](/docs/app-builder/custom-code/transform-data)
:::

## Métadonnées

Les métadonnées sont des informations supplémentaires sur les données renvoyées par la requête GraphQL. Elles incluent des détails tels que l'URL de la requête, la méthode, les en-têtes et le code de statut de la réponse. Vous pouvez accéder à ces informations à l'aide de l'objet `metadata`. REST API. Les métadonnées peuvent être consultées au sein des requêtes et des composants à l'aide de la syntaxe `{{queries.<queryname>.metadata}}`.

:::info
Lors de l'accès aux propriétés de l'objet metadata contenant un trait d'union, vous pouvez utiliser la notation entre crochets. Par exemple, pour accéder à la propriété `content-length`, vous pouvez utiliser `{{queries.graphql1.metadata.request.headers["content-length"]}}` ou `{{queries.graphql1.metadata.request.headers."content-length"}}`.
:::

<details id="tj-dropdown">
<summary>**Exemple de métadonnées**</summary>

```json
{
  "request": {
    "url": "https://swapi-graphql.netlify.app/.netlify/functions/index?testParam=valueParam",
    "method": "POST",
    "headers": {
      "user-agent": "got (https://github.com/sindresorhus/got)",
      "header1key": "Header1value",
      "content-type": "application/json",
      "content-length": "275",
      "accept-encoding": "gzip, deflate, br"
    },
    "params": {
      "testParam": "valueParam"
    }
  },
  "response": {
    "statusCode": 200,
    "headers": {
      "access-control-allow-origin": "*",
      "age": "0",
      "cache-control": "no-cache",
      "cache-status": ""Netlify Durable"; fwd=method, "Netlify Edge"; fwd=method",
      "content-encoding": "br",
      "content-length": "840",
      "content-type": "application/json; charset=utf-8",
      "date": "Fri, 13 Sep 2024 06:38:27 GMT",
      "etag": "W/"18ad-ZANyCoLSJjHWg3k1SaMp6gH/gdQ"",
      "netlify-vary": "query",
      "server": "[REDACTED]",
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
      "vary": "Accept-Encoding",
      "x-nf-request-id": "01J7N1NG25V8Q9GY51RH11ACTN",
      "x-powered-by": "Express",
      "connection": "close"
    }
  }
}
```

</details>
