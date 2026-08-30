---
id: steps
title: Steps
---

Le composant **Steps** aide à décomposer un processus complexe en étapes claires et faciles à gérer. Il est idéal pour les formulaires multi-étapes, les parcours d'intégration ou les processus d'approbation, donnant aux utilisateurs une idée claire de la progression et de la direction.

## Propriétés

| Propriété        | Description                                                                                 |
| :-------------- | :------------------------------------------------------------------------------------------ |
| Variant         | Choisissez ce que vous souhaitez afficher sur le composant - Label, Number, Plain.                    |
| Dynamic Options | Activez pour ajouter des étapes dynamiquement, ou cliquez sur le bouton **Add new option** pour ajouter une nouvelle étape. |
| Current step    | Sélectionnez l'étape qui doit être sélectionnée par défaut.                                            |

## Événements

| Événement     | Description                                  |
| :-------- | :------------------------------------------- |
| On select | Se déclenche chaque fois que l'utilisateur sélectionne une étape. |

:::info
Consultez la documentation de [référence des actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div>                 | <div style={{width: "200px"}}> RunJS Query </div> |
| :------------------------------------------- | :---------------------------------------------------------------- | :------------------------------------------------ |
| setStepVisible( )                            | Définit la visibilité de l'étape.                                          | `components.steps1.setStepVisible`                |
| setStepDisable( )                            | Désactive l'étape.                                                | `components.steps1.setStepDisable`                |
| resetSteps( )                                | Réinitialise les étapes terminées et ramène l'utilisateur à l'étape par défaut.       | `components.steps1.resetSteps`                    |
| setStep( )                                   | Amène l'utilisateur à l'étape indiquée par l'ID et marque toutes les étapes précédentes comme terminées. | `components.steps1.setStep`                       |
| setVisibility( )                             | Définit la visibilité du composant.                             | `components.steps1.setVisibility(false)`          |
| setDisable( )                                | Désactive le composant.                                           | `components.steps1.setDisable(true)`              |

## Variables exposées

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"100px"}}> Description </div>                  | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :---------------------------------------------- | :----------------------------------------------------------------- | :-------------------------------------------------- |
| currentStepId                                   | Contient l'ID de l'étape actuellement sélectionnée sur le composant steps. | `{{components.steps1.currentStepId}}`               |
| steps                                           | Stocke les informations de toutes les étapes.                               | `{{components.steps1.steps}}`                       |
| isVisible                                       | Indique si le composant est visible.                             | `{{components.steps1.isVisible}}`                   |
| isDisabled                                      | Indique si le composant est désactivé.                            | `{{components.steps1.isDisabled}}`                  |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>  | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Steps selectable                             | Lorsqu'elle est désactivée, désactive la sélection des étapes. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant.                     | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant.                 | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | Valeur attendue                                 |
| :------------------------------------------ | :------------------------------------------------ | ---------------------------------------------- |
| Incompleted accent                          | Choisissez la couleur pour l'accent des étapes incomplètes.               | Sélectionnez depuis un thème ou choisissez à l'aide du sélecteur de couleur. |
| Incompleted label                           | Choisissez la couleur pour le label des étapes incomplètes.                | Sélectionnez depuis un thème ou choisissez à l'aide du sélecteur de couleur. |
| Completed accent                            | Choisissez la couleur pour l'accent des étapes terminées.                | Sélectionnez depuis un thème ou choisissez à l'aide du sélecteur de couleur. |
| Completed label                             | Choisissez la couleur pour le label des étapes terminées.                 | Sélectionnez depuis un thème ou choisissez à l'aide du sélecteur de couleur. |
| Current step label                          | Choisissez la couleur pour le label de l'étape actuelle.              | Sélectionnez depuis un thème ou choisissez à l'aide du sélecteur de couleur. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de façon programmatique**.
:::
