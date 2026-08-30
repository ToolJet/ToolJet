---
id: couchdb
title: CouchDB
---

ToolJet peut se connecter aux bases de données CouchDB pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données CouchDB, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet requiert les éléments suivants pour se connecter à votre CouchDB.
- **Username**
- **Password**

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/connections.png" alt="CouchDB connection"/>

## Interroger CouchDB

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **CouchDB** ajoutée à l'étape précédente.
3. Sélectionnez l'opération que vous souhaitez effectuer et saisissez la requête.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour créer et déclencher la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/cdb-listops.png" alt="Couch listing"/>

## Requêtes prises en charge 

- **[List Records](#list-records)**
- **[Retrieve Record](#retrieve-record)**
- **[Create Record](#create-record)**
- **[Update Record](#update-record)**
- **[Delete Record](#delete-record)**
- **[Find](#find)**
- **[Get View](#get-view)**

### List Records 

Cette requête liste tous les enregistrements d'une base de données.

#### Paramètres optionnels

- **Include docs**
- **Descending order**
- **Limit**
- **Skip**

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/cdb-list-rec.png" alt="Couch listing"/>

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  ```json
{
    "total_rows": 3,
    "offset": 0,
    "rows": [
        {
            "id": "23212104e60a71edb42ebc509f000dc2",
            "key": "23212104e60a71edb42ebc509f000dc2",
            "value": {
                "rev": "1-0cc7f48876f15883394e5c139c628123"
            }
        },
        {
            "id": "23212104e60a71edb42ebc509f00216e",
            "key": "23212104e60a71edb42ebc509f00216e",
            "value": {
                "rev": "1-b3c45696b10cb08221a335ff7cbd8b7a"
            }
        },
        {
            "id": "23212104e60a71edb42ebc509f00282a",
            "key": "23212104e60a71edb42ebc509f00282a",
            "value": {
                "rev": "1-da5732beb913ecbded309321cac892d2"
            }
        },
    ]
}
```
</details>

### Retrieve Record 

Cette opération récupère un seul enregistrement à partir de son ID.

#### Paramètre requis : 

- **Record ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/cdb-retrieve.png" alt="Couch retrieve view" />

<details id="tj-dropdown">
  <summary> **Exemple de réponse** </summary>
```json
{
    "_id": "e33dc4e209689cb0400d095fc401a1e0",
    "_rev": "1-a62af8e14451af88c150e7e718b7a0e8",
    "0": {
        "name": "test data"
    }
}
```
</details>

### Create Record

Insère un nouvel enregistrement dans la base de données.

#### Paramètre requis : 

- **Records**

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/cdb-create.png" alt="Couch create view" />

#### Exemple

```json
  [{"name":"tooljet"}]
```

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
    ```json
    {
        "ok": true,
        "id": "23212104e60a71edb42ebc509f0049a2",
        "rev": "1-b0a625abc4e21ee554737920156e911f"
    }
    ```
</details>

### Update Record

Vous pouvez obtenir la valeur de l'ID de révision en envoyant une requête GET pour récupérer les détails du document.
Le document vous est renvoyé au format JSON dans la réponse. À chaque mise à jour du document, le champ de révision "_rev" est modifié.

#### Paramètres requis :
- **Record ID**
- **Revision ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/cdb-update.png" alt="Couch update view" />

#### Exemple

```json
[{"name":"tooljet"}]
```

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  ```json
  {
      "ok": true,
      "id": "23212104e60a71edb42ebc509f0049a2",
      "rev": "2-b0a625abc4e21ee554737920156e911f"
  }
 ```
</details>

### Delete Record

Supprime un enregistrement de la base de données à partir de son ID.

#### Paramètres requis :
- **Record ID**
- **Revision ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/cdb-delete.png" alt="Couch delete view"/>

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
    ```json
    {
        "ok": true,
        "id": "rev_id=2-3d01e0e87139c57e9bd083e48ecde13d&record_id=e33dc4e209689cb0400d095fc401a1e0",
        "rev": "1-2b99ef28c03e68ea70bb668ee55ffb7b"
    }
    ```
</details>

### Find 

Recherche des documents à l'aide d'une syntaxe de requête JSON déclarative.

#### Paramètres requis :
- **Mangoquery**

:::info
NOTE :
Syntaxe du sélecteur : https://pouchdb.com/guides/mango-queries.html
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/cdb-find.png" alt="Couch find" />

#### Exemple

```json
{
    "selector": {
        "year":  {"$gte": 2015}
    },
    "fields": ["year"]
}
```

Exemple de réponse de CouchDB :

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/find_response.png" alt="Couch find response" />

### Get View

Les vues sont l'outil principal utilisé pour interroger et générer des rapports sur les documents CouchDB.

#### Paramètres requis
- **View url**

#### Paramètres optionnels : 
- **Start key**
- **End key**
- **Limit**
- **Skip**

<img className="screenshot-full img-full" src="/img/datasource-reference/couchdb/cdb-get-view.png" alt="Couch get view" />

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  ```json
    {
        "total_rows": 4,
        "offset": 0,
        "rows": [
            {
                "id": "23212104e60a71edb42ebc509f000dc2",
                "key": "23212104e60a71edb42ebc509f000dc2",
                "value": {
                    "rev": "1-0cc7f48876f15883394e5c139c628123"
                }
            },
            {
                "id": "23212104e60a71edb42ebc509f00216e",
                "key": "23212104e60a71edb42ebc509f00216e",
                "value": {
                    "rev": "1-b3c45696b10cb08221a335ff7cbd8b7a"
                }
            },
            {
                "id": "23212104e60a71edb42ebc509f00282a",
                "key": "23212104e60a71edb42ebc509f00282a",
                "value": {
                    "rev": "1-da5732beb913ecbded309321cac892d2"
                }
            },
            {
                "id": "23212104e60a71edb42ebc509f002cbd",
                "key": "23212104e60a71edb42ebc509f002cbd",
                "value": {
                    "rev": "1-ca5bb3c0767eb42ea6c33eee3d395b59"
                }
            }
        ]
    }
    ```
</details>
