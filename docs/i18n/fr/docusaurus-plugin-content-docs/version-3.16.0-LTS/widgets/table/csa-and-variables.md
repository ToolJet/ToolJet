---
id: table-csa-and-variables
title: Component Specific Actions (CSA) and Exposed Variables
---

## Component specific actions (CSA)

Les actions suivantes du composant Table peuvent être contrôlées à l'aide des component specific actions (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setPage()      | Définit la page de la table.   | Utilisez une requête RunJS (par ex.,  <br/> `await components.table1.setPage(2)`) <br/> ou déclenchez-la via un événement. |
| selectRow()    | Sélectionne une ligne de la table | Utilisez une requête RunJS (par ex.,  <br/> `await components.table1.selectRow('id','11')`) <br/> ou déclenchez-la via un événement. |
| deselectRow()  | Désélectionne une ligne de la table. | Utilisez une requête RunJS (par ex.,  <br/> `await components.table1.deselectRow()`)  <br/> ou déclenchez-la via un événement. |
| selectAllRows()| Sélectionne toutes les lignes de la table.            | Utilisez une requête RunJS (par ex.,  <br/> `await components.table1.selectAllRows()`) <br/> ou déclenchez-la via un événement. |
| deselectAllRows() | Désélectionne toutes les lignes de la table| Utilisez une requête RunJS (par ex.,  <br/> `await components.table1.deselectAllRows()`) <br/> ou déclenchez-la via un événement. |
| discardChanges()  | Annule les modifications de la table lorsqu'une cellule est modifiée. | Utilisez une requête RunJS (par ex., <br/> `await components.table1.discardChanges()`) <br/> ou déclenchez-la via un événement. |
| discardNewlyAddedRows() | Annule les lignes récemment ajoutées depuis la fenêtre modale d'ajout de nouvelle ligne de la table. | Utilisez une requête RunJS (par ex., <br/> `await components.table1.discardNewlyAddedRows()`) <br/> ou déclenchez-la via un événement. |
| downloadTableData() | Récupère les données de la table au format PDF, CSV ou Excel. | Utilisez une requête RunJS (par ex., <br/> `await components.table1.downloadTableData('pdf')`) <br/> ou déclenchez-la via un événement. |
| setFilters() | Applique des filtres aux données de la table. | Utilisez une requête RunJS (par ex., <br/> `await components.table1.setFilters ([{column:'name',condition:'contains',value: 'Sarah'}])`) <br/> ou déclenchez-la via un événement. |
| clearFilters() | Supprime tous les filtres appliqués à la table. | Utilisez une requête RunJS (par ex., <br/> `await components.table1.clearFilters()`) <br/> ou déclenchez-la via un événement. |
| setSort() | Définit de manière programmatique l'état de tri de la table par clé de colonne et par direction. Utilisez `'auto'` pour basculer automatiquement la direction du tri. | Utilisez une requête RunJS (par ex., <br/> `await components.table1.setSort('name', 'asc')`) <br/> ou déclenchez-la via un événement. |

## Exposed variables

| Variable             | Description |
| :------------------- | :---------- |
| currentData          | Données actuellement affichées par la table (y compris les modifications éventuelles). |
| currentPageData      | Données affichées sur la page actuelle si la pagination est activée (y compris les modifications éventuelles). |
| pageIndex            | Index de la page actuelle, commençant à 1. |
| changeSet            | Objet ayant le numéro de ligne comme clé et un objet des champs modifiés et de leurs valeurs comme valeur. |
| dataUpdates          | Similaire à `changeSet`, mais `dataUpdates` inclut les données de la ligne entière en cours de modification. |
| selectedRow          | Contient les données de la ligne la plus récemment cliquée. Lorsqu'un bouton d'action est cliqué, `selectedRow` est également mis à jour. Sa valeur initiale correspond aux données de la première ligne au chargement de l'application. |
| selectedRowId        | Stocke l'ID de la dernière ligne cliquée. Comme `selectedRow`, elle est mise à jour lorsqu'un bouton d'action est cliqué. Vous pouvez accéder à sa valeur avec `{{components.table1.selectedRowId}}`. Par défaut, elle est définie sur `0`, représentant l'ID de la première ligne au chargement de l'application. |
| selectedCell         | Les données de la dernière cellule cliquée sur la table. |
| searchText           | La valeur du champ de recherche si la pagination côté serveur est activée. |
| newRows              | La variable newRows stocke un tableau d'objets, chacun contenant les données d'une ligne ajoutée à la table via le bouton "Add new row". Lorsque l'utilisateur clique sur le bouton "Save" ou "Discard" dans la fenêtre modale, ces données sont effacées. |
| lastExpandedRow      | L'index de la ligne la plus récemment développée. Mis à jour chaque fois qu'une ligne est développée. Renseigné uniquement lorsque **Enable expandable rows** est activé. |
| currentExpandedRows  | Un tableau des index de lignes actuellement développées. Mis à jour à chaque action de développement ou de réduction. Renseigné uniquement lorsque **Enable expandable rows** est activé. |
| selectedColumnHeader | Un objet mis à jour lorsqu'un en-tête de colonne est cliqué. Contient trois champs : `key` (la clé de données de la colonne), `name` (le nom d'affichage de la colonne) et `index` (la position de la colonne depuis la gauche). Mis à jour avant le déclenchement de l'événement **Header clicked**. |

Si les données d'une cellule sont modifiées, la propriété `changeSet` de l'objet Table contiendra l'index de la ligne et le champ modifié.

Avec `changeSet`, la propriété `dataUpdates` sera également modifiée lorsque la valeur d'une cellule change. `dataUpdates` contiendra l'ensemble des données de l'index modifié depuis les données de la Table.

Si les données d'une cellule sont modifiées, le bouton **Save changes** s'affichera en bas de la Table. Ce bouton, lorsqu'il est cliqué, déclenchera l'événement `Bulk update query`. Cet événement peut être utilisé pour exécuter une requête afin de mettre à jour les données de votre source de données.

