---
id: mssql
title: MS SQL Server / Azure SQL Databases
---

ToolJet peut se connecter aux bases de données MS SQL Server et Azure SQL pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données MS SQL Server, cliquez sur le bouton **+ Add new Data source** situé sur le panneau de requêtes ou naviguez vers la page [Data Sources](/docs/data-sources/overview) depuis le tableau de bord ToolJet.

:::info
Veuillez vous assurer que le **Host/IP** de la base de données est accessible depuis votre VPC si vous avez auto-hébergé ToolJet. Si vous utilisez ToolJet Cloud, veuillez **liste blanche (whitelist)** notre IP.
:::

ToolJet nécessite les éléments suivants pour se connecter à votre base de données PostgreSQL.

- **Host**
- **Port**
- **Username**
- **Password**
- **Connection Options**
- **Azure** (Sélectionnez cette option si vous utilisez des bases de données Azure SQL)

**Remarque :** Il est recommandé de créer un nouvel utilisateur de base de données afin de pouvoir contrôler les niveaux d'accès de ToolJet.

<img  className="screenshot-full img-full" src="/img/datasource-reference/mssql/connect-v2.png" alt="MSsql data soruce connection"/>

### Connection Options

Vous pouvez ajouter des configurations optionnelles sous forme de **paires clé-valeur** pour la connexion à la source de données MS SQL.

#### Exemple :

| Key                    | Value |
| :--------------------- | :---- |
| trustServerCertificate | true  |

Ces options vous permettent d'affiner la connexion, par exemple en activant le chiffrement lors de l'utilisation d'un certificat auto-signé.

### Authentication Type

ToolJet prend en charge plusieurs méthodes d'authentification pour la source de données MSSQL via la liste déroulante **Authentication type**. Sélectionnez la méthode d'authentification appropriée en fonction de votre configuration SQL Server ou Azure SQL.

#### SQL Server  

Sélectionnez **SQL Server** si vous souhaitez vous connecter en utilisant le flux d'authentification SQL existant.

Fournissez les identifiants suivants :

- **Host**
- **Port**
- **Database name**
- **Username**
- **Password**

Il s'agit de la méthode d'authentification par défaut et elle ne nécessite aucune configuration supplémentaire.

#### Azure AD – Service Principal  

Sélectionnez **Azure AD – Service Principal** pour vous authentifier à l'aide d'une application Azure enregistrée dans Microsoft Entra ID. Cette option est recommandée pour se connecter à **Azure SQL Database** en utilisant une authentification basée sur l'application plutôt que des identifiants de connexion SQL.

Le chiffrement d'Azure AD prend le pas sur la configuration SSL manuelle lorsque ce type d'authentification est utilisé.

Fournissez les détails suivants :

- **Tenant ID** – L'ID du locataire (répertoire) Microsoft Entra
- **Client ID** – L'ID de l'application (client) issu de l'enregistrement de l'application Azure
- **Client Secret** – La valeur du secret client généré pour l'application

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/auth-type-azure.png" alt="MSsql Auth type connection"/>

### Activer le chiffrement avec un certificat auto-signé

Pour renforcer la sécurité lors du transfert de données, le chiffrement peut être activé même avec un certificat auto-signé.

#### Configuration côté serveur

1. **Créer et installer un certificat auto-signé :**
   - Générez un certificat auto-signé et installez-le sur l'instance SQL Server.
2. **Forcer le chiffrement :**
   - Configurez l'instance SQL Server pour forcer les connexions chiffrées.
   - Pour les bases de données Azure SQL, activez le bouton **Encryption** dans le portail Azure.

#### Configuration côté client

1. Définissez l'option de connexion `trustServerCertificate` sur `true`.
   - Cela contourne la validation de la chaîne de certificats et est nécessaire lors de l'utilisation d'un certificat auto-signé.

### Tunneling SSH 

ToolJet prend désormais en charge le tunneling SSH pour la source de données MSSQL, permettant des connexions sécurisées aux bases de données hébergées dans des réseaux privés. Cela peut être utilisé pour :
- Accéder à des bases de données privées
- Améliorer la sécurité
- Permettre une communication chiffrée
- Éviter les modifications des règles de pare-feu

#### Configuration SSH

Pour se connecter de manière sécurisée à une base de données MSSQL privée en utilisant le tunneling SSH :

1. Activez le bouton **SSH tunnel** dans la configuration de la source de données MSSQL.
2. Fournissez les détails suivants :
   - **SSH host** – Nom d'hôte ou adresse IP du serveur.
   - **SSH port** – Numéro de port (par défaut : `22`).
   - **SSH username** – Nom d'utilisateur pour le serveur SSH.
   - **Authentication method** – Choisissez entre :
     - **Private key**
     - **Password**

