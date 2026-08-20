---
id: mysql
title: MySQL
---

ToolJet peut se connecter à des bases de données MySQL pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données MySQL, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** via le tableau de bord ToolJet. ToolJet prend en charge à la fois les connexions MySQL **statiques** et **dynamiques**. En plus de configurer des détails de connexion fixes au niveau de la source de données, vous pouvez également définir certains paramètres de connexion de manière dynamique depuis le générateur de requêtes au moment de l'exécution.

### Connexion statique

<img className="screenshot-full img-full" src="/img/datasource-reference/mysql/connection-v4.png" alt="MySQL data source"/>

### Connexion dynamique 

La connexion dynamique permet de fournir des paramètres de connexion MySQL spécifiques au moment de l'exécution depuis le générateur de requêtes, ce qui permet un accès flexible et dynamique à la base de données.

<img className="screenshot-full img-full" src="/img/datasource-reference/mysql/query-host.png" alt="mysql dynamic host"/>

:::info
Veuillez vous assurer que le **Host/IP** de la base de données est accessible depuis votre VPC si vous avez auto-hébergé ToolJet. Si vous utilisez ToolJet Cloud, veuillez **liste blanche (whitelist)** notre IP.
:::

**ToolJet nécessite les éléments suivants pour se connecter à votre base de données MySQL :**

- Username
- Password
- Database Name
- Connection Type

Si vous utilisez **Hostname** comme type de connexion, vous devrez fournir les informations suivantes :

- Host/IP
- Port
- SSL
- SSL Certificate :
  - CA Certificate
  - Self-signed Certificate
  - None

Si vous utilisez **Socket** comme type de connexion, vous devrez fournir les informations suivantes :
- **Socket Path**

**Remarque :** Il est recommandé de créer un nouvel utilisateur de base de données MySQL afin de pouvoir contrôler les niveaux d'accès de ToolJet.

### Tunneling SSH 

ToolJet prend désormais en charge le tunneling SSH pour la source de données MySQL, permettant des connexions sécurisées aux bases de données hébergées dans des réseaux privés. Cela peut être utilisé pour :
- Accéder à des bases de données privées
- Améliorer la sécurité
- Permettre une communication chiffrée
- Éviter les modifications des règles de pare-feu

#### Configuration SSH

Pour se connecter de manière sécurisée à une base de données MySQL privée en utilisant le tunneling SSH :

1. Activez le bouton **SSH tunnel** dans la configuration de la source de données MySQL.
2. Fournissez les détails suivants :
   - **SSH host** – Nom d'hôte ou adresse IP du serveur.
   - **SSH port** – Numéro de port (par défaut : `22`).
   - **SSH username** – Nom d'utilisateur pour le serveur SSH.
   - **Authentication method** – Choisissez entre :
     - **Private key**
     - **Password**

Une fois configuré, ToolJet établit une connexion SSH sécurisée. Toutes les requêtes MSSQL sont acheminées via ce tunnel chiffré.

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/ssh-tunnel.png" alt="Mysql SSH tunnelling connection" />

## Interroger en mode SQL

Le mode SQL peut être utilisé pour interroger une base de données MySQL à l'aide de requêtes SQL.

1. Créez une nouvelle requête et sélectionnez la source de données MySQL.
2. Sélectionnez **SQL mode** dans la liste déroulante.
3. Saisissez la requête SQL dans l'éditeur.
4. Cliquez sur le bouton **Run** pour exécuter la requête.

**Exemple :**

```sql
SELECT * FROM users
```

<img className="screenshot-full" src="/img/datasource-reference/mysql/query-sql.png" alt="mysql querying"/>

### Requêtes paramétrées

ToolJet prend en charge les requêtes SQL paramétrées, ce qui renforce la sécurité en empêchant les injections SQL et permet une construction dynamique des requêtes. Pour mettre en œuvre des requêtes paramétrées :

1. Utilisez `:parameter_name` comme espace réservé dans votre requête SQL à l'endroit où vous souhaitez insérer des paramètres.
2. Dans la section **Parameters** sous l'éditeur de requêtes, ajoutez des paires clé-valeur pour chaque paramètre.
3. Les clés doivent correspondre aux noms des paramètres utilisés dans la requête (sans les deux-points).
4. Les valeurs peuvent être des valeurs statiques ou des valeurs dynamiques utilisant la notation `{{ }}`.

