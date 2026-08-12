---
id: databricks
title: Databricks
---

Databricks est une plateforme cloud pour le traitement des données, l'analytique et le machine learning. ToolJet se connecte à Databricks, ce qui permet à vos applications d'accéder à vos données dans vos Databricks Warehouses et de les mettre à jour directement à l'aide de requêtes SQL.

## Types d'authentification

ToolJet propose deux méthodes d'authentification pour établir une connexion avec Databricks.

### Personal Access Token 
S'authentifie auprès de Databricks à l'aide d'un jeton d'accès personnel pour accéder de manière sécurisée aux SQL Warehouses et exécuter des requêtes.

#### Configuration

- Accédez à votre espace de travail Databricks, sélectionnez le SQL Warehouse souhaité, puis retrouvez le **Server Hostname** et le **HTTP Path** dans l'onglet des détails de connexion.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/connection-details.png" alt="Databricks: Connection Details" />

- Pour générer un jeton d'accès personnel, accédez à vos paramètres utilisateur Databricks, sélectionnez l'onglet Developer, cliquez sur Manage sous Access Tokens, puis cliquez sur le bouton **Generate New Token**.

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/generate-token.png" alt="Databricks: Access Tokens" />

#### Paramètres requis

- **Host** : le nom d'hôte du serveur ou l'adresse IP de votre Databricks Warehouse. Par exemple :
```
62596234423488486.6.gcp.databricks.com
```

- **HTTP Path** : le chemin du point de terminaison de l'API pour la ressource Databricks à laquelle vous souhaitez accéder. Par exemple : 
```
/sql/1.0/warehouses/44899g7346c19m95
```

- **Personal access token** : les jetons d'accès personnels sont utilisés pour une authentification sécurisée à l'API Databricks à la place des mots de passe. Par exemple :
```
dapi783c7d155d138d8cf14
```

#### Paramètres optionnels

- **Port** : le numéro de port de votre Databricks Warehouse. Le numéro de port par défaut est `443`.

- **Default Catalog** : le catalogue par défaut à utiliser pour la connexion.

- **Default Schema** : le schéma par défaut à utiliser pour la connexion.

<img className="screenshot-full img-l" src="/img/datasource-reference/databricks/connection-v4.png" alt="Databricks: PAT Connection" />

### OAuth U2M (par utilisateur)
S'authentifie auprès de Databricks via OAuth pour le compte de l'utilisateur connecté, permettant des accès et des permissions spécifiques à l'utilisateur pour les requêtes et les opérations.

#### Paramètres requis

- **Host** : le nom d'hôte du serveur ou l'adresse IP de votre Databricks Warehouse.

- **HTTP Path** : le chemin du point de terminaison de l'API pour la ressource Databricks à laquelle vous souhaitez accéder.

#### Paramètres optionnels
 
- **Connection options** : indique des propriétés de connexion Databricks supplémentaires sous forme de paires clé-valeur afin de personnaliser le comportement de la connexion et l'exécution des requêtes.

- **Redirect URI** : l'URL de rappel vers laquelle Databricks redirige les utilisateurs après une authentification OAuth réussie afin de terminer le processus de connexion.

<img style={{marginBottom:'15px'}} className="screenshot-full img-l" src="/img/datasource-reference/databricks/connection-oauth.png" alt="Databricks: OAuth Connection" />

## Interroger Databricks

1. Cliquez sur le bouton **+** Add du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Databricks** ajoutée à l'étape précédente.
3. Sélectionnez **SQL Mode** dans la liste déroulante.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour créer et déclencher la requête.

:::tip
Vous pouvez appliquer des transformations aux résultats de la requête. Consultez notre documentation sur les transformations pour plus d'informations : [lien](/docs/app-builder/custom-code/transform-data)
:::

## Requêtes prises en charge

Databricks prend en charge les commandes SQL standard pour les tâches de manipulation de données.

### Read Data

L'exemple suivant montre comment lire des données d'une table. La requête sélectionne toutes les colonnes de la table _customers_.

```sql
SELECT * FROM customers
```

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/read-data-query.png" alt="Databricks: Read Data Query" style={{marginBottom:'15px'}}/>

### Write Data

L'exemple suivant montre comment écrire des données dans une table. La requête insère une nouvelle ligne dans la table `customers`.

```sql
INSERT INTO customers (
    customer_id,
    first_name,
    last_name,
    email,
    phone,
    city,
    state,
    zip_code,
    country
) VALUES (
    '1001',
    'Tom',
    'Hudson',
    'tom.hudson@example.com',
    '50493552',
    'San Clemente',
    'CA',
    '92673',
    'USA'
);
```

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/insert-data-query.png" alt="Databricks: Write Data Query" style={{marginBottom:'15px'}}/>

### Update Data

L'exemple suivant montre comment mettre à jour des données dans une table. La requête met à jour les colonnes `first_name` et `email` de la table `customers`.

```sql
UPDATE customer
SET first_name = 'John',
    email = 'john.hudson@example.com'
WHERE customer_id = 1001;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/update-data-query.png" alt="Databricks: Update Data Query" style={{marginBottom:'15px'}}/>

### Delete Data

L'exemple suivant montre comment supprimer des données d'une table. La requête supprime une ligne de la table `customers`.

```sql
DELETE FROM customer
WHERE customer_id = 1001;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/delete-data-query.png" alt="Databricks: Delete Data Query" style={{marginBottom:'15px'}}/>


## Interroger en mode GUI

Le mode GUI permet d'interroger le plugin Databricks sans écrire de requêtes.

