---
id: popover-menu
title: Popover Menu
---

Le **Popover Menu** est un composant d'interface qui permet d'afficher un menu contextuel ou des options supplémentaires lorsqu'un utilisateur clique ou survole le bouton. Contrairement à un menu classique, le popover menu apparaît sous forme de panneau flottant ancré à l'élément déclencheur.

**Pourquoi l'utiliser ?**
- Pour proposer un ensemble compact d'actions liées à un bouton, une icône ou une carte.
- Pour afficher des options contextuelles liées à un enregistrement, une ligne ou un élément sélectionné.
- Améliore l'expérience utilisateur grâce à un menu flottant et léger plutôt qu'à des boutons encombrants.

## Menu

| Propriété         | Valeur               | Description                                                                             |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------- |
| **Button label** | Chaîne              | Le texte affiché sur le bouton déclencheur du menu.                                          |
| **Button type**  | Primary / Outline   | Définit le style visuel du bouton déclencheur.                                         |
| **Show menu**    | On hover / On click | Contrôle la manière dont le menu s'ouvre. |

## Options

Permet d'ajouter des options au champ du composant **Popover Menu**. Vous pouvez cliquer sur **+ Add new option** et ajouter des options manuellement, ou activer **Dynamic options** et saisir les options via du code.

### Exemple de code pour les options dynamiques
```js
    {{
        [
            {
                "label":"option1",
                "description":"",
                "value":"1",
                "icon":"IconBolt",
                "iconVisibility":true,
                "disable":false,
                "visible":true
            },
            {
                "label":"option2",
                "description":"",
                "value":"2",
                "icon":"IconBulb",
                "iconVisibility":false,
                "disable":true,
                "visible":true
            },
            {
                "label":"option3",
                "description":"This is an option",
                "value":"3",
                "icon":"IconTag",
                "iconVisibility":false,
                "disable":false,
                "visible":true
            }
        ]
    }}
```

**Options Loading State** permet d'ajouter un état de chargement aux options générées dynamiquement. Vous pouvez activer ou désactiver le bouton bascule, ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique.


## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div>          |
| :------------------------------------------ | :--------------------------------------------------------- |
| On select                                   | Se déclenche chaque fois qu'une option est sélectionnée.                   |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des component-specific actions (CSA) ; vous pouvez les déclencher via un événement ou en utilisant une requête RunJS.

| <div style={{ width:"100px"}}> **Action** </div> | **Description** | **Requête RunJS** |
|:-----------|:----------------|:----------------|
| setVisibility( ) | Définit la visibilité du composant. | `components.popovermenu1.setVisibility()` |
| setLoading( ) | Définit l'état de chargement du composant. | `components.popovermenu1.setLoading()` |
| setDisable( ) | Désactive le composant. | `components.popovermenu1.setDisable()` |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| label | Contient le nom de l'étiquette du composant. | `{{components.popovermenu1.label}}` |
| options | Contient toutes les valeurs d'options du composant sous forme de tableau. | `{{components.popovermenu1.options}}` |
| lastClickedOption | Contient la valeur de la dernière option cliquée. | `{{components.popovermenu1.lastClickedOption}}` |
| isLoading | Indique si le composant est en cours de chargement. | `{{components.popovermenu1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.popovermenu1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.popovermenu1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :-------------------------------------------------| :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Bascule ou configuration dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. Bascule ou configuration dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. Bascule ou configuration dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | Chaîne (par ex., `Select an option.` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Menu

| **Propriété**      | **Description**                                           | **Options de configuration**                   |
| ----------------- | --------------------------------------------------------- | ------------------------------------------- |
| **Background**    | Définit la couleur de fond du popover menu.            | Sélecteur de couleurs / HEX / RGBA / Thèmes personnalisés   |
| **Text**          | Définit la couleur du texte des étiquettes à l'intérieur du menu.         | Sélecteur de couleurs / HEX / RGBA / Thèmes personnalisés   |
| **Border**        | Personnalise la couleur de bordure du conteneur du menu.        | Sélecteur de couleurs / HEX / RGBA / Thèmes personnalisés   |
| **Loader**        | Définit la couleur du loader.                             | Sélecteur de couleurs / HEX / RGBA / Thèmes personnalisés   |
| **Icon**          | Permet de sélectionner une icône pour le bouton déclencheur.      | Sélectionnez l'icône, activez/désactivez sa visibilité |
| **Icon color**    | Ajuste la couleur de l'icône et son alignement (gauche ou droite). | Sélecteur de couleurs / Options d'alignement            |
| **Border Radius** | Arrondit les coins du conteneur du menu.                 | Valeurs en pixels / Options de rayon prédéfinies    |
| **Box shadow**    | Ajoute des effets d'ombre au menu pour donner de la profondeur.                | Sélecteur de couleurs / HEX / RGBA / Thèmes personnalisés   |

### Options

| **Propriété**    | **Description**                                  | **Options de configuration**                 |
| --------------- | ------------------------------------------------ | ----------------------------------------- |
| **Label**       | Définit la couleur du texte affiché pour l'option du menu.            | Sélecteur de couleurs / HEX / RGBA / Thèmes personnalisés |
| **Icon color**  | Définit la couleur de l'icône de l'option.             | Sélecteur de couleurs / HEX / RGBA / Thèmes personnalisés |
| **Description** | Définit la couleur du texte d'aide facultatif affiché sous l'étiquette principale. | Sélecteur de couleurs / HEX / RGBA / Thèmes personnalisés |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::
