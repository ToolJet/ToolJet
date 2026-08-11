---
id: table-properties
title: Table Properties
slug: /widgets/table/
---

Le composant **Table** affiche et gère des données, en se connectant facilement aux bases de données et aux API. Il permet aux utilisateurs de consulter et de modifier des données directement dans la table. Ce document passe en revue toutes les propriétés liées au composant **Table**.

<img className="screenshot-full img-full" src="/img/widgets/table/table-preview-v3.png" alt="ToolJet - Component Reference - Table Preview" />

## Data

Pour peupler le composant **Table** avec des données, vous devez fournir les données sous forme d'un tableau d'objets dans sa propriété **Data**. Vous pouvez utiliser les données d'une requête en y faisant référence pour peupler la **Table**.

Le composant **Table** **génère automatiquement toutes les colonnes nécessaires** lorsque les données sont fournies. La **Table** charge également un niveau de **données imbriquées**.

Exemple - Passage d'un tableau :

```js
{
  {
    [
      {
        id: 1,
        name: "Sarah",
        email: "sarah@example.com",
        contact: { number: 8881212, address: "25, Huntley Road, Newark" },
      },
    ];
  }
}
```

Exemple - Passage des données d'une requête :

```js
{
  {
    queries.restapi1.data;
  }
}
//remplacez restapi1 par le nom de votre requête
```

## Columns

Consultez le guide **[Table Columns](/docs/widgets/table/table-columns)** pour en savoir plus sur les types de colonnes pris en charge.

## Action Buttons (Deprecated)

:::warning
**Les Action Buttons sont obsolètes** et pourraient être supprimés dans une prochaine version. Il est recommandé d'utiliser plutôt le **[type de colonne Button](/docs/widgets/table/table-columns#button)**, qui prend en charge plusieurs colonnes de boutons, des icônes, des infobulles, des états de chargement, et une visibilité conditionnelle par ligne.
:::

<img className="screenshot-full img-full" src="/img/widgets/table/action-v3.png" alt="ToolJet - Component Reference - Actions" />

<br/><br/>

Les boutons d'action sont positionnés dans la dernière colonne de la Table. L'apparence de ces boutons peut être personnalisée, et des actions spécifiques peuvent être définies pour leur clic à l'aide de l'action `On click`. Lorsqu'un bouton d'action est cliqué, la variable exposée `selectedRow` de la Table est mise à jour pour refléter les données de la ligne sélectionnée.

Voici les propriétés de texte de bouton que vous pouvez définir.

| <div style={{ width:"170px"}}> Propriété </div> | Description                                                                                                                                                                                                                                                   |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button text                                    | Définit le texte que vous souhaitez afficher sur le bouton d'action.                                                                                                                                                                                             |
| Button position                                | Définit la position du bouton, à gauche ou à droite.                                                                                                                                                                                                                    |
| Background color                               | Définit la couleur de fond du bouton d'action.                                                                                                                                                                                                               |
| Text color                                     | Définit la couleur du texte du bouton d'action.                                                                                                                                                                                                           |
| Disable Action Button                          | Activez pour désactiver le bouton d'action. Vous pouvez définir sa valeur de manière programmatique en cliquant sur le bouton **fx** à côté ; si elle est définie sur `{{true}}`, le bouton d'action sera désactivé et deviendra non fonctionnel. Par défaut, sa valeur est définie sur `{{false}}`. |
| New event handler                              | Le bouton **New event handler** vous permet de créer un gestionnaire d'événement pour définir le comportement des boutons d'action selon l'action `On click`.                                                                                                                       |

## Events