Une fois configuré, ToolJet établit une connexion SSH sécurisée. Toutes les requêtes MSSQL sont acheminées via ce tunnel chiffré.

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/ssh-tunnel.png" alt="MSsql SSH tunnelling connection" />

## Interroger en mode SQL

Le mode SQL peut être utilisé pour interroger MS SQL Server / Azure SQL Databases à l'aide de requêtes SQL.

1. Créez une nouvelle requête et sélectionnez la source de données MS SQL.
2. Sélectionnez **SQL mode** dans la liste déroulante.
3. Saisissez la requête SQL dans l'éditeur.
4. Cliquez sur le bouton **Run** pour exécuter la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/query.png" alt="ToolJet mssql sql mode" />

#### Exemple

```sql
SELECT * FROM users
```

### Requêtes paramétrées

ToolJet prend en charge les requêtes SQL paramétrées, ce qui renforce la sécurité en empêchant les injections SQL et permet une construction dynamique des requêtes. Pour mettre en œuvre des requêtes paramétrées :

1. Utilisez `:parameter_name` comme espace réservé dans votre requête SQL à l'endroit où vous souhaitez insérer des paramètres.
2. Dans la section **Parameters** sous l'éditeur de requêtes, ajoutez des paires clé-valeur pour chaque paramètre.
3. Les clés doivent correspondre aux noms des paramètres utilisés dans la requête (sans les deux-points).
4. Les valeurs peuvent être des valeurs statiques ou des valeurs dynamiques utilisant la notation `{{ }}`.

<div style={{textAlign: 'center'}}>
<img  className="screenshot-full img-full" src="/img/datasource-reference/mssql/param-query.png" alt="parameterized SQL queries"/>
</div>

##### Exemple :

```yaml
Query: SELECT * FROM users WHERE username = :username
```

Paramètres SQL :

- Key : username
- Value : oliver // ou `{{ components.username.value }}`

### Sécurité au niveau des lignes

Dans ToolJet, vous pouvez mettre en place une sécurité côté serveur au niveau des lignes pour restreindre l'accès à des lignes spécifiques en fonction de groupes personnalisés ou de rôles utilisateur par défaut. Consultez le guide [Setup Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security) pour plus d'informations.

### Délai d'expiration des requêtes

Vous pouvez définir la durée du délai d'expiration pour les requêtes SQL en ajoutant la variable `PLUGINS_SQL_DB_STATEMENT_TIMEOUT` au fichier de configuration d'environnement. Par défaut, elle est réglée sur 120 000 ms.

### Fonctions dynamiques et variables système de MS SQL Server

SQL Server fournit des fonctions dynamiques qui renvoient des informations sur la connexion, la base de données, l'utilisateur et le serveur actuels. Elles peuvent vous aider à écrire des requêtes qui s'adaptent automatiquement à différents environnements sans coder de valeurs en dur.

| Function / Variable | Description                                        | Example Output                       |
| ------------------- | -------------------------------------------------- | ------------------------------------ |
| `DB_NAME()`         | Renvoie le nom de la base de données actuelle           | `tooljet_db`                         |
| `SUSER_SNAME()`     | Renvoie le nom de connexion de l'utilisateur actuel         | `app_user`                           |
| `USER_NAME()`       | Renvoie le nom d'utilisateur de base de données de l'utilisateur actuel | `dbo`                                |
| `SYSTEM_USER`       | Renvoie la connexion système actuelle (nom de connexion)      | `app_user`                           |
| `@@SERVERNAME`      | Renvoie le nom de l'instance SQL Server        | `MSSQLSERVER01`                      |
| `@@VERSION`         | Renvoie la version de SQL Server et les informations de build      | `Microsoft SQL Server 2019 (RTM)...` |
| `@@SPID`            | Renvoie l'ID de session actuel                     | `55`                                 |

## Interroger en mode GUI

Le mode GUI peut être utilisé pour interroger une base de données MSSQL sans écrire de requêtes.

1. Créez une nouvelle requête et sélectionnez la source de données MSSQL.
2. Sélectionnez **GUI mode** dans la liste déroulante.
3. Choisissez l'opération que vous souhaitez effectuer.
4. Récupérez et sélectionnez le **Table name**.
5. Cliquez sur le bouton **Preview** pour visualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

### List Rows
Récupère les enregistrements de la table sélectionnée avec des options facultatives de filtrage, de tri et de pagination.

#### Paramètres requis
- **Schema** : Sélectionnez le schéma requis soit en utilisant l'expression `fx` pour des valeurs dynamiques, soit en cliquant sur le bouton **Fetch Schemas** pour choisir un schéma dans la liste déroulante.
- **Table** : Sélectionnez la table à partir de laquelle les lignes doivent être récupérées.

