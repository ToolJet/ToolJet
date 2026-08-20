---
id: minio
title: MinIO
---

ToolJet peut se connecter à MinIo et effectuer diverses opérations sur celui-ci.

## Connexion

Pour établir une connexion avec la source de données MinIo, cliquez sur le bouton **+ Add new data source** situé sur le panneau de requêtes ou naviguez vers la page [Data Sources](/docs/data-sources/overview) depuis le tableau de bord ToolJet.

ToolJet nécessite les éléments suivants pour se connecter à votre DynamoDB :

- **Host**
- **Port**
- **Access key**
- **Secret key**

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/minio-connect.png" alt="miniIo data source connection" />

## Interroger MinIo

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données ajoutée à l'étape précédente comme source de données.
3. Sélectionnez l'opération que vous souhaitez effectuer.
4. Cliquez sur le bouton **Run** pour exécuter la requête

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour savoir comment procéder : [link](/docs/app-builder/custom-code/transform-data)
:::

## Opérations prises en charge

- **[Read object](#read-object)**
- **[Put object](#put-object)**
- **[Remove object](#remove-object)**
- **[List buckets](#list-buckets)**
- **[List objects in a bucket](#list-objects-in-a-bucket)**
- **[Presigned url for download](#pre-signed-url-for-download)**
- **[Presigned url for upload](#pre-signed-url-for-upload)**

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/listops-v3.png" alt="minIo Operations"/>

### Read Object

Récupère un objet d'un bucket.

#### Paramètre requis :

- **Bucket**
- **Object Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/read-query.png" alt="minIo read object"/>

**Structure de la réponse**

L'opération **Read Object** renvoie un objet qui inclut une représentation sous forme de chaîne encodée en UTF-8 de l'objet, ainsi que ses données binaires brutes.

| Field     | Type     | Description |
|----------|----------|-------------|
| `Body`    | `string` | Représentation sous forme de chaîne encodée en UTF-8 des données de l'objet. Convient aux formats textuels tels que JSON, CSV et texte brut. |
| `rawData` | `Buffer` | Données binaires brutes de l'objet. Convient aux contenus non textuels tels que les images, les PDF et autres fichiers binaires. |

### Put Object

Téléverse ou met à jour un objet dans un bucket.

#### Paramètre requis :

- **Bucket**
- **Object Name**
- **Upload data**

#### Paramètre optionnel :

- **Content Type**

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/put-query.png" alt="minIo put object"/>

### List Buckets

Récupère la liste de tous les buckets.

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/list-buck-query.png" alt="minIo list bucket"/>

### List Objects in a Bucket

Liste les objets au sein d'un bucket spécifié.

#### Paramètres requis

- **Bucket**

#### Paramètres optionnels

- **Prefix**

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/list-obj-query.png" alt="minIo list objects in a bucket"/>

### Pre-signed URL for Download

Génère une URL pré-signée pour télécharger un objet.

#### Paramètre requis :

- **Bucket**
- **Object Name**

#### Paramètre optionnel :

- **Expires in**

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/url-download-query.png" alt="minIo presigned url for download"/>

### Pre-signed URL for Upload

Génère une URL pré-signée pour téléverser un objet.

#### Paramètre requis :

- **Bucket**
- **Object Name**

#### Paramètre optionnel :

- **Expires in**

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/url-upload-query.png" alt="minIo presigned url for upload"/>

### Remove Object

Supprime un objet d'un bucket.

#### Paramètre requis :

- **Bucket**
- **Object Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/minio/remove-query.png" alt="minIo remove object"/>