| <div style={{ width:"150px"}}> Event </div> | Description                                                                                                                                                                                                     |
| :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row hovered                                 | Cet événement s'active lorsque le pointeur de la souris survole une ligne. La variable `hoveredRowId` capture l'ID de la ligne survolée, et la variable `hoveredRow` stocke les données de la ligne au format objet.         |
| Row clicked                                 | Cet événement se déclenche lorsqu'une ligne de la Table est cliquée. Les variables exposées `selectedRowId` et `selectedRow` de la Table stockent respectivement l'ID et les données de la ligne sélectionnée.                              |
| Save changes                                | Si une cellule de la Table est modifiée, le bouton **Save changes** apparaît en bas de la Table. L'événement Save changes se déclenche lorsque ce bouton est cliqué.                                                |
| Page changed                                | Si la pagination côté serveur est activée, cet événement se déclenche lors du changement de page actuelle. L'événement Page changed se déclenche après la mise à jour de la variable `pageIndex`.                                            |
| Next page                                   | Se déclenche spécifiquement lorsque l'utilisateur navigue vers la page **suivante**. Utilisez cet événement plutôt que **Page changed** lorsque vous devez distinguer la navigation avant de la navigation arrière dans la pagination côté serveur.        |
| Previous page                               | Se déclenche spécifiquement lorsque l'utilisateur navigue vers la page **précédente**. Utilisez cet événement plutôt que **Page changed** lorsque vous devez distinguer la navigation arrière de la navigation avant dans la pagination côté serveur.    |
| Search                                      | L'événement Search se déclenche lorsqu'un texte est saisi dans le champ de recherche de la Table. La variable `searchText` est mise à jour avant le déclenchement de cet événement.                                                           |
| Cancel changes                              | Si une cellule de la Table est modifiée, le bouton **Discard changes** apparaît en bas de la Table. L'événement Cancel changes se déclenche lorsque ce bouton est cliqué.                                           |
| Sort applied                                | Cet événement se déclenche lorsque l'en-tête de nom de colonne est cliqué pour appliquer un tri. La variable `sortApplied` est mise à jour avec un objet contenant les valeurs `column` et `direction`.                                   |
| Cell value changed                          | Si une cellule de la Table est modifiée, l'événement cell value changed se déclenche.                                                                                                                                  |
| Filter changed                              | Se déclenche lorsqu'un filtre est ajouté, supprimé ou modifié. La variable `filters` de la Table est mise à jour pour refléter l'état des filtres appliqués. Les objets auront les propriétés : `condition`, `value`, et `column`. |
| Add new rows                                | Se déclenche lorsque le bouton **Save** est cliqué depuis la fenêtre modale d'ajout de nouvelle ligne.                                                                                                                                       |
| Row expanded                                | Se déclenche lorsqu'une ligne est développée. Les variables exposées `lastExpandedRow` et `currentExpandedRows` sont mises à jour avant le déclenchement de cet événement.                                                                            |
| Refresh                                     | Se déclenche lorsque le bouton d'actualisation est cliqué. Si la propriété **Data** de la Table est liée à une requête, cette requête est d'abord réexécutée ; l'événement se déclenche une fois qu'elle est terminée. Si les données proviennent d'une variable ou d'une autre source, l'événement se déclenche immédiatement — utilisez-le pour exécuter une logique personnalisée ou mettre à jour manuellement la source de données. |
| Header clicked                              | Se déclenche lorsqu'un en-tête de colonne est cliqué. La variable exposée `selectedColumnHeader` est mise à jour avec la `key`, le `name`, et l'`index` de la colonne cliquée avant le déclenchement de cet événement.                                     |

## Row Selection

| <div style={{ width:"200px"}}> Propriété </div> | Description                                                                                                                                       |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Allow selection                                | Active la sélection de lignes via des cases à cocher. La désactiver retire la mise en surbrillance des lignes et les options de sélection en masse.                                         |
| Highlight selected row                         | Met en surbrillance la dernière ligne cliquée. Remplace la sélection par case à cocher par une mise en surbrillance visuelle.                                                               |
| Disable row deselection                        | Lorsque cette option est activée, cliquer à nouveau sur une ligne sélectionnée ne la **désélectionnera pas**. L'utilisateur peut toujours la désélectionner via la case à cocher. Si la sélection multiple est désactivée, sélectionner une nouvelle ligne désélectionnera la précédente. |
| Bulk selection                                 | Permet de sélectionner plusieurs lignes sur la page actuelle. Les valeurs sélectionnées sont stockées dans la variable selectedRows.                                      |
| Default selected row                           | Pré-sélectionne une ligne lorsque Allow selection est activé. Utilisez un objet clé-valeur comme `{"id": variables.x}` où x est une variable valide renvoyant l'ID. |
| Select row on cell edit                        | Sélectionne automatiquement la ligne en cours de modification si la colonne est modifiable. Désactivez pour empêcher la sélection automatique pendant l'édition.                               |

## Expandable Rows

Les lignes développables permettent aux utilisateurs finaux de révéler du contenu supplémentaire sous une ligne — comme une table imbriquée, un formulaire, ou une vue détaillée — sans quitter la page actuelle.

| <div style={{ width:"170px"}}> Propriété </div> | Description                                                                                                                                 |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| Enable expandable rows                         | Active ou désactive les lignes développables. Lorsque cette option est activée, chaque ligne affiche une icône chevron sur laquelle l'utilisateur peut cliquer pour développer ou réduire la ligne.       |
| Expansion height                               | Définit la hauteur (en pixels) de la zone de contenu développée. Par défaut : 300 px.                                                               |

Lorsqu'une ligne est développée, vous pouvez faire glisser des composants dans le conteneur développé depuis le panneau de composants. Tous les composants à l'intérieur de la zone développée ont accès à **`rowData`** — une variable résolvable qui contient les données de la ligne à laquelle ils appartiennent, similaire à `listItem` dans une List View.

**Variables exposées mises à jour lors du développement :**

