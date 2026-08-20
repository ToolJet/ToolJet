---
id: oracledb
title: Oracle DB
---

ToolJet peut se connecter à des bases de données Oracle pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données Oracle DB, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit naviguer vers la page **[Data sources](/docs/data-sources/overview)** via le tableau de bord ToolJet.

### Connexion de base

ToolJet nécessite les éléments suivants pour se connecter à une source de données Oracle DB :

- **Username**
- **Password**
- **Host**
- **Port**
- **SID / Service Name**
- **Database Name**
- **Client Library Location**
- **Instant Client Version**

:::note
Saisissez soit un **SID**, soit un **Service Name**, selon votre configuration Oracle. Un SID identifie une instance de base de données spécifique, tandis qu'un Service Name identifie un service de base de données et est couramment utilisé dans les déploiements Oracle modernes.
:::

<img style={{marginBottom: '15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/oracleauth-v4.png" alt="Data source-OracleDB-Connection"/>

### Versions du client et compatibilité

ToolJet utilise les connexions Oracle DB en **mode thick (thick mode)** et inclut par défaut les versions suivantes d'Oracle Instant Client :

- **Oracle Instant Client 21.10** – Prend en charge Oracle Database 11.2 et versions ultérieures.
- **Oracle Instant Client 11.2** – Prend en charge Oracle Database 10.2 et versions ultérieures.

:::info
Si votre environnement nécessite une version différente d'Oracle Instant Client, vous pouvez configurer ToolJet pour utiliser une bibliothèque client personnalisée en fournissant son chemin ou en la montant dans le déploiement.
:::

### Mode Thick (chemin de fichier TNS/Wallet)

Les éléments suivants sont requis pour établir une connexion en mode Thick avec Oracle DB.

- **Username**
- **Password**
- **TNS alias**
- **Configuration directory**
- **Oracle wallet path**
- **Wallet password**

<img style={{marginBottom: '15px'}} className="screenshot-full img-l" src="/img/datasource-reference/oracledb/thick-mode-connection.png" alt="Data source-OracleDB-Connection"/>

### Mode Thin (téléversement d'archive TNS/Wallet)

Les éléments suivants sont requis pour établir une connexion en mode Thin avec Oracle DB.

- **Username**
- **Password**
- **TNS alias**
- **Oracle wallet (.zip)**
- **Wallet password**

<img style={{marginBottom: '15px'}} className="screenshot-full img-l" src="/img/datasource-reference/oracledb/thin-mode-connection.png" alt="Data source-OracleDB-Connection" />

### Connexion dynamique
ToolJet permet de remplacer les paramètres de connexion Oracle DB, tels que l'hôte et la base de données, directement au **moment de l'exécution de la requête** lorsque les paramètres de connexion dynamique sont activés sur la page de configuration de la source de données. Cela permet à une seule source de données de prendre en charge plusieurs environnements ou locataires sans nécessiter de configurations distinctes.

<img className="screenshot-full img-full" src="/img/datasource-reference/oracledb/dynamic-connection.png" alt="Oracle DB dynamic connection"/>

## Interroger Oracle DB

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **OracleDB** ajoutée à l'étape précédente.
3. Sélectionnez le mode de requête souhaité.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

## Opérations prises en charge

- **[SQL mode](/docs/data-sources/oracledb#sql-mode)**
- **[GUI mode](/docs/data-sources/oracledb#gui-mode)**

<img className="screenshot-full img-full" src="/img/datasource-reference/oracledb/listops.png" alt="Oracle DB supported operations"/>

### SQL mode

Le mode SQL peut être utilisé pour écrire des requêtes SQL brutes.

<img className="screenshot-full img-full" src="/img/datasource-reference/oracledb/sql-query.png" alt="sql mode querying"/>

```sql
SELECT first_name, last_name, email
FROM employees
WHERE department_id = 15
ORDER BY last_name;
```

### GUI mode

Le mode GUI peut être utilisé pour interroger une base de données Oracle sans écrire de requêtes.

1. Créez une nouvelle requête et sélectionnez la source de données Oracle DB.
2. Sélectionnez GUI mode dans la liste déroulante.
3. Choisissez l'opération que vous souhaitez effectuer.
4. Récupérez et sélectionnez le **Table name**.
5. Cliquez sur le bouton **Preview** pour visualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

### List Rows

Récupère les lignes d'une table avec prise en charge du filtrage, du tri et de la pagination.

#### Paramètre requis

- **Table** : Sélectionnez la table à partir de laquelle les lignes doivent être récupérées.

#### Paramètres optionnels

- **Filter** : Appliquez des conditions pour ne renvoyer que les lignes qui correspondent à des critères spécifiques.
- **Sort** : Organisez les lignes renvoyées par ordre croissant ou décroissant selon les colonnes sélectionnées.
- **Aggregate** : Appliquez des fonctions d'agrégation telles que count, sum, average, minimum ou maximum sur les colonnes sélectionnées.
- **Group by** : Regroupez les lignes ayant les mêmes valeurs dans les colonnes sélectionnées en résultats résumés.
- **Limit** : Limite le nombre de lignes renvoyées dans le résultat.
- **Offset** : Ignore un nombre spécifié de lignes avant de commencer à renvoyer les résultats.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/list-rows-gui.png" alt="list rows GUI"/>

### Create Rows

Insère une nouvelle ligne dans la table sélectionnée en fournissant des valeurs pour les colonnes requises.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètre requis

- **Columns** : Spécifie les colonnes de la table et leurs valeurs correspondantes à insérer lors de la création d'une nouvelle ligne.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/create-row-gui.png" alt="Create rows GUI"/>

### Update Rows

Modifie les valeurs de ligne existantes dans la table sélectionnée en fonction des conditions ou identifiants spécifiés.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètre requis

- **Columns** : Spécifiez les noms de colonnes et les valeurs à mettre à jour dans la ou les lignes sélectionnées.

#### Paramètre optionnel

- **Filter** : Appliquez des conditions pour identifier la ou les lignes à mettre à jour.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/update-row-gui.png" alt="Update Rows GUI"/>

### Delete Rows

Supprime une ou plusieurs lignes de la table sélectionnée correspondant aux conditions données.

#### Paramètres optionnels

- **Filter** : Appliquez des conditions pour spécifier la ou les lignes à supprimer.
- **Limit** : Spécifiez le nombre maximal de lignes à supprimer.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/delete-row-gui.png" alt="Delete Rows GUI"/>

### Upsert Rows

Insère une nouvelle ligne ou met à jour une ligne existante si une clé primaire ou unique correspondante existe déjà.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètres requis

- **Primary key column(s)** : Spécifie la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour la mise à jour ou si une nouvelle ligne doit être insérée.
- **Columns** : Fournissez les noms de colonnes et les valeurs à insérer ou à mettre à jour.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/upsert-row-gui.png" alt="Upsert Rows GUI"/>

### Bulk Insert
Insère plusieurs lignes dans la table en une seule opération à l'aide d'un tableau d'enregistrements.

#### Paramètres requis
- **Table** : Sélectionnez la table dans laquelle plusieurs lignes doivent être insérées.
- **Records to insert** : Fournissez l'ensemble des lignes et des valeurs de colonnes correspondantes à insérer en une seule opération.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 15, firstname: 'John' },
  { id: 16, firstname: 'Doe' },
  { id: 17, firstname: 'Alice' },
  { id: 18, firstname: 'Bob' },
  { id: 19, firstname: 'Charlie' },
  { id: 20, firstname: 'David' },
  { id: 21, firstname: 'Emma' },
  { id: 22, firstname: 'Frank' },
  { id: 23, firstname: 'Grace' },
  { id: 24, firstname: 'Henry' }
] }}
```
</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/bulk-insert-gui.png" alt="Bulk Insert GUI"/>

### Bulk Update using Primary Key
Met à jour plusieurs lignes existantes en une seule fois en faisant correspondre les enregistrements à l'aide de leurs valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : Spécifiez la ou les colonnes de clé primaire utilisées pour identifier les lignes à mettre à jour.
- **Records to update** : Fournissez plusieurs enregistrements avec des valeurs de colonnes mises à jour pour les lignes de clé primaire correspondantes. 

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 15, firstname: 'John Doe' },
  { id: 16, firstname: 'Alice Bob' },
  { id: 17, firstname: 'Emma Frank' },
  { id: 18, firstname: 'Grace Henry' }
] }}
```
</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/bulk-update-pk-gui.png" alt="Bulk Update GUI"/>

### Bulk Upsert using Primary Key
Insère plusieurs nouvelles lignes ou met à jour les lignes existantes en faisant correspondre les lignes à l'aide des valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : Spécifiez la ou les colonnes de clé primaire utilisées pour déterminer si chaque enregistrement doit être mis à jour ou inséré.
- **Records to upsert** : Fournissez plusieurs enregistrements qui seront insérés comme nouvelles lignes ou mis à jour si des valeurs de clé primaire correspondantes existent déjà.

Dans cette opération, si une ligne avec la clé primaire correspondante existe, elle est mise à jour ; sinon, une nouvelle ligne est insérée.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/oracledb/bulk-upsert-pk-gui.png" alt="Bulk Upsert GUI"/>

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour savoir comment procéder : **[link](/docs/app-builder/custom-code/transform-data)**
:::
