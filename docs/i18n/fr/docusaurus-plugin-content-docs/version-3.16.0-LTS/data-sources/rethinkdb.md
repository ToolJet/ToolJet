---
id: rethinkdb
title: RethinkDB
---

ToolJet peut se connecter à des bases de données RethinkDB pour lire et écrire des données. Pour plus d'informations, consultez cette [documentation Rethink](https://rethinkdb.com/api/javascript).

<div style={{paddingTop:'24px'}}>

## Connexion

Pour établir une connexion avec la source de données RethinkDB, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** via le tableau de bord ToolJet.

ToolJet nécessite les éléments suivants pour se connecter à une source de données RethinkDB :

- **Database**
- **Host**
- **Username**
- **Password**
- **Port**

<img className="screenshot-full img-full" style={{marginBottom:'15px'}} src="/img/datasource-reference/rethink/connection.png" alt="RethinkDB Connection Page" />

## Effectuer des requêtes RethinkDB

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données RethinkDB ajoutée à l'étape précédente.
3. Sélectionnez l'opération souhaitée.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full img-full" style={{marginBottom:'15px'}} src="/img/datasource-reference/rethink/listops.png" alt="RethinkDB Connection Page" />

## Requêtes prises en charge

- **[Create database](#create-database)**
- **[Create table](#create-table)**
- **[Delete database](#delete-database)**
- **[Delete table](#delete-table)**
- **[List all database](#list-all-database)**
- **[List all table](#list-all-table)**
- **[List all documents](#list-all-documents)**
- **[Insert document](#insert-document)**
- **[Retrieve document by key](#retrieve-document-by-key)**
- **[Update document using ID](#update-document-using-id)**
- **[Update all documents](#update-all-documents)**
- **[Delete document using ID](#delete-document-using-id)**
- **[Delete all documents](#delete-all-documents)**

:::info
Remarque : le champ name dans toutes les opérations correspond au nom de la base de données ; s'il n'est pas fourni, la base de données par défaut utilisée pour la connexion sera utilisée.
:::

### Create Database

Crée une nouvelle base de données dans RethinkDB.

#### Paramètre requis
- **Database Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/create-db-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

### Create Table

Crée une nouvelle table dans une base de données spécifiée.

#### Paramètre requis
- **Database Name**
- **Tablename**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/create-table-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

### Delete Database

Supprime une base de données existante dans RethinkDB.

#### Paramètre requis
- **Database Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/del-db-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

### Delete Table

Supprime une table d'une base de données spécifiée.

#### Paramètre requis
- **Database Name**
- **Tablename**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/del-table-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### List All Database

Liste toutes les bases de données disponibles.

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/listall-db.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### List All Table

Liste toutes les tables d'une base de données spécifiée.

#### Paramètre requis
- **Database Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/listall-table.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### List All Documents

Récupère tous les documents d'une table spécifiée.

#### Paramètre requis
- **Database Name**
- **Tablename**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/listall-doc-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Insert Document

Insère un nouveau document dans une table spécifiée.

#### Paramètre requis
- **Database Name**
- **Tablename**
- **Data**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/insert-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

#### Exemple

```yaml
{ 
  "name": "John Doe",
  "age": 30
}
```


### Retrieve Document by Key

Récupère un document d'une table spécifiée à l'aide de sa clé.

#### Paramètre requis
- **Database Name**
- **Tablename**
- **Primary key**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/retrieve-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Update Document Using ID

Met à jour un document spécifique dans une table à l'aide de son ID.

#### Paramètre requis
- **Database Name**
- **Tablename**
- **Primary key**
- **Data**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/update-by-id-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

#### Exemple

```yaml
{ 
  "age": 35 
}
```

### Update All Documents

Met à jour tous les documents d'une table spécifiée.

#### Paramètre requis
- **Database Name**
- **Tablename**
- **Data**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/update-all-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

#### Exemple

```yaml
{ 
  "verified": true 
}
```


### Delete Document Using ID

Supprime un document spécifique dans une table à l'aide de son ID.

#### Paramètre requis
- **Database Name**
- **Tablename**
- **Primary key**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/del-by-id-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Delete All Documents

Supprime tous les documents d'une table spécifiée.

#### Paramètre requis
- **Database Name**
- **Tablename**

<img className="screenshot-full img-full" src="/img/datasource-reference/rethink/del-all-query.png" alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

</div>
