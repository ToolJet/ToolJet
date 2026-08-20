---
id: gcs
title: Google Cloud Storage
---

ToolJet peut se connecter à des buckets GCS et y effectuer diverses opérations.

## Connexion

Pour établir une connexion avec la source de données Google Cloud Storage, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet requiert les éléments suivants pour se connecter à une source de données GCS :

- **JSON Private Key**

Vous pouvez consulter la [documentation Google Cloud](https://cloud.google.com/docs/authentication/getting-started) pour bien démarrer.

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/gcs-connect-v2.png"  alt="gcs connection" />

## Interroger GCS

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **GCS** ajoutée à l'étape précédente.
3. Sélectionnez l'opération.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour créer et déclencher la requête.

:::tip
Les résultats de la requête peuvent être transformés à l'aide des transformations. Consultez notre documentation sur les transformations pour savoir comment faire : [lien](/docs/app-builder/custom-code/transform-data)
:::

#### Opérations prises en charge

- **[Read file](#read-file)**
- **[Upload file](#uplodad-file)**
- **[List buckets](#list-buckets)**
- **[List files in a bucket](#list-files-in-a-bucket)**
- **[Signed url for download](#signed-url-for-download)**
- **[Signed url for upload](#signed-url-for-upload)**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/listops.png" alt="gcs list of operations" style={{marginBottom:'15px'}} />

### Read File

Lit le contenu d'un fichier depuis GCS.

#### Paramètre requis

- **Bucket**
- **File Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/read-query.png" alt="gcs read query" style={{marginBottom:'15px'}} />

### Uplodad File

Téléverse un fichier vers GCS.

#### Paramètre requis

- **Bucket**
- **File name**
- **Upload data**

#### Paramètre optionnel

- **Content Type**
- **Encoding**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/upload-query.png" alt="gcs upload query" style={{marginBottom:'15px'}} />

#### Exemple :

```yaml
{
    'name' : 'Shruthi Jotsna'
}
```

### List Buckets

Récupère une liste des buckets disponibles.

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/list-bucket-query.png" alt="gcs list query" style={{marginBottom:'15px'}} />

### List Files in a Bucket

Liste les fichiers présents dans un bucket GCS spécifique.

#### Paramètre requis

- **Bucket**

#### Paramètre optionnel

- **Prefix**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/list-files-query.png" alt="gcs list query" style={{marginBottom:'15px'}} />

### Signed URL for Download

Génère une URL signée permettant de télécharger un fichier.

#### Paramètre requis

- **Bucket**
- **File Name**

#### Paramètre optionnel

- **Expires in**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/signed-download-query.png" alt="gcs url download query" style={{marginBottom:'15px'}} />

### Signed URL for Upload

Génère une URL signée permettant de téléverser un fichier.

#### Paramètre requis

- **Bucket**
- **File name**

#### Paramètre optionnel

- **Expires in**
- **Content Type**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/signed-upload-query.png" alt="gcs url upload query" style={{marginBottom:'15px'}} />
