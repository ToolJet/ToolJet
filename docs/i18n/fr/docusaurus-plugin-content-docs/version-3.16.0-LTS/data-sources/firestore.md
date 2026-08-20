---
id: firestore
title: Cloud Firestore
---

ToolJet peut se connecter aux bases de données **Cloud Firestore** pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données **Cloud Firestore**, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir Cloud Firestore comme source de données.

ToolJet requiert les éléments suivants pour se connecter à votre BigQuery :

- **Private key**

Pour générer une clé privée, consultez la **[documentation officielle de Firestore](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-console)**.

<img className="screenshot-full img-full" src="/img/datasource-reference/firestore/cf-connection.png"  alt="cloud firestore connection"/>

## Interroger Firestore

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Cloud Firestore** ajoutée à l'étape précédente.
3. Sélectionnez l'opération souhaitée dans la liste déroulante et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

:::tip
Les résultats de la requête peuvent être transformés à l'aide des transformations. Consultez notre documentation sur les transformations pour savoir comment faire : **[lien](/docs/app-builder/custom-code/transform-data)**
:::

## Opérations prises en charge

- **[Get Document](#get-document)**
- **[Query collection](#query-collection)**
- **[Add Document to Collection](#add-document-to-collection)**
- **[Update Document](#update-document)**
- **[Set Document](#set-document)**
- **[Bulk update using document ID](#bulk-update-using-document-id)**
- **[Delete Document](#delete-document)**

### Get Document

Utilisez cette opération pour récupérer les données d'un document.

#### Paramètres requis

- **Path**

<img className="screenshot-full img-full" src="/img/datasource-reference/firestore/cf-get-doc.png" alt="firestore get"/>

### Query Collection

Utilisez cette opération pour interroger tous les documents d'une collection. Consultez la documentation Firestore **[ici](https://firebase.google.com/docs/reference/js/v8/firebase.database.Query)**.

#### Paramètres requis

- **Path**

#### Paramètres optionnels

- **Order**
- **Order type**
- **Limit**
- **Field**
- **Operator**
- **Value**

<img className="screenshot-full img-full" src="/img/datasource-reference/firestore/cf-query-collection.png" alt="firestore collection" style={{marginBottom:'15px'}}/>

### Add Document to Collection

Utilisez cette opération pour créer un nouveau document dans une collection.

#### Paramètres requis

- **Collection**
- **Body**.

#### Exemple

```json
{
  "Author": "Shubh",
  "id": 5
}
```

<img style={{marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/firestore/cf-add-doc.png" alt="firestore add document" />

### Update Document

Utilisez cette opération pour mettre à jour un document existant dans une collection. Elle ne met à jour que les champs existants et ne remplace pas l'objet entier, contrairement à l'**[opération Set](#set-document)**.

#### Paramètres requis

- **Path**
- **Body**

#### Exemple

```json
{
  "Author": "Raj Deepak",
  "id": 3
}
```

<img className="screenshot-full img-full" src="/img/datasource-reference/firestore/cf-update-doc.png" alt="firestore update" />

### Set Document

Cette opération remplace l'objet choisi par la valeur que vous fournissez. Ainsi, si votre objet possède 5 champs et que vous utilisez l'opération Set en fournissant un objet avec 3 champs, celui-ci n'aura plus que 3 champs.

#### Paramètres requis

- **Path**
- **Body**

#### Exemple

```json
{
  "Author": "Meena",
  "id": 9
}
```

<img className="screenshot-full img-full" src="/img/datasource-reference/firestore/cf-set-doc.png" alt="firestore set" />

### Bulk Update Using Document ID

Utilisez cette opération pour mettre à jour des documents en masse.

#### Paramètres requis

- **Collection**
- **Key for document ID**
- **Records**

<img className="screenshot-full img-full" src="/img/datasource-reference/firestore/cf-bulk-update.png" alt="firestore bulk" />

### Delete Document

Utilisez cette opération pour supprimer un document dans une collection.

#### Paramètres requis

- **Path**

<img className="screenshot-full img-full" src="/img/datasource-reference/firestore/cf-del-doc.png" alt="firestore delete"/>

## Transformer le résultat d'une requête Firestore pour le widget Table

Le résultat d'une requête Firestore se présente sous la forme d'un objet, nous devons donc le transformer en tableau (array).

```js
return (data = Array(data));
```
