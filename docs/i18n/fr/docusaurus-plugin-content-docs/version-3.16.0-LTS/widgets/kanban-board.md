---
id: kanban
title: Kanban
---

Le composant **Kanban** vous permet d'organiser et de prioriser visuellement vos tâches avec un workflow transparent. Vous pouvez définir le nombre de colonnes à afficher, activer/désactiver le bouton d'ajout de cartes, et lier des données aux cartes.

:::info Composants restreints
Certains composants ne peuvent pas être placés dans la **Card** et le **Popout** du composant **Kanban**.

- **Card** : Calendar, Kanban, Form, Tabs, Modal, ListView, Container
- **Popout** : Calendar, Kanban
  :::

## Définir les données des cartes

Pour peupler dynamiquement les cartes du Kanban, vous pouvez utiliser la clé `cardData`.

Par exemple, vous pouvez définir la propriété `Data` d'un composant Text sur une carte en utilisant le code ci-dessous :

```js
{
  {
    cardData.title;
  }
}
// Remplacez title par la clé de vos données
```

## Propriétés

:::info

- Il est obligatoire de fournir un `id` pour chaque colonne dans le champ `column data`. L'`id` peut être de type `string` ou `number`.
- Il est obligatoire de fournir un `id` et un `columnId` pour chaque carte dans le champ `Card data`. `id` et `columnId` peuvent tous deux être de type `string` ou `number`.
  :::

| <div style={{ width:"100px"}}> Propriétés </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Column data | Saisissez les données des colonnes - `id` et `title` sous forme de tableau d'objets ou depuis une requête qui retourne un tableau d'objets.           | `{{[{ "id": "c1", "title": "to do" },{ "id": "c2", "title": "in progress" },{ "id": "c3", "title": "Completed" }]}}` ou `{{queries.xyz.data}}`. |
| Card data | Saisissez les données des cartes - `id`, `title` et `columnId` sous forme de tableau d'objets ou depuis une requête qui retourne un tableau d'objets. | `{{[{ id: "r1", title: "Title 1", description: "Description 1", columnId: "c1" },{ id: "r2", title: "Title 2", description: "Description 2", columnId: "c2" },{ id: "r3", title: "Title 3", description: "Description 3",columnId: "c3" }]}}` ou `{{queries.abc.data}}`. |
| Card width | Définit la largeur de la carte. | Cette propriété attend une valeur numérique. Par défaut, la valeur est définie sur `{{302}}`. |
| Card height | Définit la hauteur de la carte. | Cette propriété attend une valeur numérique. Par défaut, la valeur est définie sur `{{100}}`. |
| Enable add card | Cette propriété vous permet d'afficher ou de masquer le bouton **+Add Cards** sur le Kanban. | Activé par défaut, vous pouvez définir la valeur de manière programmatique sur `{{true}}` ou `{{false}}` pour activer/désactiver le bouton en cliquant sur **fx** à côté. |
| Show delete button | Cette propriété vous permet d'afficher ou de masquer la section **Drop here to delete cards** en bas du Kanban. | Activé par défaut, vous pouvez définir la valeur de manière programmatique sur `{{true}}` ou `{{false}}` pour activer/désactiver le bouton en cliquant sur **fx** à côté. |

## Événements

Pour ajouter un événement, cliquez sur la poignée du composant afin d'ouvrir les propriétés du composant dans la barre latérale droite. Accédez à la section **Events** et cliquez sur **Add handler**.

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On Update | L'événement On update se déclenche chaque fois que les données de la carte (id, title, description ou columnID) sont mises à jour à l'aide des actions spécifiques au composant. |
| On add card click | Cet événement se déclenche chaque fois que le bouton **Add card** du Kanban est cliqué. |
| Card removed | Cet événement se déclenche chaque fois qu'une carte est **supprimée** du Kanban en la faisant glisser vers la zone de suppression en bas ou via une action spécifique au composant. |
| Card added | Cet événement se déclenche chaque fois qu'une carte est **ajoutée** au Kanban via une action spécifique au composant. |
| Card moved | Cet événement se déclenche chaque fois que la position de la carte change sur le Kanban ou via une action spécifique au composant. |
| Card selected | Cet événement se déclenche chaque fois qu'une carte est cliquée pour ouvrir le modal. |

Comme pour tout autre événement dans ToolJet, vous pouvez définir plusieurs gestionnaires pour l'un des événements mentionnés ci-dessus.

:::info
Consultez la documentation de la **[Référence des actions](/docs/actions/run-query)** pour obtenir des informations détaillées sur toutes les **Actions**.

