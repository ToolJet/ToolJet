---
id: elasticsearch
title: Elasticsearch
---

ToolJet vous permet de vous connecter à votre cluster Elasticsearch pour effectuer des opérations de lecture/écriture de données et exécuter diverses requêtes.

## Connexion

Pour vous connecter à une source de données Elasticsearch dans ToolJet, vous pouvez soit cliquer sur le bouton **+ Add new data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

:::info
Assurez-vous que le **Host/IP** de la base de données est accessible depuis votre VPC si vous auto-hébergez ToolJet. Si vous utilisez ToolJet Cloud, veuillez **autoriser (whitelist)** notre adresse IP.
:::

Pour vous connecter à votre cluster Elasticsearch, les informations suivantes sont requises :

- **Host**
- **Port**
- **Username**
- **Password**

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/connection-v4.png" alt="Elasticsearch Connection" />

ToolJet prend également en charge les connexions basées sur des certificats SSL :

-  CA certificate
-  Client certificate

## Interroger Elasticsearch

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes en bas de l'éditeur, puis sélectionnez la source de données Elasticsearch ajoutée précédemment.
2. Choisissez l'opération que vous souhaitez effectuer sur votre cluster Elasticsearch.

:::tip
Les résultats de la requête peuvent être transformés à l'aide des transformations. Consultez notre documentation sur les transformations pour plus de détails : **[lien](/docs/app-builder/custom-code/transform-data)**
:::

## Opérations prises en charge

ToolJet prend en charge les opérations Elasticsearch suivantes :