#### Paramètres optionnels
- **Filter** : Appliquez des conditions pour ne renvoyer que les lignes qui correspondent à des critères spécifiques.
- **Sort** : Organisez les lignes renvoyées par ordre croissant ou décroissant selon les colonnes sélectionnées.
- **Aggregate** : Appliquez des fonctions d'agrégation telles que count, sum, average, minimum ou maximum sur les colonnes sélectionnées.
- **Group by** : Regroupez les lignes ayant les mêmes valeurs dans les colonnes sélectionnées en résultats résumés.
- **Limit** : Limite le nombre de lignes renvoyées dans le résultat.
- **Offset** : Ignore un nombre spécifié de lignes avant de commencer à renvoyer les résultats.

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/listrows-gui.png" alt="MSsql list row gui mode"/>

### Create Row
Insère une nouvelle ligne dans la table sélectionnée en fournissant des valeurs pour les colonnes requises.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètre requis
- **Columns** : Spécifie les colonnes de la table et leurs valeurs correspondantes à insérer lors de la création d'une nouvelle ligne. 

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/createrows-gui.png" alt="MSsql create row gui mode"/>

### Update Rows
Modifie les valeurs de ligne existantes dans la table sélectionnée en fonction des conditions ou identifiants spécifiés.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètre requis
- **Columns** : Spécifiez les noms de colonnes et les valeurs à mettre à jour dans la ou les lignes sélectionnées.

#### Paramètre optionnel
- **Filter** : Appliquez des conditions pour identifier la ou les lignes à mettre à jour.

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/updaterows-gui.png" alt="MSsql update row gui mode"/>

### Delete Rows
Supprime une ou plusieurs lignes de la table sélectionnée correspondant aux conditions données.

#### Paramètre requis
- **Filter** : Appliquez des conditions pour spécifier la ou les lignes à supprimer.

#### Paramètre optionnel
- **Limit** : Spécifiez le nombre maximal de lignes à supprimer.

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/deleterows-gui.png" alt="MSsql delete row gui mode"/>

### Upsert Row
Insère une nouvelle ligne ou met à jour une ligne existante si une clé primaire ou unique correspondante existe déjà.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètres requis
- **Primary key column(s)** : Spécifie la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour la mise à jour ou si une nouvelle ligne doit être insérée.
- **Columns** : Fournissez les noms de colonnes et les valeurs à insérer ou à mettre à jour.

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/upsertrows-gui.png" alt="MSsql upsert row gui mode"/>

### Bulk Insert
Insère plusieurs lignes dans la table en une seule opération à l'aide d'un tableau d'enregistrements.

#### Paramètres requis
- **Table** : Sélectionnez la table dans laquelle plusieurs lignes doivent être insérées.
- **Records to insert** : Fournissez l'ensemble des lignes et des valeurs de colonnes correspondantes à insérer en une seule opération.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 101, first_name: 'Alice', email: 'alice@example.com' },
  { id: 102, first_name: 'Bob', email: 'bob@example.com' },
  { id: 103, first_name: 'Charlie', email: 'charlie@example.com' }
] }}
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/bulk-insert-gui.png" alt="MSsql bulk insert gui mode"/>

### Bulk Update using Primary Key
Met à jour plusieurs lignes existantes en une seule fois en faisant correspondre les enregistrements à l'aide de leurs valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : Spécifiez la ou les colonnes de clé primaire utilisées pour identifier les lignes à mettre à jour.
- **Records to update** : Fournissez plusieurs enregistrements avec des valeurs de colonnes mises à jour pour les lignes de clé primaire correspondantes. 

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 101, first_name: 'Alice Charles', email: 'alice_charles@example.com' },
  { id: 102, first_name: 'Bob Mark', email: 'bob_mark@example.com' }
] }}
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/bulk-update-gui.png" alt="MSsql bulk update gui mode"/>

### Bulk Upsert using Primary Key
Insère plusieurs nouvelles lignes ou met à jour les lignes existantes en faisant correspondre les lignes à l'aide des valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : Spécifiez la ou les colonnes de clé primaire utilisées pour déterminer si chaque enregistrement doit être mis à jour ou inséré.
- **Records to upsert** : Fournissez plusieurs enregistrements qui seront insérés comme nouvelles lignes ou mis à jour si des valeurs de clé primaire correspondantes existent déjà.

Dans cette opération, si une ligne avec la clé primaire correspondante existe, elle est mise à jour ; sinon, une nouvelle ligne est insérée.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 101, first_name: 'Alice Charlie', email: 'alice_charlie@example.com' },
  { id: 104, first_name: 'David', email: 'david@example.com' }, 
  { id: 105, first_name: 'Emma Jackson', email: 'emma_jack@example.com' }    
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/mssql/bulk-upsert-gui.png" alt="MSsql bulk upsert gui mode"/>

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour savoir comment procéder : [link](/docs/app-builder/custom-code/transform-data)
:::