<img className="screenshot-full img-full" src="/img/datasource-reference/mysql/param-query-v2.png" alt="mysql parameter querying"/>

##### Exemple :

```yaml
Query: SELECT * FROM users WHERE username = :username
```
Paramètres SQL :
- Key : username
- Value : oliver ou `{{ components.username.value }}`

### Sécurité au niveau des lignes

Dans ToolJet, vous pouvez mettre en place une sécurité côté serveur au niveau des lignes pour restreindre l'accès à des lignes spécifiques en fonction de groupes personnalisés ou de rôles utilisateur par défaut. Consultez le guide [Setup Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security) pour plus d'informations.

### Délai d'expiration des requêtes

Vous pouvez définir la durée du délai d'expiration pour les requêtes SQL en ajoutant la variable `PLUGINS_SQL_DB_STATEMENT_TIMEOUT` au fichier de configuration d'environnement. Par défaut, elle est réglée sur 120 000 ms.

### Fonctions dynamiques et variables système de MySQL

MySQL propose des fonctions dynamiques et des variables système qui fournissent des informations en temps réel sur la base de données actuelle, la session utilisateur, la connexion et l'environnement du serveur. Elles peuvent vous aider à écrire des requêtes qui s'adaptent automatiquement à différents environnements sans coder de valeurs en dur.

| Function / Variable | Description                                                       | Example Output       |
| ------------------- | ----------------------------------------------------------------- | -------------------- |
| `DATABASE()`        | Renvoie le nom de la base de données actuellement utilisée                   | `tooljet_db`         |
| `USER()`            | Renvoie le compte utilisateur MySQL actuel (user\@host)               | `app_user@localhost` |
| `CURRENT_USER()`    | Renvoie le compte utilisateur authentifié (peut différer de `USER()`) | `app_user@%`         |
| `VERSION()`         | Renvoie la version du serveur MySQL                                  | `8.0.33`             |
| `@@hostname`        | Renvoie le nom d'hôte du serveur MySQL                                 | `db-server-01`       |
| `@@port`            | Renvoie le numéro de port du serveur MySQL                              | `3306`               |
| `CONNECTION_ID()`   | Renvoie l'ID de connexion de la session actuelle                 | `123456`             |

## Interroger en mode GUI

Le mode GUI peut être utilisé pour interroger une base de données MySQL sans écrire de requêtes.

1. Créez une nouvelle requête et sélectionnez la source de données MySQL.
2. Sélectionnez **GUI mode** dans la liste déroulante.
3. Choisissez l'opération que vous souhaitez effectuer.
4. Récupérez et sélectionnez le **Table name**.
5. Cliquez sur le bouton **Preview** pour visualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

### List Rows
Récupère les enregistrements de la table sélectionnée avec des options facultatives de filtrage, de tri et de pagination.

#### Paramètre requis
- **Table** : Sélectionnez la table à partir de laquelle les lignes doivent être récupérées.

#### Paramètres optionnels
- **Filter** : Appliquez des conditions pour ne renvoyer que les lignes qui correspondent à des critères spécifiques.
- **Sort** : Organisez les lignes renvoyées par ordre croissant ou décroissant selon les colonnes sélectionnées.
- **Aggregate** : Appliquez des fonctions d'agrégation telles que count, sum, average, minimum ou maximum sur les colonnes sélectionnées.
- **Group by** : Regroupez les lignes ayant les mêmes valeurs dans les colonnes sélectionnées en résultats résumés.
- **Limit** : Limite le nombre de lignes renvoyées dans le résultat.
- **Offset** : Ignore un nombre spécifié de lignes avant de commencer à renvoyer les résultats.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/listrow-gui.png" alt="Mysql List Rows GUI"/>

