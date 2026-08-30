---
id: loading-image-pdf-from-db
title: Charger et afficher des images à l'aide d'une chaîne Base64
---

Ce guide explique comment charger et afficher des images en utilisant le format de chaîne base64 dans votre application ToolJet. 

## 1. Créer une nouvelle table dans ToolJet Database

- Créez une nouvelle table nommée **test_db**. 

- Le champ `id` sera présent par défaut afin de créer un identifiant unique pour chaque enregistrement dans notre table de base de données.

- Cliquez sur le bouton **Add more columns** et ajoutez cette colonne : `image` et sélectionnez `varchar` comme type de données.

Bien que nous utilisions ToolJet Database pour ce guide, vous pouvez utiliser d'autres bases de données en appliquant les mêmes principes.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/create-table.png" alt="Create New Table in TJDB"  />

## 2. Charger un fichier vers la base de données

- Créez une nouvelle application et nommez-la **Upload Images Example**. 

- Faites glisser un composant **[Filepicker](/docs/widgets/file-picker)** sur le canevas depuis la bibliothèque de composants à droite. 

- Renommez le composant filepicker en **image_picker**.

- Conservez le paramètre par défaut `{{"image/*"}}` ou sélectionnez le type de fichier "Image files" pour la propriété Accept file types du composant **image_picker**, puisqu'il est destiné au téléchargement d'images.

- Cliquez sur le composant **image_picker** et sélectionnez une image à télécharger.

- Après le téléchargement, vous verrez le nom du fichier affiché sur le composant filepicker.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/image-file-upload.png" alt="Uploaded Files using a filepicker"  />

- Cliquez sur le bouton **+ Add** dans le panneau des requêtes pour créer une nouvelle requête, choisissez ToolJet Database comme source de données, sélectionnez `test_db` comme nom de table, et `Create Row` comme opération. Nommez cette requête **upload_files**.

- Dans la section Columns, ajoutez cette colonne `image` et définissez la valeur ci-dessous : 

```js
{{components.image_picker.file[0].base64Data}}
```

Dans la requête ci-dessus, nous utilisons les **variables exposées** du composant filepicker pour obtenir la chaîne base64 du fichier que nous avions téléchargé précédemment.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/upload-query.png" alt="Add Files Query"  />

- Ajoutez un composant **[Button](/docs/widgets/button)** sous le filepicker et renommez-le en **upload**.

- Définissez le texte du bouton sur **Upload** et créez un **New event handler** avec les paramètres suivants : 
Event - `On click`, Action - `Run Query` et Query - `upload_files`.

- Cliquez maintenant sur le bouton **Upload** pour charger les fichiers que nous avions sélectionnés précédemment dans le composant Filepicker.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/image-event-handler.png" alt="Upload Button Properties"  />

Le processus de téléchargement est maintenant terminé. Chaque fois qu'un fichier est sélectionné dans le composant Filepicker et que le bouton de téléchargement est cliqué, la chaîne base64 du fichier sera automatiquement écrite dans la base de données.

## 3. Afficher le fichier image

- Créez une requête nommée **get_files** pour récupérer les chaînes base64 depuis test_db : cliquez sur le bouton **+ Add** dans le panneau des requêtes, sélectionnez ToolJet comme base de données, `test_db` comme nom de table, et `List rows` comme opération.

- Activez **Run this query on application load** dans les paramètres.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/get-query.png" alt="Fetch Files Query"  />

- Faites glisser un composant **[Image](/docs/widgets/image)** sur le canevas depuis la bibliothèque de composants. Renommez le composant **Image** en **display_image**.

- Dans la propriété **URL** du composant **display_image**, saisissez ce qui suit :
```js
{{'data:image;base64,' + queries.get_files.data[0].image}}
```

Le code fourni construit une Data URL pour afficher les données encodées en base64 sous forme d'image.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/display-image.png" alt="Final Preview"  />
