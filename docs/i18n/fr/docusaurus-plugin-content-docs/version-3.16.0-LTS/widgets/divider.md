---
id: divider
title: Divider
---

Le composant **Divider** est utilisé pour ajouter un séparateur entre les composants.

## Component Specific Actions (CSA)

Il n'y a actuellement aucune CSA (action spécifique au composant) implémentée pour réguler ou contrôler le composant.

## Exposed variables

Il n'y a actuellement aucune variable exposée pour le composant.

## General

### Tooltip

Une infobulle (Tooltip) est souvent utilisée pour préciser des informations supplémentaires sur un élément lorsque l'utilisateur survole le composant avec le pointeur de la souris.

Sous l'accordéon <b>General</b>, vous pouvez définir la valeur au format chaîne. Le survol du composant affichera alors la chaîne comme infobulle.

## Layout

| Layout | Description | Valeur attendue  |
| :-------------- | :-----------------| :------------------ |
| Show on Desktop  | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on Mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| Propriété | Description | Options de configuration |
|:-------- |:----------- |:----------------------|
| Divider color | Définit la couleur de la ligne du séparateur. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Style | Définit le style de la ligne du séparateur. | Sélectionnez **Solid** ou **Dashed**. |
| Label alignment | Définit la position horizontale du texte du label sur le séparateur. | Sélectionnez **Left**, **Center**, ou **Right**. |
| Label color | Définit la couleur du texte du label. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Text wrap | Contrôle si le texte du label passe sur plusieurs lignes ou reste sur une seule ligne. Lorsque défini sur **No wrap**, le texte qui dépasse la largeur du séparateur est tronqué avec des points de suspension. | Sélectionnez **Wrap** (par défaut) ou **No wrap**. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::
