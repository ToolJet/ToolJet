---
id: pdf
title: PDF
slug: /widgets/pdf/
---

Le composant **PDF** permet d'intégrer des fichiers PDF, soit via une URL, soit via du code Base64.

## Compatibilité

Le composant PDF est compatible avec les versions de navigateurs suivantes : <br/>

| <div style={{ width:"100px"}}> Navigateur </div> | <div style={{ width:"100px"}}> Version </div> |
| :-------------------------------------------- | :-------------------------------------------- |
| Chrome                                        | 92 ou ultérieure                              |
| Edge                                          | 92 ou ultérieure                              |
| Safari                                        | 15.4 ou ultérieure                            |
| Firefox                                       | 90 ou ultérieure                              |

Si le composant PDF est intégré à votre application, il ne s'affichera que sur les navigateurs pris en charge.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div>                                                                                                                                                        |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File URL                                       | Sous cette propriété, vous pouvez saisir l'URL du fichier PDF à afficher. Le format Base64 est également prise en charge, l'entrée doit être préfixée par `data:application/pdf;base64,`.                              |
| Scale page to width                            | La propriété **Scale page to width** ajuste automatiquement le PDF pour occuper toute la largeur du composant.                                                                                              |
| Show page controls                             | Par défaut, lorsque l'on survole le fichier PDF, des boutons pour la page précédente et suivante, ainsi que le numéro de page, s'affichent. Ils peuvent être activés ou désactivés à l'aide du bouton **Show page controls**.     |
| Show the download                              | Le bouton **Download** du composant PDF permet de télécharger le fichier PDF. Par défaut, le bouton **Show the download** est activé. Désactivez-le pour retirer le bouton **Download** du composant PDF. |

## Component Specific Actions (CSA)

Il n'existe actuellement aucune CSA (Component-Specific Action) implémentée pour réguler ou contrôler le composant.

## Variables exposées

Il n'existe actuellement aucune variable exposée pour ce composant.

## Général

### Tooltip

Pour afficher un texte d'instruction lorsqu'un utilisateur survole le composant PDF, ajoutez du texte dans la propriété Tooltip.

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Border color | Définit la couleur de bordure du visualiseur PDF. | Sélectionnez une couleur depuis le sélecteur de couleurs ou définissez-la de manière programmatique via **fx**. |
| Border radius | Définit le rayon des coins du visualiseur PDF. | Saisissez une valeur numérique (par défaut : `6`) ou définissez-la de manière programmatique via **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
