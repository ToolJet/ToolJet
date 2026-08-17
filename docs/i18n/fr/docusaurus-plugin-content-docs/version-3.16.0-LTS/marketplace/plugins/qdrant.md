---
id: marketplace-plugin-qdrant
title: Qdrant
---

Qdrant est une base de données vectorielle qui peut être intégrée à ToolJet pour permettre une recherche vectorielle efficace à grande échelle. Elle prend en charge les applications d'IA grâce à une technologie avancée de recherche de vecteurs similaires.

À la base, Qdrant fonctionne avec des points, qui sont des enregistrements constitués d'un vecteur et d'un payload optionnel permettant de stocker du contexte ou des métadonnées supplémentaires aux côtés des vecteurs, pour des recherches plus pertinentes.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion {#connection}

Pour vous connecter à Qdrant, vous aurez besoin de l'URL Qdrant et d'une clé API, qui peut être générée depuis le [Qdrant Cloud Dashboard](https://qdrant.to/cloud).

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/connection-v2.png" alt="Qdrant Configuration" />

## Opérations prises en charge {#supported-operations}

1. **[Obtenir les infos d'une collection](#get-collection-info)**
2. **[Lister les collections](#list-collections)**
3. **[Obtenir des points](#get-points)**
4. **[Upsert de points](#upsert-points)**
5. **[Supprimer des points](#delete-points)**
6. **[Interroger des points](#query-points)**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/listops.png" alt="Qdrant supported operations" />


### Obtenir les infos d'une collection {#get-collection-info}

Utilisez cette opération pour récupérer les métadonnées et les détails de configuration d'une collection spécifique dans Qdrant.

**Paramètre requis**

- **Collection Name :** fait référence au jeu de données spécifique stocké dans Qdrant.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/get-collection-query.png" alt="Get Collection Info" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>
```yaml
{
    "status": "green",
    "optimizer_status": "ok",
    "indexed_vectors_count": 0,
    "points_count": 0,
    "segments_count": 2,
    "config": {
      "params": {
        "vectors": {
          "abstract-dense-vector": {
          "size": 512,
          "distance": "Cosine",
            "hnsw_config": {
              "m": 24,
              "ef_construct": 256,
              "payload_m": 24
          },
          "on_disk": false,
          "datatype": "float32"
        }
      },
      "shard_number": 1,
      "replication_factor": 1,
      "write_consistency_factor": 1,
      "on_disk_payload": true,
      "sparse_vectors": {
        "vec1": {
          "index": {
            "on_disk": true
          }
        }
      }
    },
      "hnsw_config": {
      "m": 16,
      "ef_construct": 100,
      "full_scan_threshold": 10000,
      "max_indexing_threads": 0,
      "on_disk": false
    },
      "optimizer_config": {
      "deleted_threshold": 0.2,
      "vacuum_min_vector_number": 1000,
      "default_segment_number": 0,
      "max_segment_size": null,
      "memmap_threshold": null,
      "indexing_threshold": 10000,
      "flush_interval_sec": 5,
      "max_optimization_threads": null,
      "prevent_unoptimized": null
    },
      "wal_config": {
      "wal_capacity_mb": 32,
      "wal_segments_ahead": 0,
      "wal_retain_closed": 1
    },
    "quantization_config": null,
      "strict_mode_config": {
      "enabled": true,
      "unindexed_filtering_retrieve": false,
      "unindexed_filtering_update": false,
      "max_payload_index_count": 100
    }
  }
    "payload_schema": {}
    "update_queue": 
      length: 0
}
```
</details>

### Lister les collections {#list-collections}

Utilisez cette opération pour récupérer toutes les collections disponibles dans l'instance Qdrant connectée.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/list-collection-query.png" alt="List Collection" />

### Obtenir des points {#get-points}

Utilisez cette opération pour récupérer des points de données spécifiques d'une collection à l'aide de leurs identifiants uniques.

**Paramètres requis**

- **Collection Name :** fait référence au jeu de données spécifique stocké dans Qdrant.
- **IDs :** identifiants uniques pour les points de données individuels au sein de la collection. Ils permettent de localiser et de récupérer des entrées spécifiques de la collection.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/get-points-query.png" alt="Get Points" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[{
    "id": 2,
    "payload": 
     {
        "file_name": "662c577775a44fc22d66d4da_Xavier_Dolan_V6_p.jpeg",
        image_url:"https://storage.googleapis.com/demo-midjourney/images/662c577775a44fc22d66d4da_Xavier_Dolan_V6_p.jpeg",
        name:"Xavier Dolan",
        "url": "/styles/xavier-dolan"
    },
    "vector": [-0.05074604, 0.040631093, 0.0011827358, -0.013710048, 0.011997517, -0.024988947, -0.008394034, ...]
}]
```
</details>

### Upsert de points {#upsert-points}

Utilisez cette opération pour ajouter de nouveaux points de données ou mettre à jour ceux qui existent déjà dans une collection, en fonction de leurs identifiants uniques.

**Paramètres requis**

- **Collection Name :** représente le groupe de points de données dans lequel les points nouveaux ou mis à jour seront stockés.
- **Points :** les données réelles ajoutées ou mises à jour. Chaque point contient un identifiant unique et des attributs optionnels.

Voici l'**Sample Input** (exemple d'entrée) pour l'opération Upsert.

```json
[
  {
    "id": 1,
    "payload": {
      "name": "Item 1",
      "description": "Sample description"
    },
    "vector": {
      "dense-vec3": [0.9, 0.1, 0.2]
    }
  },
  {
    "id": 2,
    "payload": {
      "name": "Item 2",
      "description": "Another item"
    },
    "vector": {
      "dense-vec3": [0.1, 0.8, 0.3]
    }
  },
  {
    "id": 3,
    "payload": {
      "name": "Item 3",
      "description": "Third item"
    },
    "vector": {
      "dense-vec3": [0.5, 0.5, 0.5]
    }
  }
]
```
<img style={{ marginTop:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/upsert-points-query.png" alt="Upsert Points" />

### Supprimer des points {#delete-points}

Utilisez cette opération pour supprimer des points de données spécifiques d'une collection à l'aide de leurs identifiants uniques.

**Paramètres requis**

- **Collection Name :** fait référence au jeu de données spécifique stocké dans Qdrant.
- **IDs :** identifiants uniques pour les points de données individuels au sein de la collection. Ils permettent de localiser et de récupérer des entrées spécifiques de la collection.

**Paramètre optionnel**

- **Filter :** utilisé pour définir des conditions lors de la recherche ou de la récupération de points.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/delete-points-query.png" alt="Delete Points" />

### Interroger des points {#query-points}

Utilisez cette opération pour rechercher des points de données dans une collection à l'aide d'une requête, généralement basée sur la similarité vectorielle ou des conditions de filtrage.

**Paramètres requis**

- **Collection Name :** identifie le jeu de données sur lequel la requête sera exécutée.
- **Limit :** spécifie le nombre maximal de résultats à retourner.
- **Query :** un vecteur représentant l'entrée de la requête utilisée pour la recherche par similarité.

**Paramètres optionnels**

- **With Vectors :** indique si les données vectorielles des points récupérés doivent être incluses dans la réponse (true ou false).
- **Include Metadata :** spécifie si les métadonnées associées aux points doivent être retournées (true ou false).
- **Filter :** définit des conditions permettant d'affiner la recherche.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/marketplace/plugins/qdrant/query-points-v2.png" alt="Query Points" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[{
    "id": 3330,
    "version": 159,
    "score": 0.92638075
}, {
    "id": 5037,
    "version": 236,
    "score": 0.9011326
}, {
    "id": 989,
    "version": 49,
    "score": 0.90049756
}]
```
</details>

