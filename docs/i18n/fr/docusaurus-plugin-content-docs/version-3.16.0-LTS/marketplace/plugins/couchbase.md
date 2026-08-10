---
id: marketplace-plugin-couchbase
title: Couchbase
---

ToolJet s'intègre à Couchbase pour exploiter sa base de données NoSQL et ses fonctionnalités avancées de recherche vectorielle. Cela permet d'effectuer des opérations CRUD sur des documents, des requêtes SQL++ et de la recherche plein texte (FTS) au sein des bases de données Couchbase. Les fonctionnalités de vector store prennent en charge la recherche sémantique, les requêtes hybrides et le développement d'applications intelligentes.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à Couchbase, vous aurez besoin des identifiants suivants, que vous pouvez générer depuis la [console Couchbase](https://www.couchbase.com/).

- **Data API Endpoint** 
- **Username**
- **Password**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/connection-v2.png" alt="Configuring Couchbase in ToolJet" />

### Connexion au point de terminaison Data API dans ToolJet

Pour connecter ToolJet à l'API Data de Couchbase, vous devez d'abord activer l'accès à l'API Data et configurer correctement l'authentification.

- **Configurer les adresses IP autorisées** : Pour les connexions publiques, vous devez autoriser l'adresse IP depuis laquelle ToolJet envoie les requêtes. Ajoutez l'IP ou le bloc CIDR requis sous « Allowed IP Addresses ».
- **Configurer les identifiants d'accès au cluster** : Créez ou utilisez des identifiants de cluster existants pour authentifier les requêtes de l'API Data.
- **Récupérer l'URL du point de terminaison Data API** : Une fois activée, Couchbase affiche l'URL du point de terminaison Data API, qui peut être utilisée comme URL de base dans ToolJet.


## Opérations prises en charge

- **[Get Document](#get-document)**
- **[Create Document](#create-document)**
- **[Update Document](#update-document)**
- **[Delete Document](#delete-document)**
- **[Query](#query)**
- **[FTS Search](#fts-search)**

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/listops.png" alt="Couchbase operations" />

### Get Document

Cette opération récupère un document spécifique par son ID depuis une collection Couchbase.

#### Paramètres requis

- **Bucket** : Le nom du bucket contenant le document
- **Document ID** : L'identifiant unique du document à récupérer
- **Scope** : Le nom du scope 
- **Collection** : Le nom de la collection

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/get-doc.png" alt="Get Document Operation" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "id": "user::123",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "created_at": "2026-02-04T12:15:00Z"
}
```
</details>

### Create Document

Cette opération crée un nouveau document dans une collection Couchbase.

#### Paramètres requis

- **Bucket** : Le nom du bucket dans lequel créer le document
- **Scope** : Le nom du scope
- **Collection** : Le nom de la collection
- **Document ID** : L'identifiant unique pour le nouveau document
- **Document** : Les données du document sous forme d'objet JSON


<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/create-doc.png" alt="Create Document Operation" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```yaml
Created successfully
```
</details>

### Update Document

Cette opération met à jour un document existant dans une collection Couchbase.

#### Paramètres requis

- **Bucket** : Le nom du bucket contenant le document
- **Scope** : Le nom du scope
- **Collection** : Le nom de la collection
- **Document ID** : L'identifiant unique du document à mettre à jour
- **Document** : Les données mises à jour du document sous forme d'objet JSON


<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/update-doc.png" alt="Update Document Operation" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```yaml
Updated successfully
```
</details>

Remarque : l'opération de mise à jour remplace le document original par la nouvelle valeur du document transmise. 

### Delete Document

Cette opération supprime un document d'une collection Couchbase.

#### Paramètres requis

- **Bucket** : Le nom du bucket contenant le document
- **Scope** : Le nom du scope
- **Collection** : Le nom de la collection
- **Document ID** : L'identifiant unique du document à supprimer

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/delete-doc.png" alt="Delete Document Operation" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```yaml
Deleted successfully
```
</details>

### Query

Cette opération exécute des requêtes SQL++ sur votre base de données Couchbase.

#### Paramètres requis

- **SQL++ Query** : L'instruction SQL++ à exécuter (utilisez les placeholders `$parameter` pour les paramètres nommés)

#### Paramètres optionnels

- **Arguments (Key-Value)** : Objet clé-valeur pour les paramètres nommés qui remplacent les placeholders `$parameter` dans la requête
- **Query Options** : Objet JSON contenant des options de requête supplémentaires comme `readonly`, `timeout`, etc.

<details id="tj-dropdown">
<summary>**Exemple de requête**</summary>

```sql
SELECT * FROM `travel-sample`.`inventory`.`airline` WHERE country = $country LIMIT 10
```

**Arguments (Key-Value)** : `{ "$country": "France" }`

**Query Options** : `{ "readonly": true, "query_context": "travel-sample.inventory" }`

Consultez les [paramètres de la requête](https://docs.couchbase.com/server/current/n1ql-rest-query/index.html#Request) pour les options de requête prises en charge.

</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/couchbase/query-v2.png" alt="Query Operation" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "results": [
    {
      "airline": {
        "id": 137,
        "type": "airline",
        "name": "Air France",
        "iata": "AF",
        "icao": "AFR",
        "callsign": "AIRFRANS",
        "country": "France"
      }
    }
  ],
  "status": "success",
  "metrics": {
    "elapsedTime": "15.2ms",
    "executionTime": "14.8ms",
    "resultCount": 1,
    "resultSize": 234
  }
}
```
</details>

### FTS Search

Cette opération exécute des requêtes de recherche plein texte (FTS) sur un index FTS Couchbase.

#### Paramètres requis

- **Bucket** : Le nom du bucket dans lequel effectuer la recherche
- **Scope** : Le nom du scope
- **Index Name** : Le nom de l'index FTS sur lequel effectuer la recherche
- **Search Query** : La requête de recherche FTS sous forme d'objet JSON

<details id="tj-dropdown">
<summary>**Exemple de requête de recherche**</summary>

```json
{
  "query": {
    "match": "hotel",
    "field": "name"
  }
}
```

</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/fts-search-v2.png" alt="FTS Search Operation" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
{
  "status": {
    "total": 1,
    "failed": 0,
    "successful": 1
  },
  "request": {
    "query": {
      "match": "hotel",
      "field": "name"
    }
  },
  "hits": [
    {
      "index": "hotel-index",
      "id": "hotel_123",
      "score": 0.8567,
      "fields": {
        "name": "Grand Hotel",
        "city": "Paris",
        "country": "France"
      }
    }
  ],
  "total_hits": 1,
  "max_score": 0.8567,
  "took": 12
}
```
</details> 
