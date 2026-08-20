---
id: mongodb
title: MongoDB
---

La source de données MongoDB dans ToolJet vous permet de connecter vos applications directement aux bases de données MongoDB et d'effectuer des opérations sur les collections à l'aide de requêtes. Elle prend en charge des actions de base de données telles que la lecture, l'insertion, la mise à jour et la suppression de documents, vous permettant de travailler efficacement avec des données structurées et semi-structurées. Cette source de données est idéale pour créer des applications nécessitant des schémas flexibles et une itération rapide sur des modèles de données évolutifs.

## Connexion manuelle

Pour établir une connexion manuelle avec la source de données **MongoDB**, cliquez sur le bouton **+ Add new data source** situé sur le panneau de requêtes ou naviguez vers la page [Data Sources](/docs/data-sources/overview) depuis le tableau de bord ToolJet.

:::info
Veuillez vous assurer que le **Host/IP** de la base de données est accessible depuis votre VPC si vous avez auto-hébergé ToolJet. Si vous utilisez ToolJet Cloud, veuillez **liste blanche (whitelist)** notre IP.
:::

### Format de connexion
**Standard (mongodb)**

  Utilisez cette option pour vous connecter à un hôte et un port MongoDB spécifiques.
Elle nécessite la saisie manuelle des détails du serveur et convient aux déploiements MongoDB autonomes ou aux configurations réseau personnalisées.

 **DNS Seed List (mongodb + srv)**

Utilisez cette option pour MongoDB Atlas ou les clusters de jeu de réplicas.
Elle découvre automatiquement les hôtes via DNS, réduit l'effort de configuration et constitue l'approche recommandée pour les déploiements MongoDB évolutifs et gérés.


ToolJet nécessite les éléments suivants pour se connecter à votre MongoDB.

- **Host**
- **Port**
- **Username**
- **Password**

**Remarque :** Il est recommandé de créer un nouvel utilisateur MongoDB afin de pouvoir contrôler les niveaux d'accès de ToolJet.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mongoDB-ds.png" alt="ToolJet - Mongo connection" />

### Secure Sockets Layer (SSL)

- **SSL Certificate** : Certificat SSL à utiliser avec MongoDB. Types pris en charge :
  - **None** : Aucune vérification de certificat SSL.
  - **CA Certificate** : Nécessite un certificat CA pour vérifier le certificat du serveur.
  - **Client Certificate** : Nécessite un certificat client, une clé client et un certificat CA pour s'authentifier auprès du serveur.

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/ssl.png" alt="MongoDB - SSL Certificate" />

## Se connecter à l'aide d'une chaîne de connexion

Vous pouvez également utiliser une **Connection String** en changeant la méthode dans la liste déroulante. Vous serez invité à saisir les détails de votre connexion MongoDB.

ToolJet nécessite les éléments suivants pour se connecter à votre MongoDB à l'aide d'une chaîne de connexion :

- **Connection String**

:::info
La chaîne de connexion ressemble généralement à ceci : `mongodb+srv://${username}:${password}@${cluster}/{database}`.

Par exemple : `mongodb+srv://tooljettest:dummypassword@cluster0.urul7.mongodb.net/hrms`
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mongodb-connectionString.png" alt="ToolJet - Mongo connection"/>

**Remarque :** Assurez-vous de remplacer le nom d'utilisateur, le mot de passe, le cluster et la base de données par vos informations MongoDB réelles. Si votre instance MongoDB nécessite des options de connexion supplémentaires, vous pouvez généralement les ajouter à la chaîne de connexion.

### Tunneling SSH 

ToolJet prend désormais en charge le tunneling SSH pour la source de données MongoDB, permettant des connexions sécurisées aux bases de données hébergées dans des réseaux privés. Cela peut être utilisé pour :

- Accéder à des bases de données privées
- Améliorer la sécurité
- Permettre une communication chiffrée
- Éviter les modifications des règles de pare-feu

#### Configuration SSH

Pour se connecter de manière sécurisée à une base de données MongoDB privée en utilisant le tunneling SSH :

1. Activez le bouton **SSH tunnel** dans la configuration de la source de données MongoDB.
2. Fournissez les détails suivants :
   - **SSH host** – Nom d'hôte ou adresse IP du serveur.
   - **SSH port** – Numéro de port (par défaut : `22`).
   - ***SSH dst host** - Hôte de destination vers lequel le tunnel SSH transfère le trafic (généralement `localhost`)
   - **SSH username** – Nom d'utilisateur pour le serveur SSH.
   - **Authentication method** – Choisissez entre :
     - **Private key**
     - **Password**

