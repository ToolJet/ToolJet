---
id: querying-rest-api
title: Querying REST API
---

## Créer des requêtes

Une fois connecté à la source de données REST API, vous pouvez facilement écrire des requêtes et interagir avec la REST API dans l'application ToolJet. Suivez ces étapes pour commencer :

1. Cliquez sur le bouton **+ Add** dans le gestionnaire de requêtes du panneau inférieur de l'éditeur.
2. Sélectionnez **REST API** dans la section Data Source.
3. Saisissez les paramètres de requête requis.
4. Cliquez sur **Preview** pour visualiser les données renvoyées par la requête ou cliquez sur **Run** pour l'exécuter.

:::tip
Vous pouvez également transformer les résultats de la requête à l'aide de la fonctionnalité **[Transformations](/docs/app-builder/custom-code/transform-data)**.
:::

ToolJet prend en charge les méthodes HTTP REST suivantes :

- **GET**
- **POST**
- **PUT**
- **PATCH**
- **DELETE**

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/listops-query.png" alt="REST API query operations" />

:::info
Pour recevoir la chaîne `"undefined"` au lieu d'une valeur `undefined` réelle, cela doit être explicitement géré dans le gestionnaire de requêtes. <br/>
Exemple : `"address": "{{components.table1.selectedRow?.address ?? 'undefined'}}"`
:::

### En-tête additionnel

Chaque fois qu'une requête est envoyée à la REST API, un en-tête **tj-x-forwarded-for** est ajouté à la requête ; la valeur de cet en-tête correspond à l'adresse IP de l'utilisateur connecté à l'application ToolJet. Cet en-tête peut être utilisé pour identifier l'utilisateur à l'origine de la requête vers la REST API.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/request-header.png" alt="REST API - additional header querying"/>

## Types de requête / de contenu

Par défaut, la REST API envoie un corps au format **JSON**. Si vous souhaitez envoyer un type de corps différent, vous pouvez saisir les en-têtes appropriés dans la section **Headers**.

Par exemple, pour envoyer un corps de type **multipart/form-data**, vous pouvez ajouter l'en-tête suivant :

```javascript
  Content-Type: multipart/form-data;
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/rest-api/form-headers.png" alt="REST API query headers" />

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/form-body.png" alt="REST API query body" />
<br/><br/>

:::info Handling OAuth Token via REST API
Pour obtenir un jeton OAuth via la REST API, ajoutez l'en-tête personnalisé suivant : <br/>
`Content-Type: application/x-www-form-urlencoded`
:::

## Types de réponse et traitement

Les REST API peuvent renvoyer des données dans divers formats, notamment **JSON** et **Base64**. JSON est un format courant utilisé pour l'échange de données dans les REST API, tandis que Base64 est souvent utilisé pour encoder des données binaires, telles que des images ou des vidéos, dans une réponse JSON.
Lorsque le **content-type** de la réponse est **image**, la réponse sera une chaîne **base64**.

<details id="tj-dropdown">
<summary>**Exemple de réponse JSON**</summary>

```json
[
  {
    "id": "3",
    "name": "Apple iPhone 12 Pro Max",
    "data": {
      "color": "Cloudy White",
      "capacity GB": 512
    }
  },
  {
    "id": "5",
    "name": "Apple iPhone 13",
    "data": {
      "color": "Midnight",
      "capacity GB": 256
    }
  },
  {
    "id": "10",
    "name": "Apple iPad Pro",
    "data": {
      "color": "Space Gray",
      "capacity GB": 128
    }
  }
]
```

La réponse JSON peut être facilement chargée sur des composants comme **table** et **listview** en utilisant `{{queries.<queryname>.data}}`

</details>

Vous pouvez également utiliser des méthodes JS comme **map** pour charger des données sur des composants comme **dropdown** en utilisant **`{{queries.restapi1.data.map(i => i.title)}}`**

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/dropdown-query.png" alt="REST API dropdown component mapping " />

<details id="tj-dropdown">
<summary>**Exemple de réponse base64**</summary>
```base64
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
```
</details>

Consultez le guide sur le **[chargement de données base64](/docs/widgets/image/loading-image-pdf-from-db)**.

<img className="screenshot-full" src="/img/datasource-reference/rest-api/image-comp-query.png" alt=" REST API image component mapping" />

## Réessayer en cas d'erreurs réseau {#retry-on-network-errors}

ToolJet propose une option permettant de réessayer automatiquement les requêtes REST API en cas de certaines erreurs réseau ou de codes de statut HTTP spécifiques. Par défaut, cette fonctionnalité est activée et réessaiera la requête jusqu'à 3 fois en cas d'échec. Cette fonctionnalité peut être activée ou désactivée à la fois au niveau de la source de données et au niveau de la requête individuelle. Lorsqu'elle est activée, les nouvelles tentatives se produiront dans les scénarios suivants :

1. Codes de statut HTTP spécifiques : 408, 413, 429, 500, 502, 503, 504, 521, 522, 524.
2. Erreurs réseau :
   - **ETIMEDOUT** : Une des limites de délai d'expiration a été atteinte.
   - **ECONNRESET** : La connexion a été fermée de force par un pair.
   - **EADDRINUSE** : Impossible de se lier à un port libre.
   - **ECONNREFUSED** : La connexion a été refusée par le serveur.
   - **EPIPE** : Le côté distant du flux en cours d'écriture a été fermé.
   - **ENOTFOUND** : Impossible de résoudre le nom d'hôte en une adresse IP.
   - **ENETUNREACH** : Aucune connexion internet.
   - **EAI_AGAIN** : La résolution DNS a expiré.

Vous pouvez configurer cette fonctionnalité à deux niveaux :

### Niveau de la source de données

Dans la configuration de la source de données REST API, vous trouverez un bouton bascule pour **Retry on network errors**. Cela définit le comportement par défaut pour toutes les requêtes utilisant cette source de données.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/rest-api-data-source.png" alt="ToolJet - Data source - REST API" />

### Niveau de la requête

Dans le générateur de requêtes de chaque requête REST API, vous trouverez un bouton bascule similaire pour **Retry on network errors** sous l'onglet **Settings**. Cela définit le comportement pour cette requête spécifique.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/query-level.png" alt="ToolJet - Data source - REST API" />

:::info
Si la configuration au niveau de la source de données est activée mais qu'une requête spécifique l'a désactivée, le paramètre au niveau de la requête a priorité.
:::
