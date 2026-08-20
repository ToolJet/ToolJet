---
id: azureblobstorage
title: Azure Blob
---

ToolJet offre la possibilité d'établir une connexion avec Azure Blob storage afin de lire et de stocker des objets volumineux.

## Connexion

Pour établir une connexion avec la source de données Azure Blob, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir Azure Blob comme source de données.

ToolJet requiert les éléments suivants pour se connecter à votre Azure Blob.

- **Connection String**

<img className="screenshot-full img-full" src="/img/datasource-reference/azureblob/azureblob-connection.png" alt="Azure Blob - ToolJet" />

## Interroger Azure Blob

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Azure Blob** ajoutée à l'étape précédente.
3. Sélectionnez l'**opération** souhaitée dans la liste déroulante et saisissez les **paramètres** requis.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

:::tip
Les résultats de la requête peuvent être transformés à l'aide des Transformations. Pour plus d'informations sur les transformations, consultez notre documentation à ce **[lien](/docs/app-builder/custom-code/transform-data)**.
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/azureblob/azureblob-listqueries.png" alt="Azure Blob - ToolJet" />

## Opérations prises en charge

1. **[Create container](#create-container)**
2. **[List containers](#list-containers)**
3. **[List blobs](#list-blobs)**
4. **[Upload blob](#upload-blob)**
5. **[Read blob](#read-blob)**
6. **[Delete blob](#delete-blob)**

### Create Container

L'opération de création de conteneur permet de créer de nouveaux conteneurs au sein d'Azure Blob storage. Les conteneurs servent d'unités logiques pour organiser et gérer les données blob. Les utilisateurs peuvent fournir un nom unique pour le conteneur. Une fois créé, le conteneur est disponible pour stocker et organiser des données blob. Si un conteneur du même nom existe déjà, l'opération échoue.

#### Paramètres requis

- **Container Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/azureblob/azureblob-create.png" alt="Azure blob: create container operation"/>

### List Containers

L'opération de liste des conteneurs permet de récupérer une liste des conteneurs présents dans Azure Blob storage.

<img className="screenshot-full img-full" src="/img/datasource-reference/azureblob/azureblob-list.png" alt="Azure blob: list container operation"/>

### List Blobs

L'opération de liste des blobs permet de récupérer une liste des blobs présents dans un conteneur spécifique d'Azure Blob storage.

#### Paramètre requis

- **Container**
- **Page Size**

#### Paramètres optionnels

- **Prefix**
- **Continuation Token**

<img className="screenshot-full img-full"  src="/img/datasource-reference/azureblob/azureblob-listblob.png" alt="Azure blob: list blobs operation"/>

### Upload Blob

L'opération de téléversement de blob permet de téléverser un nouveau blob ou de mettre à jour un blob existant dans Azure Blob storage. Elle offre un moyen pratique de stocker des données telles que des fichiers, des images ou des documents dans le conteneur spécifié.

#### Paramètres requis

- **Container**
- **Blob Name**
- **Content Type**
- **Upload Data**
- **Encoding**

<img className="screenshot-full img-full" src="/img/datasource-reference/azureblob/azureblob-upload.png" alt="Azure blob: upload blobs operation"/>

### Read Blob

L'opération de lecture de blob permet de récupérer le contenu d'un blob spécifique stocké dans Azure Blob storage. Elle permet d'accéder aux données stockées dans le blob et de les récupérer pour un traitement ou un affichage ultérieur.

#### Paramètres requis

- **Container**
- **Blob Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/azureblob/azureblob-read.png" alt="Azure blob: read blob operation"/>

### Delete Blob

L'opération de suppression de blob permet de retirer un blob spécifique d'Azure Blob storage. Cette opération supprime définitivement le blob et les données associées, ce qui libère de l'espace de stockage et retire le blob du conteneur.

#### Paramètres requis

- **Container**
- **Blob Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/azureblob/azureblob-delete.png" alt="Azure blob: delete blob operation" />
