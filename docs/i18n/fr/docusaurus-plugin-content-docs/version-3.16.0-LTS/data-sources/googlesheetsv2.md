---
id: googlesheetsv2
title: Google Sheets 2.0
---

ToolJet a la capacité d'établir une connexion avec Google Sheets à la fois pour la lecture et l'écriture de données. En utilisant OAuth 2.0, ToolJet peut établir une connexion sécurisée avec Google Sheets, garantissant que l'accès de l'application au compte d'un utilisateur est restreint et limité de manière appropriée.

## Connexion {#connection}

Pour établir une connexion avec la source de données Google Sheets, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** via le tableau de bord ToolJet.

## Types d'authentification {#authentication-types}

ToolJet prend en charge deux méthodes d'authentification pour connecter Google Sheets à votre application : **OAuth 2.0** et **Service Account**. Chaque méthode fournit un moyen sécurisé d'autoriser l'accès selon vos besoins d'intégration.

### OAuth 2.0 {#oauth-20}

Authentifie via un compte utilisateur Google en utilisant le consentement OAuth, permettant à ToolJet d'accéder à Google Sheets selon les autorisations accordées. Vous pouvez utiliser cette méthode lorsque l'accès aux données doit être lié à des utilisateurs individuels ou nécessite un consentement et une visibilité au niveau de l'utilisateur.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/connection-v2.png" alt="GS2.0 oauth auth type connection" style={{ marginBottom:'15px' }} />

**Configuration en auto-hébergement**

Si vous décidez d'auto-héberger ToolJet, il y a quelques étapes supplémentaires à suivre :

