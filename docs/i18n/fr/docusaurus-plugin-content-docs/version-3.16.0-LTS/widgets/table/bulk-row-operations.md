---
id: bulk-row-operations
title: Bulk Row Operations
---

Ce guide explique comment effectuer des opérations en masse sur les lignes d'une Table en utilisant la sélection de lignes, des requêtes JavaScript et du SQL avec une source de données SQL configurée. PostgreSQL est utilisé dans les exemples, mais la même approche s'applique à d'autres bases de données SQL.


### Prérequis

- Une source de données SQL connectée
- Un composant Table ajouté au canevas
- Une familiarité de base avec :
    - La sélection de lignes dans la Table
    - Les requêtes JavaScript
    - Les requêtes SQL

## Configuration

### Étape 1 : Récupérer les données depuis la base de données
- Créez une requête SQL nommée *getRecords*.
- Utilisez :
    ```sql
    SELECT * FROM <table_name>
    ```
- Activez Run query on application load.

### Étape 2 : Peupler la Table
- Ajoutez un composant **Table**.
- Définissez la propriété Data :

```js
{{queries.getRecords.data}}
```

<img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/populate.png" alt="Populate the Table" />

### Étape 3 : Activer la sélection de lignes
Dans les propriétés de la Table, accédez à *Row Selection* et activez :
- Allow selection
- Highlight selected row
- Bulk selection

<img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/row-selection.png" alt="Populate the Table" />

## Suppression en masse de lignes

### Étape 1 : Créer une requête JavaScript pour générer la requête SQL de suppression
- Créez une requête RunJS nommée `generateDeleteSQLQuery` pour lire les lignes sélectionnées dans la table et générer une requête DELETE.

- Saisissez le code suivant :

    ```js
    const uniqueIdentifier = "id";

    const idsToDelete = Object.values(components.ordersTable.selectedRows).map(dataUpdate => dataUpdate[uniqueIdentifier]);

    const idsString = idsToDelete.map(id => `'${id}'`).join(', ');

    const SQL = `DELETE FROM orders WHERE ${uniqueIdentifier} IN (${idsString});`;

    return SQL;
    ```
- Cliquez sur le bouton Preview pour voir l'instruction SQL générée par la requête.

    <img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/generateDeleteSQLQuery.png" alt="Generate Delete SQL Query" />

### Étape 2 : Créer une nouvelle requête Postgres pour supprimer les données
- Créez une requête Postgres nommée `deleteRecords` pour exécuter la requête renvoyée par *generateDeleteSQLQuery* et supprimer les données.
- Sélectionnez SQL Mode.
- Saisissez le code suivant :

    ```sql
    {{queries.generateDeleteSQLQuery.data}} 
    ```
    <img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/deleteRecords.png" alt="Run Delete SQL Query" />
- Allez dans Settings. Ajoutez un nouveau gestionnaire d'événement. Sélectionnez *Query Success* comme Event, *Run Query* comme Action et *getRecords* comme Query. Cela garantit que les données sont actualisées après la suppression.
    <img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/deleteRecordsEvent.png" alt="Refresh Data" />

### Étape 3 : Lier la requête JavaScript à la requête de suppression
- Ouvrez les Settings de *generateDeleteSQLQuery*.
- Ajoutez un nouveau gestionnaire d'événement. Sélectionnez *Query Success* comme Event, *Run Query* comme Action et *deleteRecords* comme Query.

    <img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/generateDeleteSQLQueryEvent.png" alt="Generate Delete SQL Query Success Event" />

Cela garantit que dès que le SQL est généré avec succès, la requête de suppression s'exécute automatiquement.

### Étape 4 : Ajouter un bouton pour supprimer les lignes sélectionnées
- Modifiez ses propriétés et définissez la propriété Label sur "Delete selected".
- Ajoutez un nouveau gestionnaire d'événement au bouton.
- Sélectionnez *On click* comme Event, *Run Query* comme Action, et *generateDeleteSQLQuery* comme Query.

    <img className="screenshot-full img-full mt-5" src="/img/widgets/table/bulk-row-operations/deleteButton.png" alt="Delete Button" />
