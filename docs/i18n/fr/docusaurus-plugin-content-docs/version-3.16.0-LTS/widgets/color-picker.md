---
id: color-picker
title: Color Picker
---

Le composant **Color Picker** permet aux utilisateurs de sélectionner une couleur à partir d'une palette visuelle. Il prend en charge les formats de couleur HEX et RGB, un contrôle alpha (opacité) optionnel, et peut être utilisé comme composant autonome ou au sein d'un Form. Dans ce document, nous allons parcourir toutes les options de configuration du composant **Color Picker**.

## Properties

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------- | :--------------------------------------------------- |
| Label | Texte affiché comme label du champ. | Chaîne (par ex., `Color`). |
| Placeholder | Une indication affichée dans le champ lorsqu'aucune couleur n'est sélectionnée. | Chaîne (par ex., `Select a color`). |
| Default value | La couleur par défaut affichée au chargement de l'application. Doit être un code hexadécimal valide. | Chaîne de couleur hexadécimale (par ex., `#4368E3`). |
| Color format | Détermine le format dans lequel la couleur sélectionnée est affichée dans le champ. | `HEX` ou `RGB`. |
| Show alpha | Active le curseur du canal alpha (opacité) dans la popover du sélecteur de couleur. | Activez ou désactivez. |
| Show clear button | Affiche un bouton d'effacement à l'intérieur du champ pour réinitialiser la couleur sélectionnée. | Activez ou désactivez. |

## Events

| Événement | Description |
| :---- | :---------- |
| On change | Se déclenche chaque fois que l'utilisateur sélectionne une nouvelle couleur dans le sélecteur de couleur. |
| On focus | Se déclenche chaque fois que la popover du sélecteur de couleur est ouverte. |
| On blur | Se déclenche chaque fois que la popover du sélecteur de couleur est fermée. |

:::info
Consultez la documentation de la [Référence des Actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA). Vous pouvez les déclencher à l'aide d'un événement ou d'une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Comment y accéder </div> |
| :------------------------------------------- | :------------------------------------------------- | :-------------------------------------------------- |
| setColor() | Définit la couleur sélectionnée sur le composant. | `components.colorpicker1.setColor('#64A07A')` |
| setDisable() | Active ou désactive le composant. | `components.colorpicker1.setDisable(true)` |
| setLoading() | Définit l'état de chargement du composant. | `components.colorpicker1.setLoading(true)` |
| setVisibility() | Définit la visibilité du composant. | `components.colorpicker1.setVisibility(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | Comment y accéder |
| :--------------------------------------------- | :---------- | :------------ |
| selectedColorHex | Contient le code HEX de la couleur actuellement sélectionnée. Mis à jour chaque fois que l'utilisateur choisit une couleur. | `{{components.colorpicker1.selectedColorHex}}` |
| selectedColorRGB | Contient la valeur RGB de la couleur actuellement sélectionnée. | `{{components.colorpicker1.selectedColorRGB}}` |
| selectedColorRGBA | Contient la valeur RGBA de la couleur actuellement sélectionnée (inclut l'alpha/l'opacité). | `{{components.colorpicker1.selectedColorRGBA}}` |
| colorFormat | Reflète le format de couleur actuellement actif (`hex` ou `rgb`). | `{{components.colorpicker1.colorFormat}}` |
| allowOpacity | Indique si le canal alpha est activé. | `{{components.colorpicker1.allowOpacity}}` |
| isValid | Indique si la valeur actuelle passe la validation. | `{{components.colorpicker1.isValid}}` |
| isLoading | Indique si le composant est en état de chargement. | `{{components.colorpicker1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.colorpicker1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.colorpicker1.isDisabled}}` |

## Validation

| <div style={{ width:"150px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche une erreur de validation si aucune couleur n'est sélectionnée lors de la soumission du formulaire. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Custom validation | Spécifie un message d'erreur de validation personnalisé pour une condition spécifique. | Expression logique (par ex., `{{components.colorpicker1.selectedColorHex === '#FF0000' && 'Red is not allowed'}}`). |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, généralement utilisé pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle si le composant est visible. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Collapse when hidden | Réduit l'espace du composant lorsqu'il est masqué, afin que les composants environnants occupent l'espace. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Désactive l'interaction de l'utilisateur avec le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Affiche une infobulle d'information lorsque l'utilisateur survole le composant. | Chaîne (par ex., `Pick a brand color`). |

## Devices

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"130px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Définit la couleur du label du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Alignment | Définit la position du label par rapport au champ de saisie. | Cliquez sur les options de bascule ou cliquez sur **fx** pour saisir une valeur — `side` (label et champ sur la même ligne) ou `top` (label au-dessus du champ). |
| Direction | Lorsque l'alignement est défini sur `side`, contrôle si le label apparaît à gauche ou à droite du champ. | Sélectionnez **Left** ou **Right** à l'aide des icônes de bascule. |
| Width | Définit la largeur du label. Disponible lorsque l'alignement est `side`. | Activez **Auto** pour utiliser automatiquement la largeur standard, ou désactivez-la pour définir manuellement la largeur à l'aide du curseur ou de **fx**. |

### Field

| <div style={{ width:"130px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Définit la couleur d'arrière-plan du champ de saisie. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border | Définit la couleur de la bordure du champ de saisie. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Accent | Définit la couleur d'accentuation utilisée pour les contours de focus et autres mises en évidence interactives. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Text | Définit la couleur de la valeur de couleur sélectionnée affichée à l'intérieur du champ. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Error text | Définit la couleur du message d'erreur de validation. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border radius | Arrondit les coins du champ de saisie. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre du champ de saisie. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique avec **fx**. |

### Container

**Padding** <br/>
Vous permet de maintenir un remplissage (padding) standard en activant l'option `Default`. Sélectionnez `None` pour supprimer tout le remplissage.

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::
