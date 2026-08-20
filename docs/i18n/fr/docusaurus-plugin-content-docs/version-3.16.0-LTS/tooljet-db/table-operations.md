---
id: table-operations
title: Opérations sur les tables
---

## Rechercher une table

Ouvrez la barre de recherche en cliquant sur le bouton **Search** et recherchez une table dans la base de données ToolJet en saisissant le nom de la table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/search-v2.png" alt="Base de données ToolJet" />

<div style={{paddingTop:'24px'}}>

## Renommer une table

Pour renommer une table, cliquez sur l'icône du menu kebab à droite du nom de la table, puis sélectionnez l'option **Edit table**. Un tiroir s'ouvrira depuis la droite d'où vous pourrez modifier le nom de la table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/edit-table-name-v2.png" alt="Base de données ToolJet" />

</div>

<div style={{paddingTop:'24px'}}>

## Ajouter une nouvelle colonne

Pour ajouter une nouvelle colonne à une table, cliquez sur l'icône du menu kebab à droite du nom de la table puis sélectionnez l'option **Add new column**, ou cliquez sur le bouton **+** présent à la fin de l'en-tête de colonne.

Un tiroir s'ouvrira depuis la droite où vous pourrez saisir les détails de la nouvelle colonne :

- **Column Name** : Saisissez un nom unique pour la nouvelle colonne, servant d'identifiant clé.
- **Data Type** : Choisissez le type de données approprié pour la colonne parmi les [options disponibles](/docs/tooljet-db/data-types#supported-data-types). Pour plus d'informations sur les types de données et leurs contraintes associées, consultez les sections [Types de données pris en charge](/docs/tooljet-db/data-types#supported-data-types) et [Contraintes autorisées par type de données](/docs/tooljet-db/data-types#permissible-constraints-per-data-type).
- **Default Value** : Spécifiez toute valeur par défaut devant être attribuée à la colonne. Ce champ peut éventuellement être laissé vide. Lorsqu'une table contient des lignes et que NOT NULL est appliqué à une de ses colonnes existantes ou nouvelles, spécifier une valeur par défaut devient obligatoire.
- **Foreign Key Relation** : Cliquez sur le bouton pour ajouter une relation de clé étrangère à la colonne. Cela ouvrira un menu où vous pourrez sélectionner la table et la colonne cibles à référencer.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/add-new-column-v2.gif" alt="Base de données ToolJet"/>

</div>

<div style={{paddingTop:'24px'}}>

## Exporter le schéma

L'option d'exportation du schéma vous permet de télécharger le schéma de la table sélectionnée dans un fichier JSON. Cela n'exporte pas les données de la table ni les relations.<br/>
Lors de l'exportation de l'application, vous pouvez choisir d'exporter l'application avec ou sans schéma de table connecté à l'application.<br/>
Pour exporter le schéma de la table, cliquez sur l'icône à trois points verticaux à droite du nom de la table, puis cliquez sur l'option **Export**. Un fichier JSON contenant le schéma de la table sera téléchargé.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/export-schema-v2.png" alt="Base de données ToolJet" />

</div>

<div style={{paddingTop:'24px'}}>

## Supprimer une table

Pour supprimer une table, cliquez sur l'icône à trois points verticaux à droite du nom de la table, puis cliquez sur l'option **Delete**. Une fenêtre de confirmation apparaîtra ; cliquez sur le bouton **Delete** pour supprimer la table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/delete-table-v2.png" alt="Base de données ToolJet" />

</div>

<div style={{paddingTop:'24px'}}>

## Modifier une colonne

Pour modifier une colonne, cliquez sur le menu kebab sur le nom de la colonne et sélectionnez l'option **Edit column**. Lorsque vous modifiez la colonne, le type de données ne peut pas être changé.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/edit-column-v2.png" alt="Base de données ToolJet" />

</div>

<div style={{paddingTop:'24px'}}>

## Supprimer une colonne

Pour supprimer une colonne, cliquez sur le menu kebab sur le nom de la colonne et sélectionnez l'option **Delete**. Vous ne pouvez pas supprimer une colonne si elle est utilisée comme clé primaire. Vous devrez d'abord retirer la contrainte de clé primaire de la colonne avant de la supprimer.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/delete-column-v2.png" alt="Base de données ToolJet" />

</div>
