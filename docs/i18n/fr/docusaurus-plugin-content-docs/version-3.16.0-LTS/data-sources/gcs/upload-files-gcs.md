---
id: upload-files-gcs
title: Upload Files Using GCS
---

Ce guide explique comment configurer les opérations de téléversement et de téléchargement de fichiers à l'aide de la source de données Google Cloud Storage (GCS) dans ToolJet. Apprenez à utiliser le téléversement et à gérer les entrées de fichiers directement depuis vos applications.

Avant d'ajouter la nouvelle source de données, nous devons disposer d'une clé privée pour notre bucket GCS et nous assurer que la clé possède les droits appropriés.

## Configuration de la source de données Google Cloud Storage

1. Accédez au gestionnaire de sources de données dans la barre latérale gauche et cliquez sur le bouton `+`.

2. Ajoutez une nouvelle source de données GCS depuis la section **APIs** dans la fenêtre modale qui s'affiche.

3. Saisissez la **clé privée JSON pour le compte de service** et testez la connexion.

4. Cliquez sur **Save** pour ajouter la source de données.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/upload-files-gcs/adding-account.png" alt="gcs data source connection" />

## Ajout d'un sélecteur de fichiers

1. Glissez-déposez le widget **file picker** sur le canevas.

2. Configurez le sélecteur de fichiers : modifiez **Accept file types** en `{{"application/pdf"}}` pour que le sélecteur n'accepte que les fichiers pdf. Dans la capture d'écran ci-dessous, nous avons défini la propriété de type de fichier accepté sur `{{"application/pdf"}}` afin qu'il ne soit possible de sélectionner que des fichiers pdf.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/upload-files-gcs/filepicker-ui.png" alt="gcs UI component" />

3. Dans la section des propriétés, désactivez **Allow picking multiple files** pour éviter les conflits.

4. Sélectionnez un fichier pdf et maintenez-le dans le sélecteur de fichiers.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/upload-files-gcs/file-picks.png" alt="gcs file picker ui" />

:::info
 Les types de fichiers doivent être un type **[MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)** valide selon la spécification de l'élément input, ou une extension de fichier valide.

 Pour accepter n'importe quel type de fichier, laissez `Accept file types` vide.
:::

## Création d'une requête

1. Cliquez sur le bouton `+` du gestionnaire de requêtes dans le panneau inférieur de l'éditeur et sélectionnez la source de données GCS.

2. Créez une requête nommée `upload_objects`.

3. Sélectionnez l'opération **Upload file** et saisissez les paramètres requis :

- Bucket : `gs://test-1`
- File Name : `{{components.file1.file[0]['name']}}`
- Content Type : `{{components.file1.file[0]['type']}}`
- Upload data : `{{components.file1.file[0]['base64Data']}}`
- Encoding : `base64`

4. Cliquez sur **Save** pour créer la requête.

## Exécution de la requête

1. Ajoutez un **bouton** qui déclenchera la requête pour téléverser le fichier.

2. Modifiez les propriétés du bouton et ajoutez un **gestionnaire d'événement** pour l'action **Run the query** sur l'événement **On-Click**.

3. Cliquez sur le **bouton** pour exécuter la requête de téléversement, ce qui téléversera le fichier pdf que vous avez sélectionné précédemment via le sélecteur de fichiers et l'enverra sur GCS.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/upload-files-gcs/gcs-query.png" alt="gcs upload query" />
