---
id: marketplace-plugin-weaviate
title: Weaviate
---

Weaviate est une base de données vectorielle. L'intégration de Weaviate avec ToolJet permet une recherche vectorielle et une interrogation sémantique efficaces, permettant aux applications de récupérer des informations pertinentes en fonction du sens plutôt que des mots-clés exacts. Cette intégration est idéale pour créer des moteurs de recherche alimentés par l'IA, des systèmes de recommandation et des applications de récupération de connaissances qui améliorent l'expérience utilisateur grâce à des résultats contextuels.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexions

### Cloud

Pour vous connecter à Weaviate Cloud, vous aurez besoin de l'**Instance URL** et de l'**API Key**, qui peuvent être générées depuis la **[Weaviate Console](https://weaviate.io/developers/wcs/connect)**.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/cloud-config.png" alt="Weaviate Configuration" />

### Local

Pour connecter ToolJet à Weaviate Local, vous aurez besoin du **Host** et du **Port**.

Exécutez la commande Docker suivante pour démarrer le conteneur localement. Cela définira le host sur `localhost` et le port sur `8080`.

```yaml
docker run -p 8080:8080 -p 50051:50051 cr.weaviate.io/semitechnologies/weaviate:1.28.4
```

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/local-config.png" alt="Weaviate Configuration" />

## Opérations prises en charge

## Data Type - Schema

### Get Database Schema

Exécutez cette opération pour obtenir le schéma de la base de données.

**Paramètre optionnel**

- **Consistency** : Garantit que la requête est traitée par le nœud leader afin de préserver l'exactitude des données.

<img style = {{ marginBottom : '15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/weaviate/schema-query.png" alt="Weaviate Get Schema" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "classes": [
    {
      "class": "Test_TJ",
      "description": "Overview of a Project",
      "invertedIndexConfig": {
        "bm25": {
          "b": 0.75,
          "k1": 1.2
        },
        "cleanupIntervalSeconds": 300,
        "indexNullState": true,
        "indexPropertyLength": true,
        "indexTimestamps": true,
        "stopwords": {
          "additions": ["custom1"],
          "preset": "en",
          "removals": ["the"]
        }
      },
      "moduleConfig": {
        "text2vec-contextionary": {
          "vectorizeClassName": true
        }
      },
      "multiTenancyConfig": {
        "autoTenantActivation": false,
        "autoTenantCreation": false,
        "enabled": false
      },
      "properties": [
        {
          "dataType": ["text"],
          "description": "Main text field",
          "indexFilterable": true,
          "indexRangeFilters": false,
          "indexSearchable": true,
          "name": "content",
          "tokenization": "word"
        }
      ],
      "replicationConfig": {
        "asyncEnabled": true,
        "deletionStrategy": "NoAutomatedResolution",
        "factor": 1
      },
      "shardingConfig": {
        "virtualPerPhysical": 128,
        "desiredCount": 1,
        "actualCount": 1,
        "desiredVirtualCount": 128,
        "actualVirtualCount": 128,
        "key": "_id",
        "strategy": "hash",
        "function": "murmur3"
      },
      "vectorIndexConfig": {
        "skip": false,
        "cleanupIntervalSeconds": 300,
        "maxConnections": 64,
        "efConstruction": 128,
        "ef": -1,
        "dynamicEfMin": 100,
        "dynamicEfMax": 500,
        "dynamicEfFactor": 8,
        "vectorCacheMaxObjects": 1000000000000,
        "flatSearchCutoff": 40000,
        "distance": "cosine",
        "pq": {
          "enabled": false,
          "bitCompression": false,
          "segments": 0,
          "centroids": 256,
          "trainingLimit": 100000,
          "encoder": {
            "type": "kmeans",
            "distribution": "log-normal"
          }
        },
        "bq": {
          "enabled": false
        },
        "sq": {
          "enabled": false,
          "trainingLimit": 100000,
          "rescoreLimit": 20
        },
        "filterStrategy": "sweeping"
      },
      "vectorIndexType": "hnsw",
      "vectorizer": "none"
    }
  ]
}
```

</details>

## Data Type - Collection

### Get Collection

**Paramètre requis**

- **Collection Name** : Nom de la collection souhaitée pour récupérer ses détails.

**Paramètre optionnel**

- **Consistency** : Garantit que la requête est traitée par le nœud leader afin de préserver l'exactitude des données.

<img style = {{ marginBottom : '15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/weaviate/get-collection-v2.png" alt="Weaviate get collection" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "class": "Project_Collection",
  "description": "This collection contains objectives and overview of a project",
  "invertedIndexConfig": {
    "bm25": {
      "b": 0.75,
      "k1": 1.2
    },
    "cleanupIntervalSeconds": 60,
    "stopwords": {
      "additions": null,
      "preset": "en",
      "removals": null
    },
    "usingBlockMaxWAND": true
  },
  "moduleConfig": {},
  "multiTenancyConfig": {
    "autoTenantActivation": false,
    "autoTenantCreation": false,
    "enabled": false
  },
  "properties": [
    {
      "dataType": ["int"],
      "indexFilterable": true,
      "indexRangeFilters": false,
      "indexSearchable": false,
      "moduleConfig": {
        "multi2multivec-weaviate": {
          "skip": false,
          "vectorizePropertyName": true
        }
      },
      "name": "pageNumber"
    },
    {
      "dataType": ["blob"],
      "indexFilterable": false,
      "indexRangeFilters": false,
      "indexSearchable": false,
      "moduleConfig": {
        "multi2multivec-weaviate": {
          "skip": false,
          "vectorizePropertyName": true
        }
      },
      "name": "page"
    }
  ],
  "replicationConfig": {
    "asyncEnabled": false,
    "deletionStrategy": "TimeBasedResolution",
    "factor": 1
  },
  "shardingConfig": {
    "actualCount": 1,
    "actualVirtualCount": 128,
    "desiredCount": 1,
    "desiredVirtualCount": 128,
    "function": "murmur3",
    "key": "_id",
    "strategy": "hash",
    "virtualPerPhysical": 128
  },
  "vectorConfig": {
    "multi2multivec_weaviate": {
      "vectorIndexConfig": {},
      "vectorIndexType": "hnsw",
      "vectorizer": {
        "multi2multivec-weaviate": {
          "baseURL": "https://api.embedding.weaviate.io",
          "imageFields": ["page"],
          "model": "ModernBERT/colmodernbert",
          "vectorizeClassName": false
        }
      }
    }
  }
}
```

</details>

### Create Collection

Utilisez cette opération pour créer une nouvelle collection.

**Paramètres requis**

- **Collection Name** : Le nom de la collection.
- **Vectorizer** : Vectorizer à utiliser pour les objets de données ajoutés à cette collection.
- **Vector index config** : Paramètres spécifiques au type d'index vectoriel, y compris la métrique de distance.
- **Module config** : Paramètres spécifiques au module.
- **Description** : Une description pour votre référence.
- **Properties** : Un tableau des propriétés que vous ajoutez, identique à un Property Object.

**Paramètres optionnels**

- **Consistency** : Garantit que la requête est traitée par le nœud leader afin de préserver l'exactitude des données.
- **Sharding config** : Contrôle le comportement de la collection dans un environnement multi-nœuds.
- **Stop words** : Contrôle les mots qui doivent être ignorés dans l'index inversé.
- **Index time stamps** : Maintient des index inversés pour chaque objet selon ses horodatages internes.
- **Index null state** : Maintient des index inversés pour chaque propriété selon son état null.
- **Index property length** : Maintient des index inversés pour chaque propriété selon sa longueur.
- **Bm 25** : Méthode de classement de recherche qui améliore la précision des résultats à l'aide de valeurs k1 et b ajustables. Par défaut, k1 = 1,2 et b = 0,75.
- **Factor** : Contrôle le comportement de réplication ou de sharding pour la mise à l'échelle.
- **Async enabled** : Exécute les opérations en arrière-plan pour de meilleures performances.
- **Deletion strategy** : Définit la manière dont les données supprimées sont traitées (par exemple, immédiate ou différée).
- **Cleanup interval seconds** : Définit la fréquence à laquelle les données anciennes ou supprimées sont retirées.

Consultez la **[documentation Weaviate](https://weaviate.io/developers/weaviate/config-refs/schema)** pour plus d'informations.

<img style = {{ marginBottom : '15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/weaviate/create-collection-v2.png" alt="Weaviate Create COllection" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "class": "users_data",
  "description": "Stores user profile and interaction statistics for app analytics",
  "invertedIndexConfig": {
    "bm25": {
      "b": 0.75,
      "k1": 1.2
    },
    "cleanupIntervalSeconds": 300,
    "indexNullState": true,
    "indexPropertyLength": true,
    "indexTimestamps": true,
    "stopwords": {
      "additions": ["custom1"],
      "preset": "en",
      "removals": ["the"]
    }
  },
  "moduleConfig": {
    "text2vec-contextionary": {
      "vectorizeClassName": true
    }
  },
  "multiTenancyConfig": {
    "autoTenantActivation": false,
    "autoTenantCreation": false,
    "enabled": false
  },
  "properties": [
    {
      "dataType": ["text"],
      "description": "Main text field",
      "indexFilterable": true,
      "indexRangeFilters": false,
      "indexSearchable": true,
      "name": "content",
      "tokenization": "word"
    }
  ],
  "replicationConfig": {
    "asyncEnabled": true,
    "deletionStrategy": "NoAutomatedResolution",
    "factor": 1
  },
  "shardingConfig": {
    "virtualPerPhysical": 128,
    "desiredCount": 1,
    "actualCount": 1,
    "desiredVirtualCount": 128,
    "actualVirtualCount": 128,
    "key": "_id",
    "strategy": "hash",
    "function": "murmur3"
  },
  "vectorIndexConfig": {
    "skip": false,
    "cleanupIntervalSeconds": 300,
    "maxConnections": 64,
    "efConstruction": 128,
    "ef": -1,
    "dynamicEfMin": 100,
    "dynamicEfMax": 500,
    "dynamicEfFactor": 8,
    "vectorCacheMaxObjects": 1000000000000,
    "flatSearchCutoff": 40000,
    "distance": "cosine",
    "pq": {
      "enabled": false,
      "bitCompression": false,
      "segments": 0,
      "centroids": 256,
      "trainingLimit": 100000,
      "encoder": {
        "type": "kmeans",
        "distribution": "log-normal"
      }
    },
    "bq": {
      "enabled": false
    },
    "sq": {
      "enabled": false,
      "trainingLimit": 100000,
      "rescoreLimit": 20
    },
    "filterStrategy": "sweeping"
  },
  "vectorIndexType": "hnsw",
  "vectorizer": "none"
}
```

</details>

### Delete Collection

Utilisez cette opération pour supprimer une collection.

**Paramètre requis**

- **Collection Name** : Nom de la collection à supprimer.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/weaviate/delete-collection-v2.png" alt="Weaviate delete collection" />

## Data Type - Objects

### List Objects

Utilisez cette opération pour lister tous les objets d'une collection.

**Paramètre requis**

- **Collection Name** : Nom de la collection dont on souhaite lister les objets.

**Paramètres optionnels**

- **Include vectors** : Spécifiez les noms des vecteurs à inclure.
- **After** : Un UUID seuil des objets à récupérer après celui-ci.
- **Offset** : L'index de départ de la fenêtre de résultats.
- **Limit** : Le nombre maximal d'éléments à retourner par page.
- **Include** : Inclure des informations supplémentaires, telles que les infos de classification. Les valeurs autorisées incluent : classification, vector, interpretation.
- **Sort** : Nom(s) de la propriété selon laquelle trier.
- **Order** : Détermine le sens du tri (asc ou desc).
- **Tenant** : Spécifie le tenant dans une requête ciblant une classe multi-tenant.

<img style = {{ marginBottom : '15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/weaviate/list-objs.png" alt="Weaviate list objects" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "deprecations": [],
  "objects": [
    {
      "class": "Project_Collection",
      "creationTimeUnix": 1779704339474,
      "id": "91dbd10e-c88f-4371-859a-d69a292a0d30",
      "lastUpdateTimeUnix": 1779704339474,
      "properties": {
        "pageNumber": 1
      },
      "vectorWeights": null
    },
    {
      "class": "Document_Archive",
      "creationTimeUnix": 1779704339474,
      "id": "9af96d29-4a2b-a04a-bbcf-16cca94797cc",
      "lastUpdateTimeUnix": 1779704339474,
      "properties": {
        "pageNumber": 2
      },
      "vectorWeights": null
    }
  ],
  "totalResults": 2
}
```

</details>

### Create Object

Utilisez cette opération pour créer un nouvel objet dans la collection sélectionnée.

**Paramètres requis**

- **Collection Name** : Nom de la collection dans laquelle créer un objet.
- **Properties** : Un tableau des propriétés que vous ajoutez, identique à un Property Object.
- **Vector** : Saisissez le vecteur de l'objet.

**Paramètre optionnel**

- **Object uuid** : L'UUID de l'objet.

<img style = {{ marginBottom : '15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/weaviate/create-obj.png" alt="Weaviate create object" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
    "class":"Test_Collection",
    "creationTimeUnix":1739009190787,
    "id":"296f9f17-628a-463a-b273-6ae369a3bb59",
    "lastUpdateTimeUnix":1739009190787,
    "properties":{
        "content":"This is a test case.",
        "title":"New Sample Document"
    },
    "vector":[0.12345,0.12345,.......,0.12345,0.12345]
}
```

</details>

### Get Object By Id

Utilisez cette opération pour récupérer un objet à l'aide de son ID.

**Paramètres requis**

- **Collection Name** : Nom de la collection de l'objet.
- **Object ID** : ID de l'objet pour récupérer ses détails.

<img style = {{ marginBottom : '15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/weaviate/get-obj-id.png" alt="Weaviate get object by id" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "class": "Test_Collection",
  "creationTimeUnix": 1738941448311,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "lastUpdateTimeUnix": 1738941448311,
  "vectorWeights": null
}
```

</details>

### Delete Object By Id

Utilisez cette opération pour supprimer l'objet à l'aide de son ID.

**Paramètres requis**

- **Collection Name** : Nom de la collection de l'objet.
- **Object ID** : ID de l'objet à supprimer.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/weaviate/del-obj-id.png" alt="Weaviate delete object by id" />