- **[Search](#search)**
- **[Index a Document](#index-a-document)**
- **[Get a Document](#get-a-document)**
- **[Update a Document](#update-a-document)**
- **[Delete a Document](#delete-a-document)**
- **[Bulk Operation](#bulk-operation)**
- **[Count Documents](#count-documents)**
- **[Check Document Existence](#check-document-existence)**
- **[Multi Get](#multi-get)**
- **[Scroll Search](#scroll-search)**
- **[Clear Scroll](#clear-scroll)**
- **[Get Cat Indices](#get-cat-indices)**
- **[Get Cluster Health](#get-cluster-health)**

### Search

Cette opération exécute une requête de recherche et retourne les résultats correspondants. Pour plus de détails, consultez le guide de recherche Elasticsearch **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)**.

#### Paramètre requis

- **Index** : le nom de l'index dans lequel effectuer la recherche.
- **Query** : la requête de recherche au format JSON.

#### Paramètre optionnel

- **Scroll** : le temps de scroll.

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/search-query.png" alt="Elastic search" />

#### Exemple :

```yaml
Index: books
Query: { "query": { "match": { "title": "The Great Gatsby" } }, "size": 20 }
Scroll: 1m # Can be in the format of 1m, 1h, 1d.
```

### Index a Document

Cette opération ajoute un document JSON à l'index ou au flux de données spécifié. Pour plus de détails, consultez le guide d'indexation Elasticsearch **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html)**.

#### Paramètre requis

- **Index** : le nom de l'index auquel ajouter le document
- **Body** : le corps du document au format JSON

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/index-query.png" alt="Elastic index"/>

#### Exemple :

```yaml
Index: books
Body:
  {
    "title": "1984",
    "author": "George Orwell",
    "year": 1949,
    "genre": "Dystopian Fiction",
  }
```

### Get a Document

Cette opération récupère le document JSON spécifié depuis l'index. Pour plus de détails, consultez le guide Elasticsearch sur la récupération de documents **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html)**.

#### Paramètre requis

- **Index** : le nom de l'index depuis lequel récupérer le document
- **Id** : l'ID du document à récupérer

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/get-a-doc-query.png"  alt="Elastic get document"/>

#### Exemple :

```yaml
Index: books
Id: FJXTSZEBsuzUn2y4wZ-W
```

### Update a Document

Cette opération met à jour un document à l'aide du script spécifié. Pour plus de détails, consultez le guide Elasticsearch sur la mise à jour de documents **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html)**.

#### Paramètre requis

- **Index** : le nom de l'index contenant le document
- **Id** : l'ID du document à mettre à jour
- **Body** : le script de mise à jour ou le document partiel au format JSON

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/update-query.png" alt="Elastic update"/>

#### Exemple :

```yaml
Index: books
Id: FJXTSZEBsuzUn2y4wZ-W
Body:
{
  "doc": {
    "title": "1984",
    "author": "George Orwell",
    "year": 1949,
    "genre": "Fiction"
  }
}
```

### Delete a Document

Cette opération supprime un document JSON de l'index spécifié. Pour plus de détails, consultez le guide Elasticsearch sur la suppression de documents **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-delete.html)**.

#### Paramètre requis

- **Index** : le nom de l'index contenant le document
- **Id** : l'ID du document à supprimer

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/delete-query.png" alt="Elastic delete"/>

#### Exemple :

```yaml
Index: books
Id: FJXTSZEBsuzUn2y4wZ-W
```

### Bulk Operation

Cette opération effectue plusieurs opérations d'indexation/mise à jour/suppression en un seul appel API. Pour plus de détails, consultez le guide Elasticsearch sur les opérations en masse **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html)**.

#### Paramètre requis

- **Operations** : les opérations en masse à effectuer, au format JSON

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/bulk-operation.png" alt="Elastic bulk"/>

#### Exemple :

```yaml
[
  { "index": { "_index": "books", "_id": "book1" } },
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "year": 1925,
  },
  { "delete": { "_index": "books", "_id": "book2" } },
  { "index": { "_index": "books", "_id": "book3" } },
  { "title": "Moby-Dick", "author": "Herman Melville", "year": 1851 },
  { "delete": { "_index": "books", "_id": "book4" } },
]
```

### Count Documents

Cette opération retourne le nombre de résultats correspondant à une requête de recherche. Pour plus de détails, consultez le guide Elasticsearch sur le comptage **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-count.html)**.

#### Paramètre requis

- **Index** : le nom de l'index dans lequel compter les documents.

#### Paramètre optionnel

- **Query** : la requête permettant de filtrer les documents, au format JSON

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/countdoc-query.png" alt="Elastic count"/>

#### Exemple :

```yaml
{ "query": { "range": { "timestamp": { "gte": 1901 } } } }
```

### Check Document Existence

Cette opération vérifie si un document existe dans un index. Pour plus de détails, consultez le guide Elasticsearch sur la vérification d'existence **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html#docs-get-api-response-codes)**.

#### Paramètre requis :

- **Index** : le nom de l'index dans lequel vérifier l'existence du document
- **Id** : l'ID du document à vérifier

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/check-query.png" alt="Elastic exists"/>

#### Exemple :

```yaml
Index: books
Id: FJXTSZEBsuzUn2y4wZ-W
```

### Multi Get

Cette opération récupère plusieurs documents en une seule requête. Pour plus de détails, consultez le guide Elasticsearch sur le multi-get **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-multi-get.html)**.

#### Paramètre requis

- **Operations** : les opérations multi-get à effectuer, au format JSON

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/multi-get-query.png" alt="Elastic multi get"/>

#### Exemple :

```yaml
{
  "docs":
    [
      { "_index": "books", "_id": "book124" },
      { "_index": "books", "_id": "book125" },
    ],
}
```

### Scroll Search

Cette opération récupère un grand nombre de résultats à partir d'une seule requête de recherche. Pour plus de détails, consultez le guide Elasticsearch sur le scroll **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#scroll-search-results)**.

#### Paramètre requis

- **Scroll ID** : l'ID de scroll pour la recherche
- **Scroll** : le temps de scroll

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/scroll-query.png" alt="Elastic scroll"/>

#### Exemple :

```yaml
Scroll ID: DXF1ZXJ5QW5kRmV0Y2gBAAAAAAAAOWQWYm9vbDItY1NCOUExal9TcTBjeUEyZw
Scroll: 60m
```

### Clear Scroll

Cette opération efface le contexte de recherche d'un scroll. Pour plus de détails, consultez le guide Elasticsearch sur l'effacement de scroll **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/clear-scroll-api.html)**.

#### Paramètre requis

- **Scroll ID** : l'ID de scroll à effacer

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/clear-scroll-query.png" alt="Elastic clear scroll"/>

#### Exemple :

```yaml
Scroll ID: DXF1ZXJ5QW5kRmV0Y2gBAAAAAAAAOWQWYm9vbDItY1NCOUExal9TcTBjeUEyZw
```

### Get Cat Indices

Cette opération fournit une vue compacte et alignée en colonnes des index d'un cluster. Pour plus de détails, consultez le guide Elasticsearch sur les cat indices **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/cat-indices.html)**.

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/get-indices-query.png" alt="Elastic cat indices" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>
```json
{
  "body": [
    {
      "health": "yellow",
      "status": "open",
      "index": "1",
      "uuid": "JQOzqxK7Rdar7ROOlqXwkA",
      "pri": "1",
      "rep": "1",
      "docs.count": "2",
      "docs.deleted": "0",
      "store.size": "9.2kb",
      "pri.store.size": "9.2kb"
    },
    {
      "health": "yellow",
      "status": "open",
      "index": "recipes",
      "uuid": "eNGdAsG4TMWvs9f0eLERlQ",
      "pri": "1",
      "rep": "1",
      "docs.count": "20",
      "docs.deleted": "0",
      "store.size": "30kb",
      "pri.store.size": "30kb"
    },
    {
      "health": "yellow",
      "status": "open",
      "index": "read_me",
      "uuid": "EbE4V-5RRE2y-_P4z_auVQ",
      "pri": "1",
      "rep": "1",
      "docs.count": "1",
      "docs.deleted": "0",
      "store.size": "5.1kb",
      "pri.store.size": "5.1kb"
    }
  ],
  "statusCode": 200,
  "headers": {
    "x-elastic-product": "Elasticsearch",
    "content-type": "application/json",
    "content-length": "558"
  },
  "meta": {
    "context": null,
    "request": {
      "params": {
        "method": "GET",
        "path": "/_cat/indices",
        "body": null,
        "querystring": "format=json",
        "headers": {
          "user-agent": "opensearch-js/1.2.0 (linux 6.5.0-1021-aws-x64; Node.js v22.15.1)"
        },
        "timeout": 30000
      },
      "options": {},
      "id": 1
    },
    "name": "opensearch-js",
    "connection": {
      "url": "http://xx.2xx.183.199:9200/",
      "id": "http://xx.2xx.183.199:9200/",
      "headers": {},
      "deadCount": 0,
      "resurrectTimeout": 0,
      "_openRequests": 0,
      "status": "alive",
      "roles": {
        "master": true,
        "data": true,
        "ingest": true
      }
    },
    "attempts": 0,
    "aborted": false
  }
}
```
</details>

### Get Cluster Health

Cette opération récupère l'état de santé du cluster. Pour plus de détails, consultez le guide Elasticsearch sur la santé du cluster **[ici](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-health.html)**.

<img className="screenshot-full img-full" src="/img/datasource-reference/elasticsearch/get-cluster-query.png" alt="Elastic cluster health" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>
```json
{
  "body": {
    "cluster_name": "docker-cluster",
    "status": "yellow",
    "timed_out": false,
    "number_of_nodes": 1,
    "number_of_data_nodes": 1,
    "active_primary_shards": 10,
    "active_shards": 10,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 3,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 76.92307692307693
  },
  "statusCode": 200,
  "headers": {
    "x-elastic-product": "Elasticsearch",
    "content-type": "application/json",
    "content-length": "405"
  },
  "meta": {
    "context": null,
    "request": {
      "params": {
        "method": "GET",
        "path": "/_cluster/health",
        "body": null,
        "querystring": "",
        "headers": {
          "user-agent": "opensearch-js/1.2.0 (linux 6.5.0-1021-aws-x64; Node.js v22.15.1)"
        },
        "timeout": 30000
      },
      "options": {},
      "id": 1
    },
    "name": "opensearch-js",
    "connection": {
      "url": "http://xx.2xx.183.199:9200/",
      "id": "http://xx.2xx.183.199:9200/",
      "headers": {},
      "deadCount": 0,
      "resurrectTimeout": 0,
      "_openRequests": 0,
      "status": "alive",
      "roles": {
        "master": true,
        "data": true,
        "ingest": true
      }
    },
    "attempts": 0,
    "aborted": false
  }
}
```
</details>
