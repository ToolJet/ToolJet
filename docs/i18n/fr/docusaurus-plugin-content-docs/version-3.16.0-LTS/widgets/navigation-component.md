---
id: navigation
title: Navigation
---

Le composant **Navigation** vous permet de créer des menus de navigation personnalisés avec une orientation horizontale ou verticale. Les éléments de menu peuvent être organisés en groupes et configurés avec des icônes, des libellés et des règles de visibilité. Il convient bien à des scénarios tels qu'une barre de navigation supérieure sur les pages d'un outil interne, une barre latérale pour un tableau de bord d'administration, ou un menu de navigation inférieur dans une application mobile.

## Content

La section **Content** liste les entrées de navigation affichées dans le composant.

### Ajouter des éléments et des groupes

Cliquez sur **+ New menu item** pour ouvrir une liste déroulante avec deux options : **Add new menu item** pour ajouter une entrée autonome, ou **Add new group** pour ajouter un groupe pouvant contenir des éléments enfants. Les éléments et les groupes peuvent être réorganisés par glisser-déposer.

### Propriétés de l'élément

Cliquez sur n'importe quel élément ou groupe pour ouvrir ses paramètres :

| Propriété | Description | Valeur attendue |
| :------- | :---------- | :------------- |
| Label | Texte affiché pour l'élément de menu. | Chaîne de caractères (par ex., `Dashboard`). Prend en charge les expressions `{{`. |
| Icon | Icône affichée à côté du libellé. | Nom d'icône (par ex., `IconArchive`). Basculez la visibilité de l'icône avec l'icône en forme d'œil. |
| Hide this item | Masque l'élément de la navigation rendue. | Activez/désactivez le bouton bascule ou cliquez sur **fx** pour saisir une expression logique. |
| Disable item | Empêche l'interaction avec l'élément. | Activez/désactivez le bouton bascule ou cliquez sur **fx** pour saisir une expression logique. |

Les groupes partagent les mêmes propriétés et contiennent en plus des éléments enfants qui peuvent être ajoutés depuis les paramètres du groupe.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Orientation | Définit la direction de la mise en page du menu. | `Horizontal` ou `Vertical`. |
| Style | Contrôle ce que chaque élément de nav affiche. | `Text and icon`, `Text only`, ou `Icon only`. |
| Nav item size | Détermine comment les éléments occupent la largeur disponible. | `Auto` ajuste les éléments à leur contenu ; `Equal width` répartit l'espace uniformément. |
| Alignment | Alignement horizontal des éléments dans la navigation. | `Left`, `Center`, ou `Right`. |

## Événements

| Événement | Description |
| :---- | :---------- |
| On click | Se déclenche lorsque l'utilisateur clique sur un élément de navigation. |

:::info
Consultez la documentation de la **[Référence des actions](/docs/actions/run-query)** pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant Navigation peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA). Vous pouvez les déclencher via un événement ou une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Comment y accéder </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setVisibility() | Définit la visibilité du composant. | `components.navigation1.setVisibility(false)` |
| setDisable() | Active ou désactive le composant. | `components.navigation1.setDisable(true)` |
| setLoading() | Définit l'état de chargement du composant. | `components.navigation1.setLoading(true)` |
| selectItem() | Sélectionne un élément de menu de manière programmatique par son ID. | `components.navigation1.selectItem('item1')` |

## Variables exposées

| <div style={{ width:"130px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | Comment y accéder |
| :--------------------------------------------- | :------------------------------------------------ | :------------ |
| selectedItem | L'objet de l'élément de navigation actuellement sélectionné. | `{{components.navigation1.selectedItem}}` |
| previousSelectedItem | L'objet de l'élément de navigation précédemment sélectionné. | `{{components.navigation1.previousSelectedItem}}` |
| isVisible | Indique si le composant est visible. | `{{components.navigation1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.navigation1.isDisabled}}` |
| isLoading | Indique si le composant est en cours de chargement. | `{{components.navigation1.isLoading}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement sur le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |


## Styles

### Nav menu item

| <div style={{ width:"150px"}}> Propriété </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Couleur du libellé pour les éléments non sélectionnés. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Icon | Couleur de l'icône pour les éléments non sélectionnés. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Hover pill background | Couleur de fond de la pastille lorsqu'un élément est survolé. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Selected text | Couleur du libellé pour l'élément actif/sélectionné. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Selected icon | Couleur de l'icône pour l'élément actif/sélectionné. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Selected pill background | Couleur de fond de la pastille pour l'élément actif/sélectionné. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Pill border radius | Rayon d'angle de la pastille de sélection. | Saisissez un nombre (par défaut : `6`) ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique une valeur numérique. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Couleur de fond du conteneur de navigation. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Border | Couleur de bordure du conteneur de navigation. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Border radius | Rayon d'angle du conteneur de navigation. | Saisissez un nombre (par défaut : `8`) ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique une valeur numérique. |
| Padding | Espacement interne du conteneur de navigation. | Saisissez un nombre (par défaut : `8`) ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique une valeur numérique. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::