### Create Rows
Insère une nouvelle ligne dans la table sélectionnée en fournissant des valeurs pour les colonnes requises.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètres requis
- **Columns** : Spécifie les colonnes de la table et leurs valeurs correspondantes à insérer lors de la création d'une nouvelle ligne. 

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/createrow-gui.png" alt="Mysql Create Rows GUI"/>

### Update Rows
Modifie les valeurs de ligne existantes dans la table sélectionnée en fonction des conditions ou identifiants spécifiés.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètres requis
- **Columns** : Spécifiez les noms de colonnes et les valeurs à mettre à jour dans la ou les lignes sélectionnées.

#### Paramètres optionnels
- **Filter** : Appliquez des conditions pour identifier la ou les lignes à mettre à jour.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/updaterow-gui.png" alt="Mysql Update Rows GUI"/>

### Delete Rows
Supprime une ou plusieurs lignes de la table sélectionnée correspondant aux conditions données.

#### Paramètres optionnels
- **Filter** : Appliquez des conditions pour spécifier la ou les lignes à supprimer.
- **Limit** : Spécifiez le nombre maximal de lignes à supprimer.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/deleterow-gui.png" alt="Mysql Delete Rows GUI"/>

### Upsert Rows
Insère une nouvelle ligne ou met à jour une ligne existante si une clé primaire ou unique correspondante existe déjà.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètres requis
- **Primary key column(s)** : Spécifie la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour la mise à jour ou si une nouvelle ligne doit être insérée.
- **Columns** : Fournissez les noms de colonnes et les valeurs à insérer ou à mettre à jour.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/upsertrow-gui.png" alt="Mysql Upsert Rows GUI"/>

### Bulk Insert
Insère plusieurs lignes dans la table en une seule opération à l'aide d'un tableau d'enregistrements.

#### Paramètres requis
- **Table** : Sélectionnez la table dans laquelle plusieurs lignes doivent être insérées.
- **Records to insert** : Fournissez l'ensemble des lignes et des valeurs de colonnes correspondantes à insérer en une seule opération.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 25, firstname: 'secondupdate' },
  { id: 26, firstname: 'john' },
  { id: 16, firstname: 'doe' },
  { id: 17, firstname: 'alice' },
  { id: 18, firstname: 'bob' },
  { id: 19, firstname: 'charlie' },
  { id: 20, firstname: 'david' },
  { id: 21, firstname: 'emma' },
  { id: 22, firstname: 'frank' },
  { id: 23, firstname: 'grace' },
  { id: 24, firstname: 'henry' }
] }}
```
</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/bulk-insert-gui.png" alt="Mysql Bulk Insert GUI"/>

### Bulk Update using Primary Key
Met à jour plusieurs lignes existantes en une seule fois en faisant correspondre les enregistrements à l'aide de leurs valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : Spécifiez la ou les colonnes de clé primaire utilisées pour identifier les lignes à mettre à jour.
- **Records to update** : Fournissez plusieurs enregistrements avec des valeurs de colonnes mises à jour pour les lignes de clé primaire correspondantes. 

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 14, firstname: 'updated_secondupdate' },
  { id: 15, firstname: 'updated_john' },
  { id: 16, firstname: 'updated_doe' },
  { id: 17, firstname: 'updated_alice' },
  { id: 18, firstname: 'updated_bob' }
] }}
```
</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/bulk-update-pk-gui.png" alt="Mysql Bulk Update key GUI"/>

### Bulk Upsert using Primary Key
Insère plusieurs nouvelles lignes ou met à jour les lignes existantes en faisant correspondre les lignes à l'aide des valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : Spécifiez la ou les colonnes de clé primaire utilisées pour déterminer si chaque enregistrement doit être mis à jour ou inséré.
- **Records to upsert** : Fournissez plusieurs enregistrements qui seront insérés comme nouvelles lignes ou mis à jour si des valeurs de clé primaire correspondantes existent déjà.

Dans cette opération, si une ligne avec la clé primaire correspondante existe, elle est mise à jour ; sinon, une nouvelle ligne est insérée.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/bulk-upsert-pk-gui.png" alt="Mysql Bulk Upsert key GUI"/>

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Pour en savoir plus sur les transformations, [cliquez ici](/docs/app-builder/custom-code/transform-data).
:::
