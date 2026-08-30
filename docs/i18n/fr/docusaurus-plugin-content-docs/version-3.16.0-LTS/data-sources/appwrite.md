---
id: appwrite
title: Appwrite
---

ToolJet peut se connecter à une base de données Appwrite pour lire/écrire des données.

## Connexion

Pour établir une connexion avec la source de données Appwrite, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet requiert les éléments suivants pour se connecter à votre Appwrite :

- **Host (API endpoint)**
- **Project ID**
- **Database ID**
- **Secret Key**

Vous trouverez la Secret Key et les autres identifiants sur la page des paramètres de votre projet Appwrite. Il est possible que vous deviez créer une nouvelle clé si vous n'en possédez pas déjà une.

:::info
Vous devez également définir la portée (scope) d'accès à une ressource particulière. Pour en savoir plus sur les **clés API et les scopes**, consultez [ce lien](https://appwrite.io/docs/keys).
:::

<img style={{marginBottom:'15px'}} className="screenshot-full img-l" src="/img/datasource-reference/appwrite/appwrite-connection.png" alt="Appwrite intro"/>

## Interroger Appwrite

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Appwrite** ajoutée à l'étape précédente.
3. Sélectionnez l'opération que vous souhaitez effectuer.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/appwrite/appwrite-querying.png" alt="Appwrite intro"/>

:::tip
Les résultats de la requête peuvent être transformés à l'aide des Transformations. Consultez notre **documentation sur les transformations** [ici](/docs/app-builder/custom-code/transform-data).
:::

## Opérations prises en charge

- **[List Documents](#list-documents)**
- **[Get Document](#get-document)**
- **[Add Document to Collection](#add-document-to-collection)**
- **[Update Document](#update-document)**
- **[Delete Document](#delete-document)**

### List Documents

Cette opération permet d'obtenir la liste de tous les documents d'un utilisateur.

#### Paramètres requis

- **Collection ID**

#### Paramètres optionnels

- **Limit**
- **Order fields**
- **Order types**
- **Field**
- **Operator**
- **Value**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/appwrite/appwrite-listdoc.png" alt="Appwrite List" />

### Get Document

Utilisez cette opération pour récupérer un document d'une collection à partir de son ID unique.

#### Paramètres requis

- **Collection ID**
- **Document ID**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/appwrite/appwrite-getdoc.png" alt="Appwrite get" />

### Add Document to Collection

Utilisez cette opération pour créer un nouveau document dans une collection.

#### Paramètres requis

- **Collection ID**
- **Body**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/appwrite/appwrite-adddoc.png" alt="Appwrite add" />

### Update Document

Utilisez cette opération pour mettre à jour un document.

#### Paramètres requis

- **Collection ID**
- **Document ID**
- **Body**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/appwrite/appwrite-updatedoc.png" alt="Appwrite update" />

### Delete Document

Utilisez cette opération pour supprimer un document dans la collection.

#### Paramètres requis

- **Collection ID**
- **Document ID**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/appwrite/appwrite-deldoc.png" alt="Appwrite delete"/>