| Variable             | Description                                                                    |
| :------------------- | :----------------------------------------------------------------------------- |
| `lastExpandedRow`    | L'index de la ligne la plus récemment développée.                                   |
| `currentExpandedRows` | Un tableau des index de toutes les lignes actuellement développées.                            |

Utilisez l'événement **Row expanded** pour exécuter une requête ou déclencher une action chaque fois qu'une ligne est développée.

## Search, Sort and Filter

<img className="screenshot-full img-s" src="/img/widgets/table/searchsort-v2.png" alt="ToolJet - Component Reference - Table" />

### Show search

La propriété Show search contrôle le champ de recherche de la Table. La recherche côté client est activée par défaut, et la recherche côté serveur peut être activée depuis la section événements de l'inspecteur. Chaque fois que le texte de recherche change, la variable exposée `searchText` du composant Table est mise à jour.

#### Server-side search

Si la recherche côté serveur est activée, l'événement `Search` se déclenche après la modification du contenu de la variable `searchText`. `searchText` peut être utilisée pour exécuter une requête spécifique afin de rechercher des enregistrements dans votre source de données.

### Enable column sorting

Désactivez cette option pour verrouiller le tri des colonnes lorsque les utilisateurs cliquent sur l'en-tête de colonne.

#### Server-side sort

Lorsque le tri côté serveur est activé, cliquer sur les en-têtes de colonnes ne triera pas automatiquement la table ; à la place, l'événement `Sort applied` se déclenchera et le tri appliqué sera accessible dans la variable exposée `sortApplied`. Cette information peut être utilisée pour exécuter des requêtes qui mettent à jour le contenu de la table en fonction du tri spécifié.

### Enable filtering

Le bouton de filtre dans l'en-tête de la Table est visible par défaut. Vous pouvez choisir de le masquer en désactivant cette option.

Les données de la Table peuvent être filtrées à l'aide de l'option Filter data en haut à gauche. Vous avez la possibilité de choisir parmi divers filtres, tels que :

- **contains**
- **does not contain**
- **matches**
- **does not match**
- **equals**
- **does not equal**
- **is empty**
- **is not empty**
- **greater than**
- **greater than or equal to**
- **less than**
- **less than or equal to**

#### Server-side filter

Lorsque le filtre côté serveur est activé, l'application de filtres ne filtrera pas automatiquement la table ; à la place, l'événement `Filter changed` se déclenchera et les filtres appliqués seront accessibles dans la variable exposée `filters`. Ces données peuvent être utilisées pour exécuter des requêtes qui mettent à jour le contenu de la table selon les filtres appliqués.

## Pagination

La pagination aide à gérer l'affichage de grands ensembles de données en les divisant en segments gérables. La pagination côté client est activée par défaut. Lorsqu'elle est activée, une propriété supplémentaire, **Number of rows per page**, devient disponible pour définir le nombre d'enregistrements par page. La valeur par défaut est 10 ; si elle est désactivée, tous les enregistrements apparaîtront sur une seule page.

Le pied de page de pagination affiche toujours les boutons **First**, **Previous**, **Next**, et **Last** directement dans le pied de la table — plus besoin de chercher dans des menus déroulants.

#### Server-side pagination

La pagination côté serveur peut être utilisée pour exécuter une requête chaque fois que la page change. Dans la section événements, vous pouvez utiliser l'événement `Page changed` pour exécuter une requête avec la variable exposée `pageIndex`. `pageIndex` peut être utilisée pour interroger le prochain ensemble de résultats lorsque la page change. Utilisez les événements **Next page** et **Previous page** lorsque vous devez distinguer le sens de la navigation.

Lorsque la pagination côté serveur est activée, vous pourrez définir les propriétés supplémentaires suivantes de la Table :

- **Enable previous page button** : désactivez cette option pour désactiver le bouton de page précédente de la Table.
- **Enable next page button** : désactivez cette option pour désactiver le bouton de page suivante de la Table.
- **Total records server side** : définit le nombre total d'enregistrements sur le serveur. Utilisé pour calculer le nombre de pages.
- **Server-side rows per page** : définit le nombre d'enregistrements récupérés par page depuis le serveur. Lorsque cette valeur et **Total records server side** sont toutes deux fournies, la Table calcule et affiche le nombre total de pages et active la navigation vers les pages **First** et **Last**.

:::tip
Consultez ce guide pratique pour en savoir plus sur la **[pagination côté serveur](/docs/widgets/table/serverside-operations/pagination)**.
:::

## Additional Actions