Une fois configuré, ToolJet établit une connexion SSH sécurisée. Toutes les requêtes MongoDB sont acheminées via ce tunnel chiffré.

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/ssh-tunnel.png" alt="SSH tunnelling mongodb connection"/>

## Interroger MongoDB

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur et sélectionnez la base de données ajoutée à l'étape précédente comme source de données.
2. Sélectionnez l'opération que vous souhaitez effectuer et cliquez sur **Save** pour enregistrer la requête.
3. Cliquez sur le bouton **Run** pour exécuter la requête.

<img className="screenshot-full img-l" src="/img/datasource-reference/mongo-db/mongoDB-operations.png" alt="ToolJet - Mongo query"/>

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour savoir comment procéder : [link](/docs/app-builder/custom-code/transform-data)
:::

## Opérations prises en charge

- **[List Collections](#list-collections)**
- **[Find One](#find-one)**
- **[Find Many](#find-many)**
- **[Total Count](#total-count)**
- **[Count](#count)**
- **[Distinct](#distinct)**
- **[Insert One](#insert-one)**
- **[Insert Many](#insert-many)**
- **[Update One](#update-one)**
- **[Update Many](#update-many)**
- **[Replace One](#replace-one)**
- **[Find One and Update](#find-one-and-update)**
- **[Find One and Replace](#find-one-and-replace)**
- **[Find One and Delete](#find-one-and-delete)**
- **[Aggregate](#aggregate)**
- **[Delete One](#delete-one)**
- **[Delete Many](#delete-many)**
- **[Bulk Operations](#bulk-operations)**

### List Collections

Renvoie la liste des collections

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-listcollections.png" alt="ToolJet - Mongo DB List Collection"/>

### Find One

Renvoie un document qui satisfait le filtre et les options donnés. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/findOne)

#### Paramètres requis :

- **Collection**

#### Paramètres optionnels :

- **Filter**
- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-findone.png" alt="ToolJet - Mongo DB Find One"/>

### Find Many

Renvoie une liste de documents qui satisfont le filtre et les options donnés. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/find/)

#### Paramètres requis :

- **Collection**

#### Paramètres optionnels :

- **Filter**
- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-findmany.png" alt="ToolJet - Mongo DB Find Many"/>

### Total Count

Renvoie une estimation du nombre de documents dans la collection basée sur les métadonnées de la collection. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#estimateddocumentcount)

#### Paramètres requis :

- **Collection**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-totalcount.png" alt="ToolJet - Mongo DB Total Count"/>

### Count

Renvoie le nombre de documents en fonction du filtre. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#countdocuments)

#### Paramètres requis :

- **Collection**

#### Paramètres optionnels :

- **Filter**
- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-count.png" alt="ToolJet - Mongo DB Count"/>

### Distinct

Récupère une liste de valeurs distinctes pour un champ en fonction du filtre. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/distinct/)

#### Paramètres requis :

- **Collection**
- **Field**

#### Paramètres optionnels :

- **Filter**
- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-distinct.png" alt="ToolJet - Mongo DB Find One"/>

### Insert One

Insère un document. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/insertOne/)

#### Paramètres requis :

- **Collection**
- **Document**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-insertone.png" alt="ToolJet - Mongo DB Insert One"/>

#### Exemple :

```json
{
  "name": "John Doe",
  "age": 30
}
```

### Insert Many

Insère une liste de documents. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/insertMany/)

#### Paramètres requis :

- **Collection**
- **Document**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-insertmany.png" alt="ToolJet - Mongo DB Insert Many"/>

#### Exemple

```json
[
  {
    "name": "Product1",
    "price": 100
  },
  {
    "name": "Product2",
    "price": 150
  }
]
```

### Update One

Met à jour un document en fonction du filtre. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/updateOne/)

#### Paramètres requis :

- **Collection**
- **Filter**
- **Update**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-updateone.png" alt="ToolJet - Mongo DB Update One"/>

#### Exemple

##### Filter

```json
{
  "name": "John Doe"
}
```

##### Update

```json
{
  "$set": {
    "age": 31
  }
}
```

### Update Many

Met à jour plusieurs documents en fonction du filtre. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/updateMany/)

#### Paramètres requis :

- **Collection**
- **Filter**
- **Update**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-updatemany.png" alt="ToolJet - Mongo DB Update Many"/>

#### Exemple

##### Filter

```json
{
  "status": "pending"
}
```

##### Update

```json
{
  "$set": {
    "status": "completed"
  }
}
```

### Replace One

Remplace un document en fonction du filtre. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/replaceOne/)

#### Paramètres requis :

- **Collection**
- **Filter**
- **Replacement**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-replaceone.png" alt="ToolJet - Mongo DB Find One"/>

#### Exemple

##### Filter

```json
{
  "product_id": 123
}
```

##### Replacement

```json
{
  "product_id": 123,
  "name": "New Product",
  "price": 200
}
```

### Find One and Update

Si votre application nécessite le document après la mise à jour, utilisez cette opération à la place de **Update One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneandupdate)

#### Paramètres requis :

- **Collection**
- **Filter**
- **Update**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-findonenupdate.png" alt="ToolJet - Mongo DB Find One and Update"/>

#### Exemple

##### Filter

```json
{
  "employee_id": 456
}
```

##### Update

```json
{
  "$inc": {
    "salary": 5000
  }
}
```

### Find One and Replace

Si votre application nécessite le document après la mise à jour, utilisez cette opération à la place de **Replace One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneandreplace)

#### Paramètres requis :

- **Collection**
- **Filter**
- **Replacement**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-findonenreplace.png" alt="ToolJet - Mongo DB Find One and Replace"/>

#### Exemple

##### Filter

```json
{
  "product_id": 789
}
```

##### Replacement

```json
{
  "product_id": 789,
  "name": "Updated Product",
  "price": 300
}
```

### Find One and Delete

Si votre application nécessite le document après la suppression, utilisez cette opération à la place de **Delete One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneanddelete)

#### Paramètres requis :

- **Collection**
- **Filter**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-findonendelete.png" alt="ToolJet - Mongo DB Find One and Delete"/>

#### Exemple

```json
{
  "order_id": 101
}
```

### Aggregate

Les opérations d'agrégation sont des expressions que vous pouvez utiliser pour produire des résultats réduits et résumés. [Reference](https://docs.mongodb.com/drivers/node/v4.0/fundamentals/aggregation/)

#### Paramètres requis :

- **Collection**
- **Pipeline**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-aggregate.png" alt="ToolJet - Mongo DB Aggregate"/>

#### Exemple

```json
[
  {
    "$match": {
      "status": "completed"
    }
  },
  {
    "$group": {
      "_id": "$product_id",
      "totalSales": {
        "$sum": "$amount"
      }
    }
  }
]
```

### Delete One

Supprime un enregistrement en fonction du filtre. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/deleteOne/)

#### Paramètres requis :

- **Collection**
- **Filter**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-deleteone.png" alt="ToolJet - Mongo DB Find One"/>

#### Exemple

```json
{
  "user_id": 123
}
```

### Delete Many

Supprime plusieurs enregistrements en fonction du filtre. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/deleteMany/)

#### Paramètres requis :

- **Collection**
- **Filter**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-deletemany.png" alt="ToolJet - Mongo DB Find One"/>

#### Exemple

```json
{
  "status": "cancelled"
}
```

### Bulk Operations

Effectue des opérations groupées. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/bulkWrite/)

#### Paramètres requis :

- **Collection**
- **Operations**

#### Paramètres optionnels :

- **Option**

<img className="screenshot-full img-full" src="/img/datasource-reference/mongo-db/mdb-bulkops.png" alt="ToolJet - Mongo DB Bulk Operations"/>

#### Exemple

```json
[
  {
    "insertOne": {
      "document": {
        "item": "apple",
        "quantity": 50
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "item": "orange"
      },
      "update": {
        "$set": {
          "quantity": 100
        }
      }
    }
  },
  {
    "deleteOne": {
      "filter": {
        "item": "banana"
      }
    }
  }
]
```

## Requêtes dynamiques

Les requêtes dynamiques dans MongoDB peuvent être utilisées pour créer des requêtes flexibles et paramétrées.

#### Exemple

```javascript
{ amount: { $lt: '{{ components.textinput1.value }}' }}

// Dates
// supported: Extended JSON syntax
{ createdAt: { $date: '{{ new Date('01/10/2020') }}'} }
// not supported: MongoDB classic syntax
{ createdAt: new Date('01/10/2020') }
```

Référez-vous aux types de données pris en charge par [MongoDB Extended JSON](https://docs.mongodb.com/manual/reference/mongodb-extended-json/).
