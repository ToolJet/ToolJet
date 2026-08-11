---
id: datepicker
title: Date Picker
---

Le composant **Date Picker** permet aux utilisateurs de sélectionner une valeur unique pour la date et l'heure à partir d'un ensemble prédéterminé.

:::info
Ceci est un composant hérité (legacy). Découvrez la nouvelle version du composant date picker [ici](/docs/widgets/date-picker-v2).
:::

## Properties

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> |
| :--------------------------------------------- | :------------------------------------------------ |
| Default value | Cette valeur agit comme un espace réservé pour le composant date picker ; si aucune valeur n'est fournie, la valeur par défaut du picker sera utilisée. La valeur par défaut doit être une `String` correspondant au champ `format`. Ex. : Si le format est défini sur `MM/YYYY`, fournissez la valeur par défaut sous la forme `04/2022`. |
| Format | Cette valeur agit comme un espace réservé pour le composant date picker ; si aucune valeur n'est fournie, la valeur par défaut du picker sera utilisée. La valeur par défaut doit être une `String` correspondant au champ `format`. Ex. : Si le format est défini sur `MM/YYYY`, fournissez la valeur par défaut sous la forme `04/2022`. |
| Enable time selection? | Activez ou désactivez pour activer la sélection de l'heure. Vous pouvez déterminer la valeur de manière programmatique en cliquant sur **fx** pour définir la valeur `{{true}}` ou `{{false}}`. |
| Enable date selection? | Activez ou désactivez pour activer la sélection de la date. Vous pouvez déterminer la valeur de manière programmatique en cliquant sur **fx** pour définir la valeur `{{true}}` ou `{{false}}`. |
| Disabled dates | Vous pouvez fournir la propriété disabled dates qui désactivera des dates spécifiques et les empêchera d'être sélectionnées. La valeur par défaut doit être un tableau de `Strings`. |

Exemple pour désactiver le 9 janvier :

```js
{
  {
    ["09-01"];
  }
}
```

L'utilisateur ne pourra désormais plus sélectionner la date mentionnée puisqu'elle sera désactivée.

:::caution
ToolJet utilise **[Moment.js](https://momentjs.com/docs/#/displaying/format/)** pour analyser et formater les dates, donc le champ **Format** doit utiliser les tokens Moment.js, et ces tokens sont sensibles à la casse — par exemple, `D` représente le jour du mois (`1`–`31`), tandis que `d` en minuscule représente le jour de la semaine (`0`–`6`, dimanche à samedi). Notez également que `YYYY` donne une année sur 4 chiffres, mais `yyyy` en minuscule n'est pas un token Moment.js valide et sera affiché comme du texte littéral. Utilisez un format comme `MMM D, YYYY` (par ex., `Jan 5, 2024`), et non `MMM d, yyyy`.
:::

## Events

Pour ajouter un événement à un composant date-picker, cliquez sur la poignée du composant pour ouvrir les propriétés du composant dans la barre latérale droite. Allez dans la section **Events** et cliquez sur **+ Add handler**.

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On select                                   | Se déclenche chaque fois que l'utilisateur sélectionne une date.        |

:::info
Consultez la documentation de la [Référence des Actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component Specific Actions (CSA)

Il n'y a actuellement aucune CSA (action spécifique au composant) implémentée pour réguler ou contrôler le composant.

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :---------------------------------------------- | :---------------------------------------------------- | :---------------------------------------------------------------------------- |
| value                                           | Contient la valeur saisie par l'utilisateur dans le composant. | Accessible dynamiquement en JS (par ex., `{{components.datepicker1.value}}`). |

## Validation

### Custom Validation

Ajoutez une validation pour la saisie de date dans le composant à l'aide de l'opérateur ternaire.

Exemple de validation pour la sélection de dates postérieures à la date actuelle :

```js
{
  {
    moment(components.datepicker1.value, "DD/MM/YYYY").isAfter(moment())
      ? true
      : "Date should be after today";
  }
}
```

## General

### Tooltip

Une infobulle (Tooltip) est souvent utilisée pour préciser des informations supplémentaires sur un élément lorsque l'utilisateur survole le composant avec le pointeur de la souris.

Sous l'accordéon <b>General</b>, vous pouvez définir la valeur au format chaîne. Le survol du composant affichera alors la chaîne comme infobulle.

## Devices

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur par défaut </div> |
| :------------------------------------------ | :------------------------------------------------ | :-------------------------------------------------- |
| Visibility | Ceci permet de contrôler la visibilité du composant. Si `{{false}}`, le composant ne sera pas visible après le déploiement de l'application. Il peut uniquement avoir des valeurs booléennes, c'est-à-dire `{{true}}` ou `{{false}}`. | Par défaut, elle est définie sur `{{true}}`. |
| Disable | Cette propriété n'accepte que des valeurs booléennes. Si elle est définie sur `{{true}}`, le composant sera verrouillé et deviendra non fonctionnel | Par défaut, sa valeur est définie sur `{{false}}`. |
| Border radius | Utilisez cette propriété pour modifier le rayon de bordure du date-picker. Le champ n'accepte que des valeurs numériques de `1` à `100` | Par défaut, sa valeur est définie sur `0`. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