1. Créez une nouvelle requête et sélectionnez le plugin Databricks.
2. Sélectionnez **GUI mode** dans la liste déroulante.
3. Choisissez l'opération que vous souhaitez effectuer.
4. Récupérez et sélectionnez le **Table name**.
5. Cliquez sur le bouton **Preview** pour afficher le résultat, ou sur le bouton **Run** pour déclencher la requête.

### List Rows
Récupère les lignes de la table sélectionnée avec des options de filtrage, de tri, d'agrégation et de pagination.

#### Paramètre requis
- **Table** : sélectionnez la table depuis laquelle les lignes doivent être récupérées.

#### Paramètres optionnels
- **Filter** : applique des conditions pour ne retourner que les lignes correspondant à des critères spécifiques.
- **Sort** : organise les lignes retournées par ordre croissant ou décroissant selon les colonnes sélectionnées.
- **Aggregate** : applique des fonctions d'agrégation telles que count, sum, average, minimum ou maximum sur les colonnes sélectionnées.
- **Group by** : regroupe les lignes partageant les mêmes valeurs dans les colonnes sélectionnées pour obtenir des résultats synthétisés.
- **Limit** : limite le nombre de lignes retournées dans le résultat.
- **Offset** : ignore un nombre spécifié de lignes avant de commencer à retourner les résultats.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/listrow-gui.png" alt="Databricks List Rows GUI"/>

### Create Row
Insère une nouvelle ligne dans la table sélectionnée en fournissant les valeurs des colonnes requises.

Dans l'éditeur, assurez-vous que le champ **Columns** est fourni au format `string`.

#### Paramètre requis
- **Columns** : indique les colonnes de la table et leurs valeurs correspondantes à insérer lors de la création d'une nouvelle ligne. 

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/createrow-gui.png" alt="Databricks Create Rows GUI"/>

### Update Rows
Modifie les valeurs de lignes existantes dans la table sélectionnée en fonction des conditions ou identifiants spécifiés.

Dans l'éditeur, assurez-vous que le champ **Columns** est fourni au format `string`.

#### Paramètres requis
- **Columns** : indique les noms de colonnes et les valeurs à mettre à jour dans la ou les lignes sélectionnées.

#### Paramètres optionnels
- **Filter** : applique des conditions pour identifier la ou les lignes à mettre à jour.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/updaterow-gui.png" alt="Databricks Update Rows GUI"/>

### Delete Rows
Supprime une ou plusieurs lignes de la table sélectionnée correspondant aux conditions données.

#### Paramètre optionnel
- **Filter** : applique des conditions pour indiquer la ou les lignes à supprimer.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/deleterow-gui.png" alt="Databricks Delete Rows GUI"/>

### Upsert Row
Insère une nouvelle ligne ou met à jour une ligne existante si une clé primaire ou unique correspondante existe déjà.

Dans l'éditeur, assurez-vous que le champ **Columns** est fourni au format `string`.

#### Paramètres requis
- **Primary key column(s)** : indique la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour une mise à jour ou si une nouvelle ligne doit être insérée.
- **Columns** : fournissez les noms de colonnes et les valeurs à insérer ou à mettre à jour.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/upsertrow-gui.png" alt="Databricks Upsert Rows GUI"/>

### Bulk Insert
Insère plusieurs lignes dans la table en une seule opération à l'aide d'un tableau d'enregistrements.

#### Paramètres requis
- **Table** : sélectionnez la table dans laquelle plusieurs lignes doivent être insérées.
- **Records to insert** : fournissez l'ensemble des lignes et des valeurs de colonnes correspondantes à insérer en une seule opération.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 01, first_name: 'Alice', email: 'alice@example.com' },
  { id: 02, first_name: 'Bob', email: 'bob@example.com' },
  { id: 03, first_name: 'Charlie', email: 'charlie@example.com' }
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/databricks/bulk-insert-gui.png" alt="Databricks bulk insert gui mode"/>

### Bulk Update using Primary Key
Met à jour plusieurs lignes existantes en une seule fois en faisant correspondre les enregistrements à l'aide de leurs valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : indique la ou les colonnes de clé primaire utilisées pour identifier les lignes à mettre à jour.
- **Records to update** : fournissez plusieurs enregistrements avec des valeurs de colonnes mises à jour pour les lignes de clé primaire correspondantes. 

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 01, first_name: 'Alice Charles', email: 'alice_charles@example.com' },
  { id: 02, first_name: 'Bob Mark', email: 'bob_mark@example.com' }
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/databricks/bulk-update-gui.png" alt="Databricks bulk update gui mode"/>

### Bulk Upsert using Primary Key
Insère plusieurs nouvelles lignes ou met à jour les lignes existantes en faisant correspondre les lignes à l'aide des valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : indique la ou les colonnes de clé primaire utilisées pour déterminer si chaque enregistrement doit être mis à jour ou inséré.
- **Records to upsert** : fournissez plusieurs enregistrements qui seront insérés comme de nouvelles lignes ou mis à jour si des valeurs de clé primaire correspondantes existent déjà.

Dans cette opération, si une ligne avec une clé primaire correspondante existe, elle est mise à jour ; sinon, une nouvelle ligne est insérée.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 01, first_name: 'Alice Charlie', email: 'alice_charlie@example.com' },
  { id: 04, first_name: 'David', email: 'david@example.com' }, 
  { id: 05, first_name: 'Emma Jackson', email: 'emma_jack@example.com' }    
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/databricks/bulk-upsert-gui.png" alt="Databricks bulk upsert gui mode"/>