- Vous pouvez également, en option, ajouter un état de chargement (Loading state) et une visibilité (Visibility).

## Mise à jour en masse de lignes

### Étape 1 : Rendre les colonnes modifiables
Sous Table Columns, activez *Make editable* pour les colonnes requises.
    <img className="screenshot-full img-full mt-5" src="/img/widgets/table/bulk-row-operations/makeEditable.png" alt="Make Column Editable" />

### Étape 2 : Créer une requête JavaScript pour générer la requête SQL de mise à jour
- Créez une requête RunJS nommée `generateUpdateSQLQuery` pour lire les lignes sélectionnées dans la table et générer une requête UPDATE.
- Saisissez le code suivant :

    ```js
    const uniqueIdentifier = "id"
    const cols = Object.values(components.ordersTable.changeSet).map((col, index) => {
        return {
            col: Object.keys(col),
        [uniqueIdentifier]: Object.values(components.ordersTable.dataUpdates)[index][uniqueIdentifier],
        values: Object.values(col),
    };
    });

    const sql = cols.map((column) => {
        const { col, id, values } = column;
    const cols = col.map((col, index) => `${col} = '${values[index]}'`);
    return `UPDATE orders SET ${cols.join(", ")} WHERE id = '${id}';`;
    });

    return sql
    ```
- Cliquez sur le bouton Preview pour voir l'instruction SQL générée par la requête.
    <img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/generateUpdateSQLQuery.png" alt="Generate Update SQL Query" />

### Étape 3 : Créer une nouvelle requête Postgres pour mettre à jour les données
- Créez une requête Postgres nommée `updateRecords` pour exécuter la requête renvoyée par *generateUpdateSQLQuery* et mettre à jour les données.
- Sélectionnez SQL Mode.
- Saisissez le code suivant :

    ```sql
    {{queries.generateUpdateSQLQuery.data.join(' ')}} 
    ```
    <img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/updateRecords.png" alt="Run Update SQL Query" />
- Allez dans Settings. Ajoutez un nouveau gestionnaire d'événement. Sélectionnez *Query Success* comme Event, *Run Query* comme Action et *getRecords* comme Query. Cela garantit que les données sont actualisées après l'opération de mise à jour.
    <img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/updateRecordsEvent.png" alt="Refresh Data" />

### Étape 4 : Lier la requête JavaScript à la requête de mise à jour
- Ouvrez les Settings de *generateUpdateSQLQuery*.
- Ajoutez un nouveau gestionnaire d'événement. Sélectionnez *Query Success* comme Event, *Run Query* comme Action et *updateRecords* comme Query.

    <img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/generateUpdateSQLQueryEvent.png" alt="Generate Update SQL Query Success Event" />

Cela garantit que dès que le SQL est généré avec succès, la requête de mise à jour s'exécute automatiquement.

### Étape 5 : Ajouter un gestionnaire d'événement pour mettre à jour les données
- Modifiez le composant *ordersTable* et ajoutez un gestionnaire d'événement pour l'événement *Save Changes*, afin que lorsqu'un utilisateur modifie la Table et clique sur le bouton *Save Changes*, la requête *generateUpdateSQLQuery* s'exécute.

- Vous pouvez également ajouter, en option, un état de chargement à la Table en cliquant sur *fx* à côté de la propriété *Loading state* et en utilisant le code suivant :

    ```js
    {{queries.generateUpdateSQLQuery.isLoading || queries.updateRecords.isLoading || queries.getRecords.isLoading}}
    ```
<img className="screenshot-full img-full" src="/img/widgets/table/bulk-row-operations/saveChanges.png" alt="Save Changes" />

