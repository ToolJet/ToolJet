---
id: link
title: Link
---

Le composant **Link** vous permet d'ajouter un hyperlien et de naviguer vers une URL externe.

## Propriétés

| <div style={{ width:"100px"}}> Propriétés </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Link target | Cette propriété définit l'URL vers laquelle l'utilisateur doit être redirigé en cliquant sur le lien. | exemple : `https://dev.to/tooljet` ou `{{queries.xyz.data.url}}`. |
| Link text | Cette propriété définit le texte du composant Link. | exemple : **Click here** ou **Open webpage**. |
| Target type | Cette propriété spécifie si le lien doit s'ouvrir dans le même onglet ou dans un nouvel onglet en cliquant sur le lien. | Options : **New Tab** et **Same Tab**. |

## Événements

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On click                                    | Se déclenche lorsque le lien est cliqué. |
| On hover                                    | Se déclenche lorsque le curseur survole le lien. |

:::info
Consultez la documentation de la **[Référence des actions](/docs/actions/run-query)** pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant link peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| click                                         | Déclenche l'action de clic du composant link. | Utilisez une requête RunJS pour exécuter des actions spécifiques au composant telles que `await components.link1.click()` ou déclenchez-la via un événement. |

## Variables exposées

Il n'y a actuellement aucune variable exposée pour ce composant.

## Général

### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires sur un élément lorsque l'utilisateur survole le composant avec le pointeur de la souris.

Dans l'accordéon **General**, vous pouvez définir la valeur au format chaîne de caractères. Le survol du composant affichera alors cette chaîne comme infobulle.

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| Text color | Vous pouvez modifier la couleur de fond du texte en saisissant le code couleur Hex ou en choisissant une couleur de votre choix depuis le sélecteur de couleur. |
| Text size | Par défaut, la taille du texte est définie sur 14. Vous pouvez saisir n'importe quelle valeur entre 1 et 100 pour définir une taille de texte personnalisée. |
| Underline | Vous pouvez modifier le soulignement du texte des manières suivantes : **on-hover (par défaut), never, always**. |
| Visibility | Activez ou désactivez pour contrôler la visibilité du composant. Vous pouvez modifier sa valeur de manière programmatique en cliquant sur le bouton **fx** à côté. Si `{{false}}`, le composant ne sera pas visible après le déploiement de l'application. Par défaut, il est réglé sur `{{true}}`. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::