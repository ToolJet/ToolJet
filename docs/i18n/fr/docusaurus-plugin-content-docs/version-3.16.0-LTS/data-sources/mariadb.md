---
id: mariadb
title: MariaDB
---

ToolJet peut se connecter à des serveurs MariaDB auto-hébergés ou basés sur le cloud pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données globale MariaDB, vous pouvez soit cliquer sur le bouton **+ Add new global datasource** situé sur le panneau de requêtes, soit naviguer vers la page **[Global Datasources](/docs/data-sources/overview)** via le tableau de bord ToolJet.

**ToolJet nécessite les détails de connexion suivants pour se connecter à MariaDB :**

- **Host :** Le nom d'hôte ou l'adresse IP du serveur MariaDB.

- **Username :** Le nom d'utilisateur du compte MariaDB.

- **Password :** Le mot de passe du compte MariaDB.

- **Connection Limit :** Le nombre maximal de connexions simultanées autorisées vers le serveur MariaDB.

- **Port :** Le numéro de port du serveur MariaDB.

- **Database :** Le nom de la base de données à laquelle vous souhaitez vous connecter.

### Connexion SSL/TLS

Elle permet une communication chiffrée entre ToolJet et le serveur MariaDB afin de protéger les données transmises sur le réseau.

- **SSL :** Indique s'il faut utiliser SSL pour se connecter au serveur MariaDB.

- **SSL Certificate :** Il existe trois options pour le détail de connexion du certificat SSL :

  - **CA Certificate :** Cette option vous permet d'utiliser un certificat émis par une autorité de certification (CA). C'est l'option la plus sécurisée, car elle garantit que l'identité du serveur MariaDB a été vérifiée par un tiers de confiance.

  - **Self-Signed Certificate :** Cette option vous permet d'utiliser un certificat auto-signé. Elle est moins sécurisée que l'utilisation d'un certificat CA, car elle ne garantit pas que l'identité du serveur MariaDB a été vérifiée par un tiers de confiance. Cependant, c'est une bonne option si vous n'avez pas accès à un certificat CA.

  - **None :** Cette option n'utilise pas SSL. C'est l'option la moins sécurisée, car elle permet à quiconque d'intercepter vos communications avec le serveur MariaDB.

### Tunneling SSH et configuration

ToolJet prend en charge le tunneling SSH pour la source de données MariaDB, permettant des connexions sécurisées aux bases de données hébergées dans des réseaux privés. Cela peut être utilisé pour :

- Accéder à des bases de données privées
- Améliorer la sécurité
- Permettre une communication chiffrée
- Éviter les modifications des règles de pare-feu

Pour se connecter de manière sécurisée à une base de données MariaDB privée en utilisant le tunneling SSH :

- Activez le bouton **SSH tunnel** dans la configuration de la source de données MariaDB et fournissez les détails suivants :

   - **SSH host :** Nom d'hôte ou adresse IP du serveur.

   - **SSH port :** Numéro de port (par défaut : 22).

   - **SSH username :** Nom d'utilisateur pour le serveur SSH.

   - **Authentication method :** Choisissez entre :
      - **Private key :** La clé privée utilisée pour s'authentifier de manière sécurisée auprès du serveur MariaDB lorsque l'authentification par clé est activée.

     - **Password :** Le mot de passe associé au compte utilisateur de la base de données pour l'authentification.

<img className="screenshot-full img-l" src="/img/datasource-reference/mariadb/connection-v4.png" alt="MariaDB data source connection" />

## Interroger MariaDB

Une fois connecté à la source de données MariaDB, suivez ces étapes pour écrire des requêtes et interagir avec une base de données MariaDB depuis l'application ToolJet :

1. Cliquez sur le bouton **+ Add** pour ouvrir la liste des sources de données disponibles.
2. Sélectionnez **MariaDB** dans la section des sources de données globales.
3. Saisissez la requête SQL dans l'éditeur.
4. Cliquez sur **Preview** pour visualiser les données renvoyées par la requête, ou cliquez sur **Run** pour exécuter la requête.

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de Transformation. Pour plus d'informations sur les transformations, veuillez consulter notre documentation à **[link](/docs/app-builder/custom-code/transform-data)**.
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/query-v3.png" alt="MariaDB query" />

## Requêtes CRUD

Supposons qu'il existe une base de données MariaDB nommée _customers_. Nous pouvons créer une table exemple appelée _users_ avec les colonnes suivantes :

- **id** (entier, auto-incrémenté)
- **name** (varchar)
- **age** (entier)
- **email** (varchar)

```sql
CREATE TABLE user(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  age INT,
  email VARCHAR(100)
);
```

La commande ci-dessus créera la table _users_ au sein de la base de données _customers_. Explorons maintenant les commandes CRUD pour cette table dans MariaDB :

### Create (Insertion)

#### Pour insérer un seul utilisateur :

```sql
INSERT INTO user (name, age, email)
VALUES ('John Doe', 25, 'john@example.com');
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/create-insert-v3.png" alt="MariaDB query" />

</div>

#### Pour insérer plusieurs utilisateurs :

```sql
INSERT INTO user (name, age, email)
VALUES
    ('John Doe', 25, 'john@example.com'),
    ('Jane Smith', 30, 'jane@example.com'),
    ('Bob Johnson', 35, 'bob@example.com');
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/create-insert-mutliple-v3.png" alt="MariaDB query" />

### Read (Lecture)

#### Pour récupérer tous les utilisateurs :

