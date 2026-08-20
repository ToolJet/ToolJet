---
id: loading-image-pdf-from-db
title: Upload And View PDFs Using Base64 String
---

Ce guide montre comment téléverser et afficher des PDF en utilisant le format de chaîne base64 dans votre application ToolJet.

## 1. Créer une nouvelle table dans ToolJet Database

- Créez une nouvelle table nommée **test_db**.

- Le champ `id` sera présent par défaut pour créer un identifiant unique pour chaque enregistrement de notre table de base de données.

- Cliquez sur le bouton **Add more columns** et ajoutez cette colonne : `pdf` et sélectionnez `varchar` comme type de données.

Bien que nous utilisions la ToolJet Database pour ce guide, n'hésitez pas à utiliser d'autres bases de données en appliquant les mêmes principes.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/create-table-pdf.png" alt="Create New Table in TJDB"  />

## 2. Téléverser un fichier vers la base de données

- Créez une nouvelle application et nommez-la **Upload PDFs Example**.

- Faites glisser un composant **[Filepicker](/docs/widgets/file-picker)** sur le canevas depuis la bibliothèque de composants à droite.

- Renommez le composant filepicker en **pdf_picker**.

- Conservez le paramètre par défaut `{{"application/pdf"}}` pour la propriété Accept file types dans le composant **pdf_picker**, car elle est destinée aux téléversements de PDF.

- Cliquez sur le composant **pdf_picker** et sélectionnez un fichier PDF à téléverser.

- Après le téléversement, le nom du fichier s'affichera sur le composant filepicker.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/pdf-file-upload.png" alt="Uploaded Files using a filepicker"  />

- Cliquez sur le bouton **+ Add** dans le panneau de requêtes pour créer une nouvelle requête, choisissez ToolJet Database comme source de données, sélectionnez `test_db` comme nom de table, et `Create Row` comme opération. Nommez cette requête **upload_files**.

- Dans la section Columns, ajoutez cette colonne `pdf` et définissez la valeur ci-dessous :

```js
{{components.pdf_picker.file[0].base64Data}}
```

Dans la requête ci-dessus, nous utilisons les **variables exposées** du composant filepicker pour récupérer la chaîne base64 du fichier que nous avions téléversé précédemment.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/upload-pdf-query.png" alt="Add Files Query"  />

- Ajoutez un composant **[Button](/docs/widgets/button)** sous le filepicker et renommez-le en **upload**.

- Définissez le texte du bouton sur **Upload** et créez un **New event handler** avec les paramètres suivants :
Event - `On click`, Action - `Run Query` et Query - `upload_files`.

- Cliquez maintenant sur le bouton **Upload** pour téléverser les fichiers que nous avions sélectionnés précédemment dans le composant Filepicker.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/pdf-event-handler.png" alt="Upload Button Properties"  />

Le processus de téléversement est maintenant terminé. Chaque fois qu'un fichier est sélectionné dans le composant Filepicker et que le bouton d'upload est cliqué, la chaîne base64 du fichier sera automatiquement écrite dans la base de données.

## 3. Afficher un fichier PDF

- Créez une requête nommée **get_files** pour récupérer les chaînes base64 depuis test_db : cliquez sur le bouton **+ Add** dans le panneau de requêtes, sélectionnez ToolJet comme Database, `test_db` comme nom de table, et `List rows` comme opération.

- Activez **Run this query on application load** depuis Settings.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/get-query.png" alt="Fetch Files Query"  />

- Faites glisser un composant **[PDF](/docs/widgets/pdf)** sur le canevas depuis la bibliothèque de composants. Renommez le composant **PDF** en **display_pdf**.

- Dans la propriété **URL** du composant **display_pdf**, saisissez ce qui suit :
```js
{{'data:pdf;base64,' + queries.get_files.data[0].pdf}}
```

Le code fourni construit une URL de données pour afficher les données encodées en base64 sous forme de PDF.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/display-pdf.png" alt="Final Preview"  />