| <div style={{ width:"210px"}}> Propriété </div> | Description                                                                                                                                                                                                  |
| :--------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Show add new row button                        | Affiche un bouton pour ajouter de nouvelles lignes via une fenêtre modale. Les nouvelles données sont stockées dans `newRows`. Utilisez l'événement `Add new rows` pour les enregistrer dans une source de données.                                                                          |
| Show download button                           | Active le téléchargement des données de la Table au format CSV, Excel ou PDF. Format du nom de fichier : `Tablename_DD-MM-YYYY_HH-mm.filetype`.                                                                                                |
| Show refresh button                            | Affiche une icône d'actualisation dans le pied de la table. Si la propriété **Data** de la Table est liée à une requête, cliquer sur le bouton réexécute cette requête. Si les données proviennent d'une variable ou d'une autre source, aucune requête n'est réexécutée — utilisez plutôt l'événement **Refresh** pour exécuter une logique de mise à jour personnalisée. Un indicateur de chargement s'affiche pendant qu'une requête est en cours. |
| Hide column selector button                    | Contrôle la visibilité du sélecteur de colonnes, qui permet aux utilisateurs de choisir les colonnes visibles.                                                                                                                         |
| Loading state                                  | Affiche un squelette de chargement pendant le chargement des données. Liez-le à la propriété `isLoading` de la requête.                                                                                                                 |
| Show update buttons                            | Affiche les boutons **Save changes** et **Discard changes** lorsqu'une cellule est modifiée.                                                                                                                           |
| Visibility                                     | Contrôle si la Table est visible sur le canevas. Peut être basculé dynamiquement.                                                                                                                             |
| Disable                                        | Désactive l'interactivité de la Table lorsqu'elle est désactivée. Toujours visible mais non utilisable.                                                                                                                          |
| Dynamic height                                 | Ajuste automatiquement la hauteur du composant selon son contenu.                                                                                                                                           |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Column Header

| <div style={{ width:"105px"}}> Style Property </div> | Description                                 | Configuration Options                             |
| :--------------------------------------------------- | :------------------------------------------ | :------------------------------------------------ |
| Column title                                         | Définit la couleur du titre de colonne.             | Sélectionnez un thème ou choisissez une couleur dans le sélecteur de couleurs. |
| Overflow                                             | Sélectionne le type de débordement.                   | Choisissez entre **None** ou **Wrap**.                 |
| Header casing                                        | Sélectionne le type de casse de l'en-tête.              | Choisissez entre **As typed** ou **AA**.               |
| Background                                           | Définit la couleur de fond de l'en-tête de colonne. | Sélectionnez un thème ou choisissez une couleur dans le sélecteur de couleurs. |

### Data

| <div style={{ width:"160px"}}> Style Property </div> | Description                                                                             | Configuration Options                                            |
| :--------------------------------------------------- | :-------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| Text                                                 | Définit la couleur du texte du composant.                                                    | Sélectionnez un thème ou choisissez une couleur dans le sélecteur de couleurs.                |
| Row style                                            | Sélectionne le style des lignes de la table.                                                    | Choisissez dans la liste déroulante : **Bordered**, **Regular**, ou **Striped**. |
| Cell height                                          | Détermine la taille des cellules de la table.                                                 | Choisissez entre la taille **Condensed** ou **Regular**.                |
| Max row height                                       | Contrôle la hauteur maximale des lignes lorsque **Content wrap** est activé.                   | Sélectionnez **Auto** ou définissez une taille **Custom**.                     |
| Selected row color                                   | Définit la couleur de surbrillance de la ligne sélectionnée. Remplace la surbrillance de sélection par défaut. | Sélectionnez un thème ou choisissez une couleur dans le sélecteur de couleurs.                |
| Action button radius                                 | Définit le rayon pour tous les boutons d'action.                                                 | Saisissez une valeur (par défaut : **0**).                                |

:::note
Pour **Custom Max Row Height**, la valeur minimale dépend du paramètre Cell height :

- Lorsque **Cell Height** est réglé sur **Regular**, la hauteur minimale est de **45 px**.
- Lorsque **Cell Height** est réglé sur **Condensed**, la hauteur minimale est de **39 px**.
  :::

### Container

| <div style={{ width:"110px"}}> Style Property </div> | Description                                      | Configuration Options                                                                         |
| :--------------------------------------------------- | :----------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| Background                                           | Définit la couleur de fond de la table.          | Sélectionnez un thème ou choisissez une couleur dans le sélecteur de couleurs.                                             |
| Border radius                                        | Ajoute un rayon aux bordures de la table.       | Saisissez une valeur (par défaut : **6**).                                                             |
| Border                                               | Définit la couleur de bordure de la Table.           | Sélectionnez un thème ou choisissez une couleur dans le sélecteur de couleurs.                                             |
| Box shadow                                           | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre, ajustez les propriétés associées, ou définissez-la de manière programmatique avec **fx**. |
| Padding                                              | Définit l'espacement intérieur de la table.                       | Choisissez entre **Default** ou **None**.                                                       |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
