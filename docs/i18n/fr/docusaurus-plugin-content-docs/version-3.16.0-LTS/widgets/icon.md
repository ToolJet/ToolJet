---
id: icon
title: Icon
---

Un composant **Icon** peut être utilisé pour ajouter des icônes. Il prend en charge des événements comme le survol et le clic.

## Propriétés

| Propriétés | Description                                                  |
| :--------- | :----------------------------------------------------------- |
| Icon       | Utilisez ceci pour choisir une icône dans la liste des icônes disponibles. |

## Événements

| Événement    | Description                                            |
| :------- | :----------------------------------------------------- |
| On hover | Se déclenche chaque fois que le curseur survole l'icône. |
| On click | Se déclenche chaque fois que l'icône est cliquée.                 |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), vous pouvez les déclencher via un événement ou utiliser une requête RunJS.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> Requête RunJS </div> |
| :------------------------------------------- | :------------------------------------------------ | :------------------------------------------------ |
| click( )                                     | Régule le clic sur l'icône.                   | `components.icon1.click()`                        |
| setVisibility( )                             | Définit la visibilité du composant.             | `components.icon1.setVisibility(false)`           |
| setLoading( )                                | Définit l'état de chargement du composant.          | `components.icon1.setLoading(true)`               |
| setDisable( )                                | Désactive le composant.                           | `components.icon1.setDisable(true)`               |

## Variables exposées

| Variable   | <div style={{ width:"250px"}}> Description </div> | Comment y accéder                     |
| :--------- | :------------------------------------------------ | :-------------------------------- |
| isLoading  | Indique si le composant est en cours de chargement.            | `{{components.icon1.isLoading}}`  |
| isVisible  | Indique si le composant est visible.            | `{{components.icon1.isVisible}}`  |
| isDisabled | Indique si le composant est désactivé.           | `{{components.icon1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                            | <div style={{ width:"250px"}}> Options de configuration </div>                                                               |
| :------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| Loading state                                | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant.                                               | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant.                                           | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                      | Fournit des informations supplémentaires au survol. Définissez une chaîne à afficher.              | Chaîne de caractères                                                                                                                    |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div>                                                 |
| :------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------------------------------------------------------- |
| Color                                       | Choisissez la couleur de l'icône                             | Code couleur hexadécimal ou choisissez dans le sélecteur de couleur.                                                          |
| Alignment                                   | Définissez l'alignement de l'icône                            | Sélectionnez entre gauche, centre ou droite.                                                                                   |
| Padding                                     | Définissez le padding à l'intérieur du composant              | Choisissez entre Default ou None.                                                                                         |
| Box shadow                                  | Cette propriété ajoute une ombre au composant.     | Vous pouvez utiliser différentes valeurs pour la propriété box shadow comme les décalages, le flou, la propagation et le code couleur. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
