---
id: querying-tooljet-db
title: Interroger les données
---

Interroger la base de données ToolJet est aussi simple que d'interroger n'importe quelle autre source de données dans ToolJet. Vous pouvez utiliser soit l'interface graphique, soit l'éditeur SQL pour interagir avec vos données.

## Mode GUI

1. Accédez au **panneau des requêtes**, et cliquez sur le bouton **+Add** pour ajouter une nouvelle requête, puis sélectionnez **ToolJet Database**.
   <img style={{ marginTop: '15px' }} className="screenshot-full" src="/img/v2-beta/database/newui/qtjdb.png" alt="Éditeur de la base de données ToolJet" />
2. Sélectionnez le mode GUI via le bouton bascule.
3. Sélectionnez la table que vous souhaitez interroger et l'opération dans le menu déroulant, puis saisissez les paramètres requis pour l'opération sélectionnée.
4. Cliquez sur le bouton **Run** pour exécuter la requête.

:::info
L'opération sélectionnée doit respecter les contraintes de colonne de la table sélectionnée.
:::

<img className="screenshot-full" src="/img/v2-beta/database/newui/qtjdb2.png" alt="Éditeur de la base de données ToolJet" />

### List Rows

Cette opération renvoie tous les enregistrements de la table.

#### Paramètres optionnels

- **Filter** : Ajoutez une condition en choisissant une colonne, une opération et la valeur pour filtrer les enregistrements.
- **Sort** : Triez la réponse de la requête en choisissant une colonne et l'ordre (ascendant ou descendant).
- **Limit** : Limitez le nombre d'enregistrements à renvoyer en saisissant un nombre.
- **Aggregate** : Effectuez des calculs sur un ensemble de valeurs et renvoyez un résultat unique.
  - Fonctions disponibles : Count, Sum
  - Limitations :
    - Sum uniquement pour les colonnes numériques.
    - Count uniquement pour les valeurs non nulles.
      <img style={{ marginTop: '15px' }} className="screenshot-full" src="/img/v2-beta/database/newui/aggregate.png" alt="Éditeur de la base de données ToolJet" />
- **Group By** : Groupez les lignes ayant les mêmes valeurs dans les colonnes spécifiées.
  - Ne peut être utilisé qu'après avoir ajouté au moins une condition d'agrégation.
  - Sélectionnez une ou plusieurs colonnes pour le regroupement.
  - Les résultats sont regroupés selon les combinaisons uniques de valeurs dans les colonnes sélectionnées.
    <img style={{ marginTop: '15px' }} className="screenshot-full" src="/img/v2-beta/database/newui/group-by.png" alt="Éditeur de la base de données ToolJet" />

### Create row

Cette opération crée un nouvel enregistrement dans la table. Vous pouvez créer un seul enregistrement ou plusieurs enregistrements à la fois.

#### Paramètres requis

- **Columns** : Choisissez les colonnes, ajoutez des valeurs pour le nouvel enregistrement, et saisissez les valeurs. Vous pouvez également ajouter une nouvelle colonne en cliquant sur le bouton **+Add column**.

### Update Row

Cette opération met à jour un enregistrement dans la table. Vous pouvez mettre à jour un seul enregistrement ou plusieurs enregistrements à la fois.

#### Paramètre requis

- **Filter** : Ajoutez une condition en choisissant une colonne, une opération et la valeur pour mettre à jour un enregistrement particulier.
- **Columns** : Choisissez les colonnes, mettez à jour les valeurs de l'enregistrement sélectionné, et saisissez les valeurs.

### Delete Row

Cette opération supprime un enregistrement dans la table. Vous pouvez supprimer un seul enregistrement ou plusieurs enregistrements à la fois.

#### Paramètres requis

- **Filter** : Ajoutez une condition en sélectionnant une colonne, une opération et la valeur pour supprimer un enregistrement spécifique.
- **Limit** : Limitez le nombre d'enregistrements à supprimer en saisissant un nombre.

### Bulk Update with Primary Key

Cette opération peut être utilisée pour mettre à jour plusieurs lignes à l'aide de la clé primaire. La clé primaire peut être une clé primaire singulière ou une clé primaire composite.

#### Paramètres requis

- **Primary key** : La clé primaire de la table est sélectionnée automatiquement et ne peut pas être modifiée.
- **Rows to upsert** : Tableau d'objets représentant les lignes à mettre à jour. Chaque objet du tableau doit spécifier la ou les colonnes de clé primaire avec leurs valeurs.

<img className="screenshot-full" src="/img/tjdb/query/bulk-update.png" alt="Éditeur de la base de données ToolJet" />

### Bulk Upsert with Primary Key

Cette opération peut être utilisée pour upserter plusieurs lignes à l'aide de la clé primaire. La clé primaire peut être une clé primaire singulière ou une clé primaire composite. En utilisant l'opération upsert, vous pouvez mettre à jour une ligne existante ou insérer une nouvelle ligne si elle n'existe pas.

#### Paramètres requis