1. Suivez les étapes de configuration fournies dans le [guide Google OAuth](/docs/setup/env-vars#google-oauth) pour configurer les paramètres nécessaires.
2. Attribuez les valeurs correspondantes obtenues à l'étape précédente aux variables d'environnement suivantes :
   - **GOOGLE_CLIENT_ID**
   - **GOOGLE_CLIENT_SECRET**
   - **REDIRECT_URI (TOOLJET_HOST)**
3. Activez l'API Google Sheets dans la console Google Cloud Platform (GCP).

 **Authentification multi-facteurs**

Vous pouvez activer **Authentication required for all users** dans la configuration. Lorsque cette option est activée, les utilisateurs seront redirigés vers l'écran de consentement OAuth la première fois qu'une requête de cette source de données est déclenchée dans l'application. Cela garantit que chaque utilisateur connecte son propre compte Google Sheets de manière sécurisée.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/multi-auth-connection.png" alt="GS2.0 service account auth type connection" />

### Service Account {#service-account}

Authentifie à l'aide d'un compte de service Google Cloud, permettant un accès serveur à serveur à Google Sheets sans interaction de l'utilisateur. Vous pouvez utiliser cette méthode pour des intégrations backend ou au niveau du système, où un accès partagé et fixe est requis sans interaction de l'utilisateur.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/service-connection-v2.png" alt="GS2.0 service account auth type connection" />

## Portées d'autorisation {#authorization-scopes}

Lors de la connexion à une source de données Google Sheets, vous pouvez choisir entre deux portées d'autorisation :

### Read Only {#read-only}
Cela vous permet uniquement d'accéder et de récupérer les données, vous ne pouvez pas modifier/écrire les données de Google Sheets.

### Read and Write {#read-and-write}
Cette portée vous accorde à la fois les autorisations de lecture et d'écriture, vous permettant de récupérer et de modifier les données au sein de Google Sheets.

## Sélection de la feuille de calcul {#selecting-spreadsheet}

La source de données Google Sheets dans ToolJet fournit un **mécanisme de sélection de feuille de calcul** au sein du générateur de requêtes pour identifier la feuille Google sur laquelle l'opération sélectionnée sera effectuée.

Chaque requête de l'API Google Sheets doit être associée à une **Spreadsheet**, qui représente une feuille Google spécifique accessible au compte authentifié.

### Fetch Spreadsheets {#fetch-spreadsheets}

L'option **Fetch Spreadsheets** permet à ToolJet de récupérer dynamiquement toutes les feuilles Google disponibles après une authentification réussie et sécurisée.

### Sélection manuelle de la feuille de calcul {#manual-spreadsheet-selection}

ToolJet prend également en charge la **sélection manuelle de la feuille de calcul** pour les cas d'utilisation avancés à l'aide de l'éditeur d'expressions **fx**, permettant une sélection dynamique ou programmatique d'une feuille de calcul au moment de l'exécution.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/fetch-button-v2.png" alt="fetch spreadsheet button in query builder" />

## Interroger Google Sheets {#querying-google-sheets}

1. Cliquez sur le bouton **+ Add** dans le gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Google Sheets** dans la section des sources de données.
3. Choisissez l'opération souhaitée dans la liste déroulante.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour créer et déclencher la requête.

:::info
L'**ID de la feuille de calcul** peut être obtenu à partir de l'URL de la feuille de calcul. Par exemple, dans l'URL `https://docs.google.com/spreadsheets/d/1W2S4reCqOpPdm_mDEqmLmzj7zNaPk9vqv6_Ve7Nb9WM/edit#gid=0`, `1W2S4re7zNaPk9vqv6_CqOpPdm_mDEqmLNb9WMmzjVe7` représente l'ID de la feuille de calcul.
:::

## Opérations prises en charge {#supported-operations}
En utilisant la source de données Google Sheets, vous pouvez effectuer plusieurs opérations depuis vos applications, telles que :

  1. **[Créer une feuille de calcul](#create-a-spreadsheet)**
  2. **[Lister toutes les feuilles d'une feuille de calcul](#list-all-sheets-of-a-spreadsheet)**
  3. **[Lister toutes les feuilles de calcul](#list-all-spreadsheets)**
  4. **[Supprimer des données d'une feuille de calcul par filtre de données](#delete-data-from-a-spreadsheet-by-data-filter)**
  5. **[Mise à jour groupée à l'aide de la clé primaire](#bulk-update-using-primary-key)**
  6. **[Copier des données entre feuilles de calcul](#copy-data-between-spreadsheets)**
  7. **[Lire les données d'une feuille de calcul](#read-data-from-a-spreadsheet)**
  8. **[Ajouter des données à une feuille de calcul](#append-data-to-a-spreadsheet)**
  9. **[Obtenir les informations de la feuille de calcul](#get-spreadsheet-info)**
  10. **[Mettre à jour les données d'une feuille de calcul](#update-data-to-a-spreadsheet)**
  11. **[Supprimer une ligne d'une feuille de calcul](#delete-row-from-a-spreadsheet)**
  12. **[Supprimer des données d'une feuille de calcul par plage](#delete-data-from-a-spreadsheet-by-range)**
  13. **[Mettre à jour la feuille de calcul](#update-spreadsheet)**

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/listops.png" alt="Google Sheets2.0  Supported Operations" />

### Créer une feuille de calcul {#create-a-spreadsheet}
Cette opération crée une nouvelle feuille de calcul Google Sheets dans le compte authentifié.

#### Paramètre requis {#required-parameter}
- Title : Le nom attribué à la feuille de calcul nouvellement créée.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/create-query.png" alt="create a spreadsheet" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
status:"success"
message:"Spreadsheet created successfully"
spreadsheetId:"1GBQDElkjhgvbsnduytcfgh76rghnsdxctr5tgwei9"
title:"the_data_hub"
spreadsheetUrl:"https://docs.google.com/spreadsheets/e/hfhvhjdjvhbhjedgchbs/tfghdbjxn_tf57gw/7654234"
```
</details>

### Lister toutes les feuilles d'une feuille de calcul {#list-all-sheets-of-a-spreadsheet}
Cette opération récupère toutes les feuilles individuelles (onglets) au sein d'une feuille de calcul spécifiée.

#### Paramètre requis {#required-parameter-1}
- Spreadsheet : L'ID unique de la feuille de calcul dont les feuilles (onglets) doivent être listées.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/listall-spreadsheets-query.png" alt="list operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
{
  "sheets": [
    {
      "properties": {
        "sheetId": 123456,
        "title": "Reference Links",
        "index": 0,
        "sheetType": "GRID",
        "gridProperties": {}
      },
      "protectedRanges": [],
      "bandedRanges": [],
      "tables": []
    },
    {
      "properties": {},
      "merges": []
    }
  ]
}
```
</details>

### Lister toutes les feuilles de calcul {#list-all-spreadsheets}
Cette opération récupère toutes les feuilles de calcul accessibles associées au compte Google authentifié.

#### Paramètre optionnel {#optional-parameter}
- Page Size : Le nombre maximal de feuilles de calcul à renvoyer par requête.
- Page Token : Jeton utilisé pour récupérer l'ensemble suivant de résultats.
- Filter : Filtre la liste des feuilles de calcul selon des critères spécifiés.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/listall-query.png" alt="list operation" />
<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
{
  "status": "success",
  "message": "Spreadsheets listed",
  "files": [
    {
      "owners": [],
      "id": "1083492804",
      "name": "the_data_hub",
      "createdTime": "2026-01-29T11:06:13.493Z"
    },
  ],
  "raw": {}
}
```
</details>

### Supprimer des données d'une feuille de calcul par filtre de données {#delete-data-from-a-spreadsheet-by-data-filter}
Cette opération supprime les lignes qui correspondent aux conditions de filtre spécifiées.

#### Paramètre requis {#required-parameter-2}
- Spreadsheet : L'ID de la feuille de calcul dont les données seront supprimées.
- Sheet : La feuille (onglet) au sein de la feuille de calcul où le filtre sera appliqué.

#### Paramètre optionnel {#optional-parameter-1}
- Filter : Filtre la liste des feuilles de calcul selon des critères spécifiés.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/delete-byfilter-query.png" alt="delete operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
status:"success"
message:"Filtered data deleted successfully"
result : {} 1 key
```
</details>

### Mise à jour groupée à l'aide de la clé primaire {#bulk-update-using-primary-key}
Cette opération met à jour plusieurs lignes en une seule fois en faisant correspondre les enregistrements à l'aide d'une colonne de clé primaire.

#### Paramètre requis {#required-parameter-3}
- Spreadsheet : L'ID de la feuille de calcul à mettre à jour.
- Sheet : La feuille cible où la mise à jour est effectuée.
- Primary Key : La colonne utilisée pour identifier de manière unique les lignes à mettre à jour.
- Data : Les nouvelles valeurs à mettre à jour pour les lignes correspondantes.

#### Exemple {#example}
```yaml
 Data : [{ "ID": 103, "Status": "In Progress", "Remarks": "Under review" }]
 ```
 
<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/bulk-update-query1.png" alt="bulk update operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
{
  "status": "success",
  "message": "Bulk update completed successfully",
  "spreadsheetId": "2vRiGOGPnzSvBJU5g2F3elPxD_KiU8npLSoox-crmPg",
  "sheet": "DigiDB_movelist",
  "primaryKey": "ID",
  "updatedRows": 2,
  "result": [
    {
      "ID": 1,
      "Status": "Done",
      "updateStatus": "Row updated successfully"
    },
    {
      "ID": 2,
      "Status": "In Progress",
      "updateStatus": "Row updated successfully"
    }
  ]
}
```
</details>

### Copier des données entre feuilles de calcul {#copy-data-between-spreadsheets}
Cette opération copie les données sélectionnées d'une feuille de calcul vers une autre.

#### Paramètre requis {#required-parameter-4}
- Source Spreadsheet : L'ID de la feuille de calcul depuis laquelle les données sont copiées.
- Destination Spreadsheet : L'ID de la feuille de calcul vers laquelle les données seront copiées.

#### Paramètre optionnel {#optional-parameter-2}
- Source range : La plage de cellules spécifique à copier depuis la feuille de calcul source.
- Destination range : La plage cible où les données copiées seront placées.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/copy-query.png" alt="copy data operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
{
  "status": "success",
  "message": "Spreadsheet data copied",
  "destinationSheet": "DevRel - Support - Solutions",
  "copiedRows": 8,
  "result": {
    "spreadsheetId": "1iGOCzN5U2F3elPxgGPnzSnpLSovBJD_KxiU8o-crPmg",
    "updates": {
      "updatedRange": "Sheet1!A1:B8",
      "updatedRows": 8,
      "updatedColumns": 2,
      "updatedCells": 16
    }
  }
}
```
</details>

### Lire les données d'une feuille de calcul {#read-data-from-a-spreadsheet}
Cette opération récupère les données d'une feuille ou d'une plage spécifiée au sein d'une feuille de calcul sous forme d'objet JSON.

#### Paramètre requis {#required-parameter-5}
- Spreadsheet : L'ID de la feuille de calcul à partir de laquelle lire les données.
- Sheet : La feuille (onglet) au sein de la feuille de calcul à lire.

#### Paramètre optionnel {#optional-parameter-3}
- Range : La plage de cellules spécifique à partir de laquelle récupérer les données.
- Major Dimensions : Détermine si les données sont lues par ligne ou par colonne.
- Value Render : Spécifie comment les valeurs de cellule doivent être rendues (formatées ou brutes).
- Date Time : Contrôle comment les valeurs de date et d'heure sont renvoyées dans la réponse.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/read-query.png" alt="read data operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>

```
0: {} 2 keys
  Name: "Alice"
  College: "SJEC"

1: {} 2 keys
  Name: "Pari"
  College: "CI"

2: {} 2 keys 
3: {} 2 keys
4: {} 2 keys
5: {} 2 keys
```
</details>

### Ajouter des données à une feuille de calcul {#append-data-to-a-spreadsheet}
Cette opération ajoute des lignes de données supplémentaires à la fin d'une feuille sans modifier les données existantes.

#### Paramètre requis {#required-parameter-6}
- Spreadsheet : L'ID de la feuille de calcul où les données seront ajoutées.
- Sheet : La feuille cible pour l'ajout de nouvelles lignes.
- Rows : Les lignes de données à ajouter à la feuille de calcul.

#### Exemple {#example-1}
```yaml
 Data : 
 [
  {
    "ID": 201,
    "Status": "Pending",
    "Remarks": "Waiting for manager approval"
  },
  {
    "ID": 202,
    "Status": "Rejected",
    "Remarks": "Missing required documents"
  },
  {
    "ID": 203,
    "Status": "Completed",
    "Remarks": "Process finished successfully"
  },
  {
    "ID": 204,
    "Status": "On Hold",
    "Remarks": "Client requested changes"
  }
]

 ```

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/append-query.png" alt="append data operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>

```
spreadsheetId: "1CzNiGBJU2F3elO5gGPnzSnpLSovPxD_iUk8ox-rcmPg"
updatedRange: "Sheet1!A1:C8"
updatedRows : 4
updatedColumns : 3
updatedCells :12
```
</details>

### Obtenir les informations de la feuille de calcul {#get-spreadsheet-info}
Cette opération récupère les métadonnées et les détails structurels d'une feuille de calcul.

#### Paramètre requis {#required-parameter-7}
- Spreadsheet : L'ID de la feuille de calcul pour laquelle les métadonnées et les détails sont récupérés.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/get-query.png" alt="get spreadsheet operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
{
  "spreadsheetId": "1CzNiGO5gGPnzSnpLSovBJU2F3elPxD_KiU",
  "properties": {
    "title": "DevRel - Support - Solutions",
    "locale": "en_GB",
    "autoRecalc": "ON_CHANGE",
    "timeZone": "Etc/GMT",
    "defaultFormat": {},
    "spreadsheetTheme": {}
  },
  "sheets": [],
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/f/1hgbjfjc5fvsgbhn/456axcv7"
}
```
</details>

### Mettre à jour les données d'une feuille de calcul {#update-data-to-a-spreadsheet}
Cette opération modifie les données existantes dans des cellules ou plages spécifiées.

#### Paramètre requis {#required-parameter-8}
- Spreadsheet : L'ID de la feuille de calcul à mettre à jour.
- Range : La plage de cellules où la mise à jour sera appliquée.
- Sheet Name : La feuille (onglet) où la mise à jour a lieu.
- Where : La colonne utilisée pour identifier les lignes à mettre à jour.
- Operator : L'opérateur de condition utilisé pour faire correspondre les lignes.
- Value : La valeur utilisée avec l'opérateur pour filtrer les lignes.

#### Paramètre optionnel {#optional-parameter-4}
- Body : Le contenu des données contenant les valeurs mises à jour.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/update-to-query.png" alt="update operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
status : "success"
spreadsheetId:"2npLSovBJU2FCzNiGO5gGPnzS3elPxD_crmPg-KiU8ox"
```
</details>

### Supprimer une ligne d'une feuille de calcul {#delete-row-from-a-spreadsheet}
Cette opération supprime une ou plusieurs lignes spécifiques d'une feuille.

#### Paramètre requis {#required-parameter-9}
- Spreadsheet : L'ID de la feuille de calcul dont la ligne sera supprimée.
- GID : L'ID de grille unique de la feuille cible.
- Delete Row Number : L'index de ligne à supprimer de la feuille.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/delete-row-query.png" alt="delete operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
spreadsheetId:"2npLSovBJU2FCzNiGO5gGPnzS3elPxD_crmPg-KiU8ox"
replies : [] 1 item
```
</details>

### Supprimer des données d'une feuille de calcul par plage {#delete-data-from-a-spreadsheet-by-range}
Cette opération efface les données d'une plage de cellules définie au sein d'une feuille.

#### Paramètre requis {#required-parameter-10}
- Spreadsheet : L'ID de la feuille de calcul dont les données seront supprimées.
- Range : La plage de cellules spécifiant les données à supprimer.
- Sheet : La feuille (onglet) où se trouve la plage.

#### Paramètre optionnel {#optional-parameter-5}
- Shift Dimension : Spécifie comment les cellules restantes doivent se décaler après la suppression.

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/delete-byrange-query.png" alt="delete operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
status : "success"
message : "Range deleted successfully"
sheet:"Sheet1"
spreadsheetRange:"A1:A05"
shiftDimension:"ROWS"
result : []2keys
spreadsheetId:"2npLSovBJU2FCzNiGO5gGPnzS3elPxD_crmPg-KiU8ox"
```
</details>

### Mettre à jour la feuille de calcul {#update-spreadsheet}
Cette opération met à jour les propriétés de la feuille de calcul, telles que le titre ou les paramètres de configuration.

#### Paramètre requis {#required-parameter-11}
- Spreadsheet : L'ID de la feuille de calcul à mettre à jour.
- Sheet : La feuille cible pour la mise à jour.
- Values : Les valeurs de données à écrire dans la feuille de calcul.

#### Paramètre optionnel {#optional-parameter-6}
- Range : La plage de cellules spécifique à mettre à jour.
- Input Options : Détermine comment les valeurs saisies sont interprétées (brutes ou saisies par l'utilisateur).

#### Exemple {#example-2}
```yaml
 Data : 
 [
  ["Inception", "2010", "Christopher Nolan", "Sci-Fi"],
  ["Interstellar", "2014", "Christopher Nolan", "Sci-Fi"]
 ]
 ```

<img className="screenshot-full img-full" src="/img/datasource-reference/googlesheets2.0/update-query.png" alt="update operation" />

<details id="tj-dropdown">
<summary>**Exemple de résultat**</summary>
```
{
  "spreadsheetId": "1CzNiGO5gGPnzSn2F3elPxD_KiU8pLSovBJUox-crmPg",
  "updatedRange": "DigiDB_movelist!A1:Z500",
  "updatedRows": 2,
  "updatedColumns": 4,
  "updatedCells": 2
}
```
</details>
