---
id: upload-files-aws
title: Upload and Download Files on AWS S3 Bucket
---

Ce guide explique comment configurer les opérations de téléversement et de téléchargement de fichiers en utilisant la source de données Amazon S3 dans ToolJet. Apprenez à utiliser Upload Object, à générer des URL signées et à gérer des buckets S3 directement depuis vos applications.

Avant de construire l'interface utilisateur, consultez la **[documentation de la source de données AWS S3](/docs/data-sources/s3)** pour apprendre à configurer AWS S3 et ajouter la source de données.

## Composants d'interface

Une fois que vous avez ajouté avec succès la source de données AWS, construisez une interface utilisateur de base à l'aide des widgets suivants :
- **Dropdown** : pour sélectionner un bucket dans le stockage S3.
- **Table** : pour lister tous les objets à l'intérieur du bucket sélectionné dans le menu déroulant.
- **Text Input** : pour saisir un chemin d'accès pour le fichier à téléverser.
- **File picker** : pour téléverser le fichier.
- **Button** : utilisé pour déclencher la requête de téléversement.

<img className="screenshot-full img-full" src="/img/how-to/upload-files-aws/app-overview.png" alt="AWS S3" />

## Générateur de requêtes

Nous allons créer les requêtes suivantes à l'aide du générateur de requêtes dans votre application ToolJet.

1. **get_buckets**
2. **list_objects**
3. **upload_to_S3**
4. **download**

### Get Buckets

Cette requête récupère la liste de tous les buckets de votre S3. Créez simplement une nouvelle requête, sélectionnez la source de données AWS S3, et choisissez l'opération **List buckets**. Nommez la requête **get_buckets** et cliquez sur **Save**.

<img className="screenshot-full img-full" src="/img/how-to/upload-files-aws/get-query.png" alt="AWS S3" />

Modifions maintenant le widget **dropdown** depuis les propriétés du composant.

- **Label** : définissez le libellé sur **Bucket**.

- **Schema** : activez **Dynamic Options** et saisissez le code mentionné ci-dessous. Ici, nous associons les données renvoyées par la requête, puisque les données renvoyées sont un tableau d'objets.
```javascript
{{ 
queries.get_buckets.data.Buckets.map((item) => {
  return {
    label: item.Name,
    value: item.Name,
    visible: true,
    default: false
  }
})
}}
```

- **Event Handler** : ajoutez un gestionnaire d'événements, avec l'événement **On Select**, définissez l'action sur **Run Query** et sélectionnez la requête **list_object**.

<img className="screenshot-full img-full" src="/img/how-to/upload-files-aws/dropdown-schema.png" alt="AWS S3" />

### List Objects

Cette requête liste tous les objets à l'intérieur du bucket sélectionné dans le menu déroulant. Sélectionnez l'opération **List objects in a bucket**, saisissez `{{components.dropdown1.value}}` dans le champ Bucket - cela récupérera dynamiquement la valeur du champ à partir de l'option sélectionnée dans le menu déroulant.

<img className="screenshot-full img-full" src="/img/how-to/upload-files-aws/list-query.png" alt="AWS S3" />

Modifions le widget **table** depuis les propriétés du composant.

- **Table data** : `{{queries.list_objects.data['Contents']}}`

- **Add Columns** :

  - **Key** : définissez le nom de la colonne sur `Key` et la clé sur `Key`

  - **Last Modified** : définissez le nom de la colonne sur `Last Modified` et la clé sur `LastModified`

  - **Size** : définissez le nom de la colonne sur `Size` et la clé sur `Size`

  - **ETag** : définissez le nom de la colonne sur `ETag` et la clé sur `ETag`

- Ajoutez un **Action button** : définissez le texte du bouton sur **Copy signed URL**, ajoutez un gestionnaire pour ce bouton sur l'événement **On Click** avec l'action **Copy to clipboard**, et dans le champ texte saisissez `{{queries.download.data.url}}` - cela récupérera l'URL de téléchargement depuis la requête **download** que nous allons créer ensuite.

<img className="screenshot-full img-full" src="/img/how-to/upload-files-aws/action-button.png" alt="AWS S3" />

### Download

Créez une nouvelle requête et sélectionnez l'opération **Signed URL for download**. Dans le champ Bucket, saisissez `{{components.dropdown1.value}}` et dans Key, saisissez `{{components.table1.selectedRow.Key}}`.

<img className="screenshot-full img-full" src="/img/how-to/upload-files-aws/download-query.png" alt="AWS S3" />

Modifiez les **propriétés** de la table, ajoutez un gestionnaire d'événements pour exécuter la requête `download` lors de l'événement `Row clicked`. Cela générera une URL signée pour le téléchargement chaque fois qu'une ligne de la table est cliquée.

### Upload to S3

Créez une nouvelle requête, sélectionnez l'opération **Upload object**. Saisissez les valeurs suivantes dans leurs champs respectifs :
- **Bucket** : `{{components.dropdown1.value}}`

- **Key** :  `{{ components.textinput1.value + '/' +components.filepicker1.file[0].name}}`

- **Content type** : `{{components.filepicker1.file[0].type}}`

- **Upload data** : `{{components.filepicker1.file[0].base64Data}}`

- **Encoding** : `base64`

<img className="screenshot-full img-full" src="/img/how-to/upload-files-aws/upload-query.png" alt="AWS S3" />

#### Configurer le File Picker

Cliquez sur la poignée du widget pour modifier les propriétés du file picker :

- Changez **Accept file types** en `{{"application/pdf"}}` pour que le sélecteur n'accepte que les fichiers PDF, ou en `{{"image/*"}}` pour qu'il n'accepte que les fichiers image. Dans la capture d'écran ci-dessous, nous avons défini la propriété du type de fichier accepté sur `{{"application/pdf"}}` afin de permettre uniquement la sélection de fichiers PDF.

- Également, dans la section des propriétés, désactivez **Allow picking multiple files** pour éviter les conflits.

- Ajoutez un gestionnaire d'événements : allez dans l'onglet **advanced** de la requête **upload_to_S3** et ajoutez un événement **Query Success**, puis ajoutez une action **Run Query** et sélectionnez la requête **list_objects**, afin que la table soit rafraîchie chaque fois qu'un fichier est téléversé.

:::info
 Les types de fichiers doivent être un type **[MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)** valide selon la spécification de l'élément input, ou une extension de fichier valide.

 Pour accepter tous les types de fichiers, laissez `Accept file types` vide.
:::

<img className="screenshot-full img-full" src="/img/how-to/upload-files-aws/filepicker-property
.png" alt="AWS S3" />