- **Primary key** : La clé primaire de la table est sélectionnée automatiquement et ne peut pas être modifiée.
- **Rows to upsert** : Tableau d'objets représentant les lignes à mettre à jour. Chaque objet du tableau doit spécifier la ou les colonnes de clé primaire avec leurs valeurs.

<img className="screenshot-full" src="/img/tjdb/query/bulk-upsert.png" alt="Éditeur de la base de données ToolJet" />

## Éditeur SQL

L'**éditeur SQL** de ToolJet vous permet d'interroger la base de données ToolJet en écrivant des requêtes SQL, prenant en charge spécifiquement la syntaxe SQL standard pour les commandes **Data Manipulation Language (DML)**. Cette fonctionnalité est disponible uniquement sur la version [auto-hébergée](/docs/tj-setup/tj-deployment#self-hosted-tooljet) de ToolJet.

### Commandes SQL prises en charge

- **Commandes DML** : Vous pouvez utiliser les commandes DML suivantes pour manipuler les données :

  - **SELECT** : Récupérer des données depuis la base de données.
  - **INSERT** : Ajouter de nouveaux enregistrements à la base de données.
  - **UPDATE** : Modifier des données existantes.
  - **DELETE** : Supprimer des enregistrements de la base de données.

- **Commandes restreintes** :
  - Les commandes **Data Definition Language (DDL)** comme **CREATE**, **ALTER**, **TRUNCATE**, **DROP**, et **RENAME** ne sont pas autorisées.
  - Les commandes **Data Control Language (DCL)** comme **GRANT** et **REVOKE** sont également restreintes.

### Utilisation de l'éditeur SQL

1. Dans le panneau des requêtes, cliquez sur le bouton **+Add** pour ajouter une nouvelle requête, puis sélectionnez **ToolJet Database**.
2. Sélectionnez l'onglet mode **SQL** dans l'éditeur de requêtes.
3. Écrivez votre requête SQL dans l'éditeur.
4. Cliquez sur le bouton **Run** pour exécuter la requête.

<img className="screenshot-full" src="/img/v2-beta/database/newui/sql-editor.png" alt="Éditeur SQL de la base de données ToolJet" />

Exemple :

```sql
SELECT * FROM users WHERE age > 30
```

## Modifier des tables avec des contraintes de clé étrangère

Lorsque vous créez, mettez à jour ou supprimez des enregistrements dans une table ayant une contrainte de clé étrangère, vous devez vous assurer que la contrainte de clé étrangère n'est pas violée.

- Si vous essayez de créer/mettre à jour une nouvelle ligne dans la table source, vous devez vous assurer que la valeur de clé étrangère existe dans la table cible. Sinon, l'opération échouera avec un message d'erreur.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/violate-fk.gif" alt="Base de données ToolJet"/>

- De même, si vous essayez de supprimer une ligne dans la table cible, vous devez vous assurer que la valeur de clé étrangère n'est pas référencée dans la table source.

## Joindre des tables

Vous pouvez joindre deux ou plusieurs tables dans la base de données ToolJet en utilisant l'opération **Join**.

#### Paramètres requis

- **From** : Dans la section From, les paramètres suivants sont disponibles :

  - **Selected Table** : Sélectionnez la table depuis laquelle vous souhaitez joindre l'autre table.
  - **Type of Join** : Sélectionnez le type de jointure que vous souhaitez effectuer. Les options disponibles sont : `Inner Join`, `Left Join`, `Right Join`, et `Full Outer Join`.
  - **Joining Table** : Sélectionnez la table que vous souhaitez joindre avec la table sélectionnée. Si la table sélectionnée a une ou plusieurs relations de clé étrangère avec d'autres tables, ces tables seront listées avec une icône de clé étrangère à côté de leur nom.
  - **On** : Sélectionnez la colonne de la **table sélectionnée** et de la **table à joindre** sur laquelle vous souhaitez joindre les tables. Actuellement, seule l'opération `=` est prise en charge pour joindre les tables. Si la table sélectionnée et la table à joindre ont une relation de clé étrangère, les deux colonnes seront automatiquement renseignées dans le menu déroulant **On**.

    <img className="screenshot-full" src="/img/v2-beta/database/ux2/join-on-fk-v2.gif" alt="Base de données ToolJet"/>

    - **Condition AND ou OR** : Vous pouvez ajouter plusieurs conditions en cliquant sur le bouton **+Add more** sous chaque jointure. Les conditions peuvent être combinées par l'opération `AND` ou `OR`.

  <img className="screenshot-full" src="/img/v2-beta/database/newui/join1.png" alt="Éditeur de la base de données ToolJet" />

- **Filter** : Ajoutez une condition en choisissant une colonne, une opération et la valeur pour filtrer les enregistrements. Les opérations prises en charge sont les mêmes que les [opérations de filtre](/docs/tooljet-db/database-editor#available-operations-are) de l'opération **List rows**.
- **Sort** : Triez la réponse de la requête en choisissant une colonne et l'ordre (ascendant ou descendant).
- **Limit** : Limitez le nombre d'enregistrements à renvoyer en saisissant un nombre.
- **Offset** : Décalez le nombre d'enregistrements à renvoyer en saisissant un nombre. Ce paramètre est utilisé pour la pagination.
- **Select** : Sélectionnez les colonnes que vous souhaitez renvoyer dans la réponse de la requête. Par défaut, toutes les colonnes sont sélectionnées.

<img className="screenshot-full" src="/img/v2-beta/database/newui/join2.png" alt="Éditeur de la base de données ToolJet" />

## Associer une colonne date avec heure à un composant Table

La colonne date with time stocke les données au format ISO 8601. Lors de l'interrogation d'une table avec une colonne date with time, la colonne est affichée au format ISO 8601 par défaut. Pour afficher la colonne date with time dans un format plus lisible dans le composant Table, suivez ces étapes :

1. Connectez la requête au composant Table et accédez à son panneau de propriétés.
2. Dans la section Columns, sélectionnez la colonne qui stocke la date avec l'heure.
3. Changez le type de colonne de String à **Date Picker**.
4. Sous la section du format de date, activez les options **Enable date** et **Enable time** selon vos besoins.
5. Dans le champ de transformation, la variable `{{cellValue}}` contient la date au format ISO 8601. Convertissez-la en objet Date à l'aide de `{{new Date(cellValue)}}`, puis formatez l'objet Date selon vos besoins.

<img className="screenshot-full" src="/img/v2-beta/database/newui/date-with-time-column.png" alt="Date de la base de données ToolJet" />

## Interroger le type de données JSON

Dans ToolJet Database, une colonne peut être définie avec le type de données JSON. Elle peut être utilisée pour stocker des données structurées comme des tableaux ou des objets imbriqués, ce qui est utile pour des structures de données complexes telles que des configurations ou des journaux. Pour interroger le type de données JSON, suivez les étapes suivantes :

### Objet JSON plat

Un objet JSON plat est une structure JSON où toutes les paires clé-valeur existent à un seul niveau, sans imbrication. Chaque clé est unique au sein de l'objet, et toutes les valeurs sont des entrées de données directes plutôt que d'autres objets ou tableaux.

1. Ajoutez **ToolJet DB** comme source de données depuis le panneau des requêtes.
2. Sélectionnez le **mode GUI** (vous pouvez également sélectionner le mode SQL).
3. Sélectionnez le **nom de la table**.
4. Sélectionnez l'opération souhaitée dans le menu déroulant.
5. Cliquez sur le bouton **+ Add Condition** en face de Filter.
6. Choisissez la colonne contenant des données JSON, choisissez l'opération souhaitée et saisissez la valeur.
7. Dans le champ de saisie sous le nom de la colonne, saisissez la clé souhaitée en ajoutant `->>` avant la clé, exemple `->>city`.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/newui/flat_json.png" alt="Date de la base de données ToolJet" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
[
  {
    "id": 1,
    "json": {
      "id": 101,
      "age": 30,
      "city": "Los Angeles",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "country": "USA"
    }
  }
]
```

</details>

### Objet JSON imbriqué

Un objet JSON imbriqué est une structure JSON contenant des paires clé-valeur, où certaines valeurs sont elles-mêmes des objets ou des tableaux JSON. Cela crée une structure hiérarchique à plusieurs niveaux avec des couches imbriquées, pouvant représenter des relations complexes entre des éléments de données.

1. Ajoutez **ToolJet DB** comme source de données depuis le panneau des requêtes.
2. Sélectionnez le **mode GUI** (vous pouvez également sélectionner le mode SQL).
3. Sélectionnez le **nom de la table**.
4. Sélectionnez l'opération souhaitée dans le menu déroulant.
5. Cliquez sur le bouton **+ Add Condition** en face de Filter.
6. Choisissez la colonne contenant des données JSON, choisissez l'opération souhaitée et saisissez la valeur.
7. Dans le champ de saisie sous le nom de la colonne, saisissez le chemin JSON souhaité en ajoutant `->` avant chaque clé, exemple `->user->preferences->settings->notifications->sms->alerts->appointments->cancellations`.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/newui/nested_json_gui.png" alt="Date de la base de données ToolJet" />

**Remarque :** Vous pouvez utiliser `->` pour accéder aux champs JSON imbriqués et `->>` pour accéder au texte.

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

```json
[
  {
    "id": 102,
    "name": "Michael Brown",
    "age": 25,
    "email": "michael@example.com",
    "user": {
      "preference": {
        "settings": {
          "notification": {
            "sms": {
              "alert": false
            }
          }
        }
      }
    }
  },
  {
    "id": 104,
    "name": "David Miller",
    "age": 35,
    "email": "david@example.com",
    "user": {
      "preference": {
        "settings": {
          "notification": {
            "sms": {
              "alert": false
            }
          }
        }
      }
    }
  }
]
```

</details>

:::info
Si vous avez d'autres questions ou commentaires concernant **ToolJet Database**, veuillez nous contacter à support@tooljet.com ou rejoindre notre **[communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)**
:::
