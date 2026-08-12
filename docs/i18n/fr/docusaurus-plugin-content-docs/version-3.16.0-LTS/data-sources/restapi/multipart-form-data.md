---
id: multipart-form-data-rest-api
title: Using MultiPart-Form-Data
---

ToolJet offre une prise en charge intégrée pour le téléchargement de fichiers vers des REST API en utilisant le format de requête `multipart/form-data`. Ce format est requis lors de la transmission de données binaires — telles que des images, des documents ou des fichiers compressés — accompagnées de champs de formulaire dans une seule requête HTTP.

ToolJet gère les **en-têtes de requête** et les conditions de **boundary** en interne, éliminant ainsi le besoin de configuration manuelle. Ce document explique comment configurer des requêtes REST API pour envoyer des fichiers en utilisant `multipart/form-data` et comment les données de fichiers sont traitées lors de l'exécution de la requête.


## Types de fichiers pris en charge

ToolJet prend en charge les types de fichiers suivants lors de l'utilisation de `multipart/form-data` dans les requêtes REST API :
- **Fichiers image**
- **Fichiers PDF**
- **Fichiers ZIP** et également
- **Tous les types de fichiers** lorsque `accept="*"` est configuré dans le widget File Picker (cela inclut les images, PDF, ZIP, etc.).

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/file-picker-UI.png" alt="REST api file type " />

## Types de Content-Type

Les REST API acceptent généralement des corps de requête dans différents formats de `Content-Type`, tels que :

- **`text/xml`**
- **`text/plain`**
- **`text/html`**
- **`application/json`**
- **`application/x-www-form-urlencoded`**
- **`multipart/form-data`**

**Remarque :** Il n'est pas nécessaire de définir manuellement l'en-tête `Content-Type` lors de l'envoi de requêtes multipart. ToolJet ajoute automatiquement les valeurs de boundary correctes requises par le serveur.

## Configurer une requête REST API pour multipart/form-data

Chaque paire clé-valeur dans la section Form Data représente une partie distincte de la requête multipart.

**Remarque :** Lors de l'envoi de fichiers avec `multipart/form-data`, l'en-tête `Content-Type` de la requête doit être défini sur `multipart/form-data`, y compris le paramètre boundary requis. Dans ToolJet, cet en-tête est généré automatiquement lorsque le corps de la requête est configuré en tant que **Form Data**.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/form-headers.png" alt="REST api file type " />

Dans ToolJet, les données de fichiers sont fournies aux requêtes REST API via le widget File Picker. Chaque fichier sélectionné est représenté comme un objet fichier et peut être référencé directement dans le corps Form Data.

| Clé Form Data | Valeur                                |
|---------------|--------------------------------------|
| `test_image`  | `{{components.filepicker1.file[0]}}` |
| `test_pdf`    | `{{components.filepicker2.file[0]}}` |

Dans cet exemple :
- Chaque widget File Picker fournit un fichier
- Le premier fichier est accédé en utilisant `file[0]`
- Chaque fichier est envoyé comme une section multipart individuelle

## Envoyer plusieurs fichiers

Dans votre application ToolJet, lorsque plusieurs fichiers sont inclus dans la requête :

- Chaque fichier est ajouté comme un champ Form Data distinct
- ToolJet crée des sections multipart individuelles pour chaque fichier
- Des **marqueurs de boundary** sont générés automatiquement pour séparer les données de fichiers
- Les utilisateurs peuvent également utiliser l'option pour sélectionner **plusieurs fichiers** à la fois, qui sont ensuite envoyés ensemble dans une seule requête multipart.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/file-picker.png" alt="REST api- send multiple files " />

## Comment multipart/form-data est traité

- ToolJet divise le corps de la requête en plusieurs parties, chaque partie représentant un fichier ou un champ de formulaire, et applique automatiquement des **marqueurs de boundary** pour garantir que le serveur puisse analyser et traiter correctement les données.
- Les requêtes multipart peuvent être validées à l'aide d'outils d'inspection ou de test d'API, où chaque fichier téléchargé apparaît comme une pièce jointe distincte avec son nom de fichier et sa taille, confirmant que la requête a été correctement formatée.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/request-response.png" alt="REST api- processing form data " />
