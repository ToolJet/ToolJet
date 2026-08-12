---
id: postgresql
title: PostgreSQL
---

ToolJet a la capacité de se connecter à des bases de données PostgreSQL pour la récupération et la modification de données.

## Établir une connexion

Pour établir une connexion avec la source de données PostgreSQL, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir PostgreSQL comme source de données.

ToolJet propose les types de connexion suivants pour se connecter à votre base de données PostgreSQL :

- **[Connexion manuelle](#manual-connection)**
- **[Chaîne de connexion](#connection-string)**
- **[Connexion dynamique](#dynamic-connection)**

### Connexion manuelle

Pour vous connecter à PostgreSQL en utilisant les paramètres de connexion manuelle, sélectionnez **Manual connection** comme type de connexion et fournissez les détails suivants :

- **Host**
- **Port**
- **Database Name**
- **Username**
- **Password**
- **Connection Options**
- **SSL Certificate**
- **SSH Tunnelling**

<img style={{marginBottom:'15px'}} className="screenshot-full img-l" src="/img/datasource-reference/postgresql/manual-conn-ux-v5.png" alt="PG connection-manual"/>

### Chaîne de connexion

Pour vous connecter à PostgreSQL en utilisant une chaîne de connexion, sélectionnez **Connection String** comme type de connexion et fournissez les détails suivants :

:::info
Si votre chaîne de connexion (nom d'utilisateur, mot de passe, base de données) contient des caractères spéciaux, vous devez les encoder en URL.

Vous pouvez utiliser cet outil pour encoder ou décoder des valeurs : [URL Encoder/Decoder](https://meyerweb.com/eric/tools/dencoder/).

Par exemple, const POSTGRES_URL = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
:::

<img className="screenshot-full img-l" src="/img/datasource-reference/postgresql/connection-string-encoded.png" alt="PG connection string"/>

<br/><br/>

**Note :** Nous recommandons de créer un nouvel utilisateur de base de données PostgreSQL pour contrôler les niveaux d'accès de ToolJet.

:::info
Veuillez vous assurer que l'**Host/IP** de la base de données est accessible depuis votre VPC si vous avez auto-hébergé ToolJet. Si vous utilisez ToolJet cloud, veuillez **whitelister** notre IP.
:::

### SSH Tunnelling

ToolJet prend désormais en charge le tunneling SSH pour la source de données PostgreSQL, permettant des connexions sécurisées à des bases de données hébergées dans des réseaux privés. Cela peut être utilisé pour :

- Accéder à des bases de données privées
- Améliorer la sécurité
- Permettre une communication chiffrée
- Éviter les modifications des règles de pare-feu

#### Configuration SSH

Pour vous connecter en toute sécurité à une base de données PostgreSQL privée en utilisant le tunneling SSH :

1. Activez le bouton bascule **SSH tunnel** dans la configuration de la source de données PostgreSQL.
2. Fournissez les détails suivants :
   - **SSH host** – Nom d'hôte ou adresse IP du serveur.
   - **SSH port** – Numéro de port (par défaut : `22`).
   - **SSH username** – Nom d'utilisateur pour le serveur SSH.
   - **Authentication method** – Choisissez entre :
     - **Private key**
     - **Password**

Une fois configuré, ToolJet établit une connexion SSH sécurisée. Toutes les requêtes PostgreSQL sont acheminées via ce tunnel chiffré.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mssql/ssh-tunnel.png" alt="SSH tunnelling PostgreSQL connection"/>

## Effectuer des requêtes en mode SQL

1. Créez une nouvelle requête et sélectionnez la source de données PostgreSQL.
2. Sélectionnez le mode de requête SQL dans le menu déroulant et saisissez la requête.
3. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/pgs-query-v3.png" alt="PG SQL querying"/>

### Requêtes paramétrées

ToolJet prend en charge les requêtes SQL paramétrées, qui renforcent la sécurité en empêchant les injections SQL et permettent la construction de requêtes dynamiques. Pour mettre en œuvre des requêtes paramétrées :

1. Utilisez `:parameter_name` comme espace réservé dans votre requête SQL à l'endroit où vous souhaitez insérer des paramètres.
2. Dans la section **Parameters** située sous l'éditeur de requêtes, ajoutez des paires clé-valeur pour chaque paramètre.
3. Les clés doivent correspondre aux noms de paramètres utilisés dans la requête (sans les deux-points).
4. Les valeurs peuvent être des valeurs statiques ou des valeurs dynamiques utilisant la notation `{{ }}`.

<img className="screenshot-full img-full" src="/img/datasource-reference/postgresql/pgs-param-query.png" alt="Postgresql parameterized SQL queries"/>

#### Exemple :

```yaml
Query: SELECT * FROM users WHERE username = :username
```

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/sql2-v4.png" alt="Postgresql parameterized SQL queries"/>

Paramètres SQL : <br/>

- Key: username <br/>
- Value: `{{ components.username.value }}`

### Sécurité au niveau des lignes

Dans ToolJet, vous pouvez configurer une sécurité côté serveur au niveau des lignes pour restreindre l'accès à certaines lignes en fonction de groupes personnalisés ou de rôles utilisateur par défaut. Consultez le guide **[Configurer la sécurité au niveau des lignes](/docs/app-builder/dynamic-access-rule/row-level-security)** pour plus d'informations.

### Délai d'expiration des requêtes

Vous pouvez définir la durée du délai d'expiration pour les requêtes SQL en ajoutant la variable `PLUGINS_SQL_DB_STATEMENT_TIMEOUT` au fichier de configuration d'environnement. Par défaut, elle est fixée à 120 000 ms.

### Fonctions dynamiques et variables système de PostgreSQL

PostgreSQL propose des fonctions dynamiques qui fournissent des informations en temps réel sur la session, la connexion, la base de données et les paramètres du serveur en cours. Elles peuvent vous aider à écrire des requêtes qui s'adaptent automatiquement à différents environnements sans coder les valeurs en dur.

| Fonction / Variable  | Description                                                           | Exemple de sortie                              |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------- |
| `current_database()` | Renvoie le nom de la base de données actuelle                              | `tooljet_db`                                |
| `current_user`       | Renvoie le nom de l'utilisateur actuel                                  | `app_user`                                  |
| `session_user`       | Renvoie l'utilisateur de la session (identique à `current_user` sauf changement de rôle) | `app_user`                                  |
| `version()`          | Renvoie la version du serveur PostgreSQL                                 | `PostgreSQL 15.3 on x86_64-pc-linux-gnu...` |
| `inet_server_addr()` | Renvoie l'adresse IP du serveur                                  | `192.168.1.10`                              |
| `inet_server_port()` | Renvoie le port du serveur                                               | `5432`                                      |
| `pg_backend_pid()`   | Renvoie l'identifiant du processus du backend actuel                         | `56789`                                     |

### Connexion dynamique

ToolJet permet de remplacer les paramètres de connexion PostgreSQL tels que l'hôte et la base de données directement à **l'exécution de la requête** lorsque les paramètres de connexion dynamique sont activés. Cela permet à une seule source de données de prendre en charge plusieurs environnements ou locataires sans nécessiter de configurations distinctes.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/pg-dynamic-conn.png" alt="PG dynamic host"/>

## Effectuer des requêtes en mode GUI

1. Créez une nouvelle requête et sélectionnez la source de données PostgreSQL.
2. Sélectionnez le mode GUI dans le menu déroulant.
3. Sélectionnez l'opération que vous souhaitez effectuer.
4. Sélectionnez le **Schema**, la **Table** et ajoutez le nom de la **Primary key column**.
5. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

### List Rows

Récupère et affiche les lignes de la table sélectionnée en fonction de filtres, d'un tri et de limites optionnels.

#### Paramètres optionnels

- **Filter** : Applique des conditions pour ne renvoyer que les lignes correspondant aux critères spécifiés.
- **Sort** : Ordonne les lignes renvoyées en fonction d'une ou plusieurs colonnes sélectionnées.
- **Aggregate** : Effectue des calculs tels que le comptage, la somme ou la moyenne sur les colonnes sélectionnées.
- **Group by** : Regroupe les lignes ayant les mêmes valeurs dans les colonnes spécifiées afin de permettre l'agrégation.
- **Limit** : Limite le nombre de lignes renvoyées dans le résultat.
- **Offset** : Ignore un nombre spécifié de lignes avant de commencer à renvoyer les résultats.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/list-rows-gui.png" alt="List Rows GUI Postgresql"/>

### Create Rows

Insère une nouvelle ligne dans la table sélectionnée avec les valeurs de colonnes spécifiées.

Dans l'éditeur, assurez-vous de saisir les **Columns** au format `string`.

#### Paramètres requis

- **Columns** : Spécifie les colonnes de la table et leurs valeurs correspondantes à insérer lors de la création d'une nouvelle ligne.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/create-rows-gui.png" alt="Create Rows GUI Postgresql"/>

### Update Rows

Modifie les lignes existantes de la table qui correspondent aux conditions de filtre fournies.

Dans l'éditeur, assurez-vous de saisir les **Columns** au format `string`.

#### Paramètres requis

- **Columns** : Spécifiez les colonnes et leurs nouvelles valeurs qui doivent être mises à jour pour les lignes correspondantes.

#### Paramètres optionnels

- **Filter** : Définit les conditions permettant de sélectionner les lignes à mettre à jour.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/update-rows-gui.png" alt="Update Rows GUI Postgresql"/>

### Delete Rows

Supprime soit toutes les lignes de la table, soit celles qui correspondent aux conditions de filtre spécifiées.

#### Paramètres optionnels

- **Filter** : Spécifie les conditions permettant de déterminer quelles lignes doivent être supprimées de la table.
- **Limit** : Limite le nombre maximal de lignes pouvant être supprimées lors de l'opération.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/delete-rows-gui.png" alt="Delete Rows GUI Postgresql"/>

### Upsert Rows

Insère une nouvelle ligne ou met à jour une ligne existante si une clé primaire correspondante existe déjà. Dans l'éditeur, assurez-vous de saisir les **Columns** au format `string`.

#### Paramètres requis

- **Primary Key column(s)** : Spécifie la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour une mise à jour ou si une nouvelle ligne doit être insérée.
- **Columns** : Définit les paires colonne-valeur qui seront insérées ou mises à jour dans la ligne.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/upsert-rows-gui.png" alt="Upsert Rows GUI Postgresql"/>

### Bulk Insert

Insère plusieurs lignes dans la table en une seule opération en utilisant un tableau d'enregistrements.

#### Paramètres requis

- **Records to Insert** : Un tableau d'objets représentant plusieurs lignes à insérer dans la table sélectionnée en une seule opération.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
[
  {
    "id": 101,
    "activity_date": "2026-03-11",
    "category_id": 1,
    "notes": "Project kickoff meeting"
  },
  {
    "id": 102,
    "activity_date": "2026-03-12",
    "category_id": 2,
    "notes": "Client requirement discussion"
  },
  {
    "id": 103,
    "activity_date": "2026-03-13",
    "category_id": 3,
    "notes": "Design review session"
  }
]
```

</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/bulk-insert-gui.png" alt="Bulk Insert GUI Postgresql"/>

### Bulk Update using Primary Key

Met à jour plusieurs lignes en une seule fois en associant chaque enregistrement à sa clé primaire correspondante.

#### Paramètres requis

- **Primary Key columns** : Spécifie la ou les colonnes utilisées pour identifier de manière unique les lignes à mettre à jour.
- **Records to Update** : Un tableau d'objets contenant la clé primaire et les valeurs de colonnes à mettre à jour pour chaque ligne.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
[
  {
    "id": 101,
    "category_id": 12,
    "notes": "Updated: kickoff meeting completed"
  },
  {
    "id": 102,
    "category_id": 13,
    "notes": "Updated: client requirements finalized"
  }
]
```

</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/bulk-update-gui.png" alt="Bulk Update using GUI Postgresql"/>

### Bulk Upsert using Primary Key

Insère de nouvelles lignes ou met à jour des lignes existantes en masse en fonction des valeurs de clé primaire correspondantes.

#### Paramètres requis

- **Primary Key columns** : Spécifie la ou les colonnes utilisées pour déterminer si une ligne existe déjà pour une mise à jour ou si une nouvelle ligne doit être insérée.
- **Records to Update** : Un tableau d'objets contenant des valeurs de clé primaire et des données de colonnes qui seront insérées comme nouvelles lignes ou utilisées pour mettre à jour des lignes existantes.

Cela signifie essentiellement que si la ligne existe, elle est mise à jour, sinon elle est insérée.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
[
  {
    "id": 101,
    "activity_date": "2026-03-11",
    "category_id": 15,
    "notes": "Updated activity entry"
  },
  {
    "id": 104,
    "activity_date": "2026-03-14",
    "category_id": 18,
    "notes": "New activity created via upsert"
  }
]
```

</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/postgresql/bulk-upsert-gui.png" alt="Bulk Upsert using GUI Postgresql"/>

:::tip

- Vous pouvez appliquer des transformations aux résultats de la requête. Consultez notre documentation sur les transformations pour plus de détails : **[Transformation Tutorial](/docs/app-builder/custom-code/transform-data)**
- Consultez ce guide pratique sur **[la mise à jour en masse de plusieurs lignes](/docs/widgets/table/bulk-row-operations#bulk-update-rows)** à partir d'un composant table.
  :::
