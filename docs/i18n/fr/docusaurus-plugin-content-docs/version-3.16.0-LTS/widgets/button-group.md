---
id: button-group
title: Button Group
---

Le composant **Button Group** est utilisé pour regrouper une série de boutons sur une seule ligne. Il permet de regrouper des boutons liés entre eux.

<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/widgets/button-group/buttongroup1.png" alt="Button group" />

## Propriétés

| <div style={{ width:"100px"}}> Propriétés </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| label | Définit le titre du button-group. | Toute valeur de type **String** : `Select the options` ou `{{queries.queryname.data.text}}`.     |
| values | Définit les valeurs des éléments du Button Group. | **Tableau** de chaînes et de nombres : `{{[1,2,3]}}`. |
| Labels | Définit les labels des éléments du Button Group. | **Tableau** de chaînes et de nombres : `{{['A','B','C']}}`. |
| Default selected | Définit les valeurs sélectionnées initialement. | **Tableau** de chaînes et de nombres : `{{[1]}}` sélectionnera le premier bouton par défaut. |
| Enable multiple selection | Activez ou désactivez pour permettre la sélection multiple.    | Valeur **Booléenne** : `{{true}}` ou `{{false}}`. |

## Événements

| <div style={{ width:"100px"}}> Événements </div> | <div style={{ width:"100px"}}> Description </div>                    |
| :------------------------------------------- | :------------------------------------------------------------------- |
| On click                                     | Se déclenche chaque fois que l'utilisateur clique sur un bouton du Button Group. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (action spécifique au composant) implémentée pour réguler ou contrôler le composant button-group.

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| selected | Contient la valeur du bouton actuellement sélectionné sous forme de tableau d'objets. | Accessible dynamiquement avec JS (par ex., `{{components.buttongroup1.selected[0]}} ou {{components.buttongroup1.selected}}`). |

## Général

#### Tooltip

Un Tooltip est souvent utilisé pour afficher des informations supplémentaires lorsque l'utilisateur survole le composant avec le pointeur de la souris. Une fois qu'une valeur est définie pour Tooltip, le survol de l'élément affichera la chaîne spécifiée comme texte d'infobulle.

<img className="screenshot-full" src="/img/widgets/button-group/grouptooltip.png" alt="Button group layout" />

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"135px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Background color | Définit une couleur d'arrière-plan pour les boutons du button group. | Choisissez une couleur dans le sélecteur ou saisissez le code couleur Hex. ex. : `#000000`. |
| Text color | Définit une couleur de texte pour les boutons du button group. | Choisissez une couleur dans le sélecteur ou saisissez le code couleur Hex. ex. : `#000000`. |
| Visibility | Rend le composant visible ou masqué. | **`{{true}}`** ou **`{{false}}`**, par défaut, sa valeur est réglée sur `{{true}}`. |
| Disable | Désactive le composant. | **`{{true}}`** ou **`{{false}}`**, par défaut, sa valeur est réglée sur `{{false}}`. |
| Border radius. | Ajoute un rayon de bordure aux boutons du composant grâce à cette propriété. | Toute valeur numérique de `0` à `100`. |
| Selected text color | Utilisez cette propriété pour modifier la couleur du texte du bouton sélectionné. | Choisissez une couleur dans le sélecteur ou saisissez le code couleur Hex. ex. : `#000000`. |
| Selected background color | Utilisez cette propriété pour modifier la couleur d'arrière-plan du bouton sélectionné. | Choisissez une couleur dans le sélecteur ou saisissez le code couleur Hex. ex. : `#000000`. |
| Box shadow | Définit les effets d'ombre ajoutés autour du cadre d'un composant. Vous pouvez spécifier les décalages horizontal et vertical (via les curseurs X et Y), le rayon de flou et de propagation, ainsi que la couleur de l'ombre. | Valeurs représentant X, Y, blur, spread et color. Exemple : `9px 11px 5px 5px #00000040`. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée via les **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** est disponible uniquement si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::
