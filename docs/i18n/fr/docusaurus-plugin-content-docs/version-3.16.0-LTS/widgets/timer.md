---
id: timer
title: Timer
---

# Timer

Le composant **Timer** permet aux utilisateurs de suivre le temps en comptant à la fois vers le haut et vers le bas. Il est utile pour des tâches telles que la définition de comptes à rebours, le suivi du temps écoulé ou le chronométrage d'événements.

<div style={{paddingTop:'24px'}}>

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div>                                                                                                                                                        |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                                  | Spécifie la valeur initiale du timer. Le format est : `HH.MM.SS.MS`.                                                                                                                                       |
| Timer type                                     | Spécifie s'il s'agit d'un compteur ascendant ou descendant. Sélectionnez **Count Up** ou **Count Down** dans la liste déroulante, ou cliquez sur **fx** pour définir de manière programmatique les valeurs **countUp** ou **countDown**. |

</div>

<div style={{paddingTop:'24px'}}>

## Événements

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>    |
| :------------------------------------------ | :--------------------------------------------------- |
| On start                                    | Se déclenche chaque fois que l'utilisateur clique sur le bouton start.   |
| On resume                                   | Se déclenche chaque fois que l'utilisateur clique sur le bouton resume.  |
| On pause                                    | Se déclenche chaque fois que l'utilisateur clique sur le bouton pause.   |
| On count down finish                        | Se déclenche lorsque le compte à rebours atteint zéro. |
| On reset                                    | Se déclenche chaque fois que l'utilisateur clique sur le bouton reset.   |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (Component-Specific Actions) implémentée pour réguler ou contrôler le composant.

</div>

<div style={{paddingTop:'24px'}}>

## Variables exposées

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"100px"}}> Description </div>                                                                    | <div style={{ width:"135px"}}> Comment y accéder </div>                         |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| value                                           | Cette variable contient la valeur du timer dans les clés suivantes : **hour**, **minute**, **second**, et **mSecond**. | Consultez la valeur dynamiquement en JS : `{{components.timer1.value.second}}` |

</div>

<div style={{paddingTop:'24px'}}>

## Général

### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires sur un élément lorsque l'utilisateur survole le composant avec le pointeur de la souris.

Dans l'accordéon <b>General</b>, vous pouvez définir la valeur au format chaîne. Le survol du composant affichera alors cette chaîne comme tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Appareils

| <div style={{ width:"100px"}}> Devices </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Valeur attendue </div>                                                                              |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                               | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

</div>

<hr/>

<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div>             | <div style={{ width:"100px"}}> Options de configuration </div>                                                                  |
| :--------------------------------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Visibility                                     | Contrôle la visibilité du composant. À activer/désactiver ou à définir dynamiquement.     | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                        | Active ou désactive le composant. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Box shadow                                     | Définit les propriétés d'ombre du composant.              | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique via **fx**.                       |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

</div>