```sql
SELECT * FROM user;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/read-select-1-v3.png" alt="MariaDB query" />

#### Pour récupérer des colonnes spécifiques des utilisateurs :

```sql
SELECT name, age, email FROM user;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/read-select-2-v3.png" alt="MariaDB query"/>

#### Pour ajouter des conditions et des filtres à la sélection :

```sql
SELECT name, age, email
FROM user
WHERE age > 25;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/read-select-3-v3.png" alt="MariaDB query"/>

### Update (Mise à jour)

#### Pour mettre à jour l'âge d'un utilisateur :

```sql
UPDATE user
SET age = 26
WHERE id = 1;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/update-v3.png" alt="MariaDB query"/>

### Delete (Suppression)

#### Pour supprimer un utilisateur :

```sql
DELETE FROM user WHERE id = 1;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/delete-v3.png" alt="MariaDB query"/>

N'oubliez pas d'ajuster les valeurs et les conditions selon vos besoins spécifiques. Ces commandes vous permettront de créer la table, d'insérer des données, de récupérer des données, de mettre à jour des données et de supprimer des données dans la table _users_ dans MariaDB.

## Interroger en mode GUI

Le mode GUI peut être utilisé pour interroger MariaDB sans écrire de requêtes.

1. Créez une nouvelle requête et sélectionnez la source de données MariaDB.
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

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/listrows-gui.png" alt="MariaDB list row gui mode"/>

### Create Row
Insère une nouvelle ligne dans la table sélectionnée en fournissant des valeurs pour les colonnes requises.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètre requis
- **Columns** : Spécifie les colonnes de la table et leurs valeurs correspondantes à insérer lors de la création d'une nouvelle ligne. 

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/createrows-gui.png" alt="mariaDB create row gui mode"/>

### Update Rows
Modifie les valeurs de ligne existantes dans la table sélectionnée en fonction des conditions ou identifiants spécifiés.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètre requis
- **Columns** : Spécifiez les noms de colonnes et les valeurs à mettre à jour dans la ou les lignes sélectionnées.

#### Paramètre optionnel
- **Filter** : Appliquez des conditions pour identifier la ou les lignes à mettre à jour.

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/updaterows-gui.png" alt="MariaDB update row gui mode"/>

### Delete Rows
Supprime une ou plusieurs lignes de la table sélectionnée correspondant aux conditions données.

#### Paramètre requis
- **Filter** : Appliquez des conditions pour spécifier la ou les lignes à supprimer.

#### Paramètre optionnel
- **Limit** : Spécifiez le nombre maximal de lignes à supprimer.

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/deleterows-gui.png" alt="Mariadb delete row gui mode"/>

### Upsert Row
Insère une nouvelle ligne ou met à jour une ligne existante si une clé primaire ou unique correspondante existe déjà.

Dans l'éditeur, assurez-vous que l'entrée **Columns** est fournie au format `string`.

#### Paramètres requis
- **Primary key column(s)** : Spécifie la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour la mise à jour ou si une nouvelle ligne doit être insérée.
- **Columns** : Fournissez les noms de colonnes et les valeurs à insérer ou à mettre à jour.

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/upsertrow-gui.png" alt="Mariadb upsert row gui mode"/>

### Bulk Insert
Insère plusieurs lignes dans la table en une seule opération à l'aide d'un tableau d'enregistrements.

#### Paramètres requis
- **Table** : Sélectionnez la table dans laquelle plusieurs lignes doivent être insérées.
- **Records to insert** : Fournissez l'ensemble des lignes et des valeurs de colonnes correspondantes à insérer en une seule opération.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 10, first_name: 'Alice', email: 'alice@example.com' },
  { id: 11, first_name: 'Bob', email: 'bob@example.com' },
  { id: 12, first_name: 'Charlie', email: 'charlie@example.com' }
] }}
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/bulk-insert-gui.png" alt="Mariadb bulk insert gui mode"/>

### Bulk Update using Primary Key
Met à jour plusieurs lignes existantes en une seule fois en faisant correspondre les enregistrements à l'aide de leurs valeurs de clé primaire.

#### Paramètres requis
- **Primary key column(s)** : Spécifiez la ou les colonnes de clé primaire utilisées pour identifier les lignes à mettre à jour.
- **Records to update** : Fournissez plusieurs enregistrements avec des valeurs de colonnes mises à jour pour les lignes de clé primaire correspondantes. 

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{{ [
  { id: 10, first_name: 'Alice Charles', email: 'alice_charles@example.com' },
  { id: 11, first_name: 'Bob Mark', email: 'bob_mark@example.com' },
  { id: 12, first_name: 'Charlie Suzy', email: 'charlie_suzy@example.com' }
] }}
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/bulk-update-gui.png" alt="Mariadb bulk update gui mode"/>

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
  { id: 10, first_name: 'Alice Charlie', email: 'alice_charlie@example.com' },
  { id: 14, first_name: 'Rahul', email: 'rahul@example.com' }, 
  { id: 15, first_name: 'Kiara Oben', email: 'kiara_oben@example.com' }    
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/mariadb/bulk-upsert-gui.png" alt="Mariadb bulk upsert gui mode"/>

## Conseils de dépannage

Si vous avez des difficultés à connecter une source de données MariaDB à ToolJet, essayez ce qui suit :

- Assurez-vous que votre serveur MariaDB est en cours d'exécution et accessible depuis le serveur ToolJet.

- Vérifiez l'orthographe et la casse de vos identifiants.

- Essayez de redémarrer le serveur ToolJet.

Si le problème persiste, veuillez contacter le [support ToolJet](mailto:support@tooljet.com) ou poser votre question sur [Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) pour obtenir de l'aide.