Consultez les **[Actions spécifiques au composant](#component-specific-actions-csa)** disponibles pour Kanban.
:::

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| updatedCardData | La variable `updatedCardData` contiendra les dernières valeurs de toutes les cartes du Kanban. Cette variable n'aura aucune valeur. | Elle n'aura des valeurs que lorsqu'une action est effectuée sur l'une des cartes, comme lorsque la carte est déplacée, ajoutée, supprimée ou mise à jour. |
| lastAddedCard | La variable `lastAddedCard` contient les valeurs de la dernière carte ajoutée. Elle contient les données suivantes - `id`, `title`, `description` et `columnId` de la dernière carte ajoutée. | Obtenez les valeurs en utilisant `{{components.kanban1.lastAddedCard.title}}`. |
| lastRemovedCard | La variable `lastRemovedCard` contient les propriétés de la carte qui a été récemment supprimée du Kanban. Elle contient les données suivantes - `id`, `title`, `description` et `columnId` de la carte récemment supprimée. | Obtenez les valeurs en utilisant `{{components.kanbanboard1.lastRemovedCard.title}}`. |
| lastCardMovement | La variable `lastCardMovement` contient les propriétés de la carte qui a été récemment déplacée de sa position d'origine. Elle contient les données suivantes - `originColumnId`, `destinationColumnId`, `originCardIndex`, `destinationCardIndex` et un objet `cardDetails` qui inclut `id`, `title`, `description` et `columnId` de la carte déplacée. | Obtenez les valeurs en utilisant `{{components.kanbanboard1.lastCardMovement.cardDetails.title}}` ou `{{components.kanbanboard1.lastCardMovement.destinationCardIndex}}`. |
| lastSelectedCard | La variable `lastSelectedCard` contient les valeurs `id`, `title`, `columnId` et `description` de la dernière carte sélectionnée (cliquée pour affichage) sur le Kanban. | Obtenez les valeurs en utilisant `{{components.kanban1.lastSelectedCard.columnId}}`. |
| lastUpdatedCard | La variable `lastUpdatedCard` contient les valeurs `id`, `title`, `description` et `columnId` de la dernière carte mise à jour (via une action spécifique au composant). | Obtenez les valeurs en utilisant `{{components.kanban1.lastUpdatedCard.columnId}}`. |
| lastCardUpdate | La variable `lastCardUpdate` contient les anciennes et nouvelles valeurs de la propriété qui a été modifiée dans la carte (via une action spécifique au composant). | Obtenez les valeurs en utilisant `{{components.kanban1.lastCardUpdate[0].title.oldValue}}`. |

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant Kanban peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| updateCardData | Mettez à jour les données de la carte du composant Kanban via une action spécifique au composant dans n'importe quel gestionnaire d'événement. | Utilisez une requête RunJS pour exécuter des actions spécifiques au composant telles que `components.kanban1.updateCardData('c1', {title: 'New Title'})`. |
| moveCard | Déplacez une carte d'une colonne à une autre sur le kanban via une action spécifique au composant dans n'importe quel gestionnaire d'événement. | Utilisez une requête RunJS pour exécuter des actions spécifiques au composant telles que `await components.kanban1.moveCard('card id,'column id')` ex : `await components.kanban1.moveCard('c1','r2')`. |
| addCard | Ajoutez une carte sur le kanban via une action spécifique au composant dans n'importe quel gestionnaire d'événement. | Utilisez une requête RunJS pour exécuter des actions spécifiques au composant telles que `await components.kanban1.addCard('c1', {title: 'New Title'})`. |
| deleteCard | Supprimez une carte du kanban via une action spécifique au composant dans n'importe quel gestionnaire d'événement. | Utilisez une requête RunJS pour exécuter des actions spécifiques au composant telles que `await components.kanban1.deleteCard('card id')` ex : `await components.kanban1.deleteCard('c2')`. | 

## Général

### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires sur un élément lorsque l'utilisateur survole le composant avec le pointeur de la souris.

Dans l'accordéon <b>General</b>, vous pouvez définir la valeur au format chaîne de caractères. Le survol du composant affichera alors cette chaîne comme infobulle.

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| Disable | Si désactivé ou défini sur `{{false}}`, le composant sera verrouillé et deviendra non fonctionnel. Par défaut, il est désactivé, c'est-à-dire que sa valeur est définie sur `{{true}}`. |
| Visibility | Ceci permet de contrôler la visibilité du composant. Si `{{false}}`/désactivé, le composant ne sera pas visible après le déploiement de l'application. Par défaut, il est activé (défini sur `{{true}}`). |
| Accent color | Vous pouvez modifier la couleur d'accentuation du titre de colonne en saisissant le code couleur Hex ou en choisissant une couleur de votre choix depuis le sélecteur de couleur. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::
