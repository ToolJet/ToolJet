---
id: googlesheets
title: Google Sheets
---

ToolJet a la capacité d'établir une connexion avec Google Sheets à la fois pour la lecture et l'écriture de données. En utilisant OAuth 2.0, ToolJet peut établir une connexion sécurisée avec Google Sheets, garantissant que l'accès de l'application au compte d'un utilisateur est restreint et limité de manière appropriée.

## Configuration en auto-hébergement {#self-hosted-configuration}

Si vous décidez d'auto-héberger ToolJet, il y a quelques étapes supplémentaires à suivre :

1. Suivez les étapes de configuration fournies dans le [guide Google OAuth 2.0](/docs/setup/env-vars#google-oauth) pour configurer les paramètres nécessaires.
2. Attribuez les valeurs correspondantes obtenues à l'étape précédente aux variables d'environnement suivantes :
   - **GOOGLE_CLIENT_ID**
   - **GOOGLE_CLIENT_SECRET**
   - **TOOLJET_HOST**
3. Activez l'API Google Sheets dans la console Google Cloud Platform (GCP).

## Connexion {#connection}

Pour établir une connexion avec la source de données Google Sheets, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** via le tableau de bord ToolJet.

### Types d'authentification {#authentication-types}

ToolJet vous permet de sélectionner les méthodes d'authentification avec Google Sheets et d'autoriser l'accès selon vos exigences de sécurité et d'accès.

1. **OAuth 2.0** : Authentifie via un compte utilisateur Google en utilisant le consentement OAuth, permettant à ToolJet d'accéder à Google Sheets selon les autorisations accordées.
2. **Service Account** : Authentifie à l'aide d'un compte de service Google Cloud, permettant un accès serveur à serveur à Google Sheets sans interaction de l'utilisateur.

<img className="screenshot-full img-l" src="/img/datasource-reference/google-sheets/gs-connection.png" alt="Google Sheets Connection " />

### Portées d'autorisation {#authorization-scopes}

Lors de la connexion à une source de données Google Sheets, vous pouvez choisir entre deux portées d'autorisation :

1. **Read Only** : Cette portée vous permet d'accéder et de récupérer les données de la feuille Google.
2. **Read and Write** : Cette portée vous accorde à la fois les autorisations de lecture et d'écriture, vous permettant de récupérer et de modifier les données au sein de la feuille Google.

<img className="screenshot-full img-l" src="/img/datasource-reference/google-sheets/sheetconnect-v3.png" alt="Google Sheet" />

## Interroger Google Sheets {#querying-google-sheet}

1. Cliquez sur le bouton **+ Add** dans le gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Google Sheet** dans la section des sources de données.
3. Choisissez l'opération souhaitée dans la liste déroulante.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour créer et déclencher la requête.

En utilisant la source de données Google Sheets, vous pouvez effectuer plusieurs opérations depuis vos applications, telles que :

  1. **[Créer une feuille de calcul](#create-a-spreadsheet)**
  2. **[Lister toutes les feuilles d'une feuille de calcul](#list-all-sheets-of-a-spreadsheet)**
  3. **[Lire les données d'une feuille de calcul](#read-data-from-a-spreadsheet)**
  4. **[Ajouter des données à une feuille de calcul](#append-data-to-a-spreadsheet)**
  5. **[Obtenir les informations de la feuille de calcul](#get-spreadsheet-info)**
  6. **[Mettre à jour une seule ligne d'une feuille de calcul](#update-single-row-of-a-spreadsheet)**
  7. **[Supprimer une ligne d'une feuille de calcul](#delete-row-from-a-spreadsheet)**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/operations-v4.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

:::info
L'**ID de la feuille de calcul** peut être obtenu à partir de l'URL de la feuille de calcul. Par exemple, dans l'URL `https://docs.google.com/spreadsheets/d/1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM/edit#gid=0`, `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLmzjVe7Nb9WM` représente l'ID de la feuille de calcul.
:::

### Créer une feuille de calcul {#create-a-spreadsheet}

Cette opération permet de créer une nouvelle feuille de calcul.

#### Paramètre requis {#required-parameter}
- **Title**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/create-sheet-v2.png" alt="create a spreadsheet" />

### Lister toutes les feuilles d'une feuille de calcul {#list-all-sheets-of-a-spreadsheet}

Cette opération permet de lister toutes les feuilles d'une feuille de calcul.

#### Paramètre requis {#required-parameter-1}
- **Spreadsheet ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/list-all-sheets-v2.png" alt="create a spreadsheet" style={{marginBottom:'15px'}} />

### Lire les données d'une feuille de calcul {#read-data-from-a-spreadsheet}

Cette opération vous permet de récupérer les données du tableau d'une feuille de calcul sous forme d'objet JSON.

#### Paramètre requis {#required-parameter-2}
- **Spreadsheet ID**

#### Paramètres optionnels {#optional-parameter}
- **Range**
- **Sheet**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/read-data-op-v3.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

### Ajouter des données à une feuille de calcul {#append-data-to-a-spreadsheet}

Ajoutez des lignes supplémentaires à un tableau en utilisant l'opération d'ajout.

#### Paramètres requis {#required-parameter-3}
- **Spreadsheet ID**
- **Rows**

#### Paramètre optionnel {#optional-parameter-1}
- **Sheet**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/append-data-op-v3.png" alt="Google Sheet Operations" style={{marginBottom:'15px'}} />

#### Exemple {#example}
```yaml
[
  {
    "name": "John",
    "email": "john@tooljet.com",
    "date": "2024-09-16",
    "status": "Confirmed",
    "phone": "+123456789"
  },
  {
    "name": "Jane",
    "email": "jane@tooljet.com",
    "date": "2024-09-17",
    "status": "Pending",
    "phone": "+987654321"
  },
  {
    "name": "Doe",
    "email": "doe@tooljet.com",
    "date": "2024-09-18",
    "status": "Cancelled",
    "phone": "+112233445"
  }
]
```

### Obtenir les informations de la feuille de calcul {#get-spreadsheet-info}

Cette opération vous permet de récupérer des informations de base sur la feuille de calcul, y compris le nombre de feuilles, le thème, le fuseau horaire, le format et l'URL, entre autres.

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/info-v3.png" alt="google sheets get info" style={{marginBottom:'15px'}} />

### Mettre à jour une seule ligne d'une feuille de calcul {#update-single-row-of-a-spreadsheet}

Cette opération vous permet de mettre à jour des données existantes dans une feuille.

#### Paramètres requis {#required-parameters}
- **Spreadsheet ID**
- **Where**
- **Operator**
- **Value**
- **Body**

#### Paramètres optionnels {#optional-parameters}
- **Range**
- **Sheet**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/update-query.png" alt="Google Sheet Operations" />

#### Exemple {#example-1}
```yaml
{
  "name": "Hugo Lefevre",
  "position": "Product Manager",
  "url": "https://abctech.com/hugo",
  "date-applied": "2024-09-10",
  "status": "Application Under Review"
}
```

### Supprimer une ligne d'une feuille de calcul {#delete-row-from-a-spreadsheet}

Cette opération vous permet de supprimer une ligne spécifique de la feuille.

#### Paramètre requis {#required-parameter-4}
- **Spreadsheet ID**
- **Delete row number**

#### Paramètre optionnel {#optional-parameter-2}
- **GID**

<img className="screenshot-full img-full" src="/img/datasource-reference/google-sheets/del-v3.png" alt="google sheets delete" style={{marginBottom:'15px'}} />
