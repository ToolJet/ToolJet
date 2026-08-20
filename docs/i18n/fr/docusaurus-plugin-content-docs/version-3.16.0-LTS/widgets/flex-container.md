---
id: flex-container
title: Flex Container
---

:::warning BETA
Flex Container est actuellement en version bêta et n'est pas recommandé pour un usage en production.
:::

Le **Flex Container** est un composant de mise en page qui organise les composants placés à l'intérieur en utilisant le flexbox CSS au lieu de la grille fixe de ToolJet. Les composants peuvent être disposés en ligne ou en colonne, avec un contrôle sur l'espacement, le retour à la ligne et l'alignement, et ils se réorganisent automatiquement lorsque des composants sont ajoutés, supprimés, redimensionnés ou réordonnés.

## Layout

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :-------------------------------------------------- | :---------------------------------------------------- |
| Direction | Définit l'axe principal de la mise en page flex. `row` dispose les enfants de gauche à droite, `column` les dispose de haut en bas. | Cliquez sur `row` ou `column`. Par défaut : `row`. |
| Justify | Aligne les enfants sur l'**axe principal** (l'axe défini par Direction). | Cliquez sur `flex-start`, `center` ou `flex-end`. Par défaut : `flex-start`. |
| Align | Aligne les enfants sur l'**axe transversal** (perpendiculaire à Direction). | Cliquez sur `flex-start`, `center` ou `flex-end`. Par défaut : `flex-start`. |
| Gap (px) | Définit l'espacement entre les composants enfants. | Saisissez un nombre ou cliquez sur **fx** pour saisir un nombre de manière programmatique via du code. Par défaut : `12`. |
| Padding (px) | Définit l'espacement interne entre les bords du conteneur et ses enfants. | Saisissez un nombre ou cliquez sur **fx** pour saisir un nombre de manière programmatique via du code. Par défaut : `12`. |
| Allow wrapping | Lorsque cette option est activée, les enfants qui ne rentrent pas sur l'axe principal passent à une nouvelle ligne au lieu de dépasser. Lorsqu'elle est désactivée, le conteneur défile le long de l'axe principal. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. Par défaut : `{{true}}`. |
| Stack below | Force la mise en page à passer à une direction `column` (avec le retour à la ligne désactivé) dès que la largeur du canevas de l'application descend au niveau ou en dessous du point de rupture sélectionné, afin que les enfants s'empilent verticalement sur les écrans plus petits. | Sélectionnez `No stacking`, `Mobile (375px)`, `Tablet (768px)`, ou `Desktop (1440px)`. Par défaut : `No stacking`. |

:::info
**Stack below** se compare à la largeur du canevas principal de l'application, et non à la largeur du Flex Container lui-même. Pour un Flex Container imbriqué dans un autre conteneur, la même largeur de canevas principal est utilisée pour décider quand empiler.
:::

### Child width

Lorsqu'un composant placé à l'intérieur d'un Flex Container est sélectionné, une option **Width** apparaît dans son panneau de propriétés, au-dessus de la section **Additional Actions** :

| <div style={{ width:"100px"}}> Option </div> | <div style={{ width:"200px"}}> Description </div> |
| :--------------------------------------------- | :-------------------------------------------------- |
| Fill parent | La largeur du composant s'étire pour remplir l'espace disponible à l'intérieur du Flex Container. Il s'agit du comportement par défaut. |
| Fixed | Le composant reçoit une largeur fixe, en pixels, qui ne change pas lorsque le Flex Container est redimensionné. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), vous pouvez les déclencher via un événement ou utiliser une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setVisibility()| Définit la visibilité du composant.     | `components.flexcontainer1.setVisibility(false)` |
| setLoading()   | Définit l'état de chargement du composant.  | `components.flexcontainer1.setLoading(true)` |
| setDisable()   | Désactive le composant.                   | `components.flexcontainer1.setDisable(true)` |

## Variables exposées

| Variable | Description | Comment y accéder |
|:--------|:-----------|:------------|
| isLoading | Indique si le composant est en cours de chargement. | `{{components.flexcontainer1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.flexcontainer1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.flexcontainer1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Active un indicateur de chargement, souvent utilisé avec la propriété isLoading pour indiquer une progression.  | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Dynamic height | Ajuste automatiquement la hauteur du conteneur en fonction de son contenu. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Collapse when hidden | Lorsque cette option est activée et que le composant est masqué, il n'occupe plus d'espace parmi ses éléments frères, de sorte que les composants environnants (et la hauteur dynamique du parent) se réorganisent pour combler l'espace. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip  | Fournit des informations supplémentaires au survol. Définissez une chaîne à afficher.  | Chaîne de caractères |

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Background | Définit la couleur de fond du conteneur.   | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Border color | Définit la couleur de la bordure. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Border radius | Définit le rayon du composant. | Saisissez un nombre (par défaut : `6`) ou cliquez sur **fx** pour saisir un nombre de manière programmatique. |
| Box shadow | Définit les propriétés de l'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe, ou cliquez sur **fx** pour définir la valeur de manière programmatique. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::
