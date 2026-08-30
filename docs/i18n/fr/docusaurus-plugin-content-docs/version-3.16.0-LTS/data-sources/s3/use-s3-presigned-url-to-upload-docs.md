---
id: use-s3-signed-url-to-upload-docs
title: Use S3 Signed URL to Upload Documents
---

Dans ce guide, nous allons voir comment téléverser des documents vers des buckets AWS S3 en utilisant une **URL signée S3** depuis une application ToolJet. Il donne également des conseils sur le fonctionnement des URL signées, les considérations de sécurité et des exemples de téléversement côté client.

Pour ce guide, nous allons utiliser l'un des modèles existants sur ToolJet : **S3 File explorer**

## Créer une application à partir d'un modèle

- Sur le tableau de bord ToolJet, cliquez sur les points de suspension à droite du bouton **Create new app**, puis, dans le menu déroulant, choisissez l'option **Choose from template**. Sélectionnez **AWS S3 file explorer** et cliquez sur **Create application from template**.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/template-v2.png" alt="Use S3 pre-signed URL to upload documents: Choose template" />

- Allez dans **Data sources** dans la barre latérale gauche ; vous constaterez que la **source de données AWS S3** a déjà été ajoutée. Il vous suffit de mettre à jour les identifiants de la source de données.

:::tip
Consultez la [référence de la source de données AWS S3](/docs/data-sources/s3) pour en savoir plus sur la connexion et sur le choix de votre méthode d'authentification préférée.
:::

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/how-to/uses3presignedurl/connection-v3.png" alt="S3 add datasource" />

## Récupérer les buckets

- Une fois la source de données connectée avec succès, allez dans le gestionnaire de requêtes et **exécutez** la requête *getBuckets*. L'opération sélectionnée dans la requête *getBuckets* est **List buckets**, qui récupérera un tableau de tous les buckets.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/list-bucket-v3.png" alt="Use S3 pre-signed URL to upload documents: getBuckets query" />

- L'exécution de la requête *getBuckets* chargera tous les buckets dans la table de gauche de l'application.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/dropdown-v3.png" alt="Use S3 pre-signed URL to upload documents: loading buckets" />

## Récupérer les objets à l'intérieur du bucket

- Pour récupérer les données à l'intérieur d'un bucket, sélectionnez le bucket dans la table des buckets, allez dans le gestionnaire de requêtes et choisissez la requête *getObjects*. Choisissez la source de données appropriée dans la section **Data Source**, et pour le paramètre **Operation**, choisissez l'option `List objects in a bucket` dans le menu déroulant. Remplacez le paramètre **Bucket** par `{{components.table2.selectedRow.Name}}` et cliquez sur **Run** pour lister tous les fichiers du bucket sélectionné dans la table.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/get-signed-url-v3.png" alt="Use S3 pre-signed URL to upload documents: list objects in a bucket" />

## Obtenir l'URL signée pour le téléchargement

Le propriétaire de l'objet peut, s'il le souhaite, partager des objets avec d'autres personnes en créant une URL présignée, à l'aide de ses propres identifiants de sécurité, afin d'accorder une autorisation de téléchargement limitée dans le temps. Pour créer une URL présignée, dans le panneau de requête, remplacez les paramètres par les suivants :

- **Data Source** : utilisez la source de données appropriée.
- **Operation** : choisissez `Signed url for download` dans le menu déroulant.
- **Bucket** : `{{components.table2.selectedRow.Name}}` pour sélectionner dynamiquement les buckets.
- **Key** : `{{components.table3.selectedRow.Key}}`, cela récupérera le nom du fichier depuis les variables exposées du file picker.
- **Expires in** : cela définit un délai d'expiration pour l'URL, qui est par défaut de `3600` secondes (1 heure).

Après avoir configuré les paramètres, cliquez sur **Run** pour exécuter la requête, et l'URL est accessible comme indiqué sur la capture d'écran.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/fetch-files-v3.png" alt="S3 get signed URL" />

## Téléverser des objets dans le bucket

L'opération `Upload Object` permet aux utilisateurs de sélectionner un bucket puis de téléverser les données de leur choix dans ce bucket. Pour téléverser des objets dans un bucket, suivez les étapes ci-dessous :

- Dans le panneau de requête, accédez à la requête *uploadObject*.
- Choisissez la source de données appropriée dans la section **Data Source**.
- Dans la section **Operation**, choisissez `Upload Object` dans le menu déroulant.
- Dans la section **Bucket**, copiez le code : `{{components.table2.selectedRow.Name}}`, pour choisir un bucket de façon dynamique.
- Dans la section **Key**, copiez le code : `{{components.textinput2.value}}`.
- Dans la section **Content Type**, copiez : `{{components.filepicker1.file[0].type}}`.
- Dans la section **Upload data**, copiez : `{{components.filepicker1.file[0].dataURL}}`.

Pour s'assurer que l'image a bien été téléversée, nous pouvons créer un nouvel événement depuis la section **Events**.
- Dans la section `Events`, cliquez sur **New event handler**.
- Dans le menu déroulant `Event`, choisissez `Query Success`.
- Dans le menu déroulant `Action`, choisissez `Show Alert`.
- Le `Message` peut être celui de votre choix ; dans cet exemple, écrivons le message suivant : `Image uploaded successfully`.

Une fois la requête créée, choisissez le bucket souhaité, cliquez sur le bouton **Upload file** dans l'application, et téléversez le fichier souhaité vers votre bucket.

## Téléverser des objets via des URL S3 présignées personnalisées

Cette méthode téléverse des fichiers **directement depuis le client** vers S3 en utilisant une **URL signée temporaire**.

**Quand utiliser cette méthode :**
- Vous souhaitez de meilleures performances pour les fichiers volumineux
- Vous avez besoin d'un accès de téléversement temporaire
- Vous ne voulez pas que les fichiers passent par les serveurs de ToolJet
- Vous souhaitez exposer la capacité de téléversement à des clients externes

```javascript
const file = components.filepicker1.file[0];

await fetch(presignedUrlQuery.data.url, {
  method: "PUT",
  headers: {
    "Content-Type": file.type,
  },
  body: file.blob,
});

return "Upload successful";
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/presigned-url-s3.png" alt="S3 get signed URL" />

## Accéder à l'URL signée

Après avoir téléversé le fichier dans votre bucket, dans la table des fichiers, cliquez sur le bouton **Copy signed URL** de la section **Actions** de la table, ce qui copiera l'URL dans le presse-papiers. Vous pouvez alors ouvrir un autre onglet et coller l'URL pour ouvrir le fichier dans le navigateur.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/signed-url-v3.png" alt="S3 access signed URL" />
