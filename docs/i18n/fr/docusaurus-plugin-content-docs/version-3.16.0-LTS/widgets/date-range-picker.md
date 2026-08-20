---
id: date-range-picker
title: Date Range Picker
---

Le composant **Range Picker** permet aux utilisateurs de sélectionner une plage de dates. Il peut être utilisé dans les plateformes de réservation, le filtrage de rapports, les systèmes de planification, etc.

## Properties

| Propriété           | Description                                                     | Valeur attendue                                                |
| :----------------- | :-------------------------------------------------------------- | :------------------------------------------------------------ |
| Label              | Texte à afficher comme label du champ.                     | Chaîne (par ex., `Select Check-In and Check-Out Dates`).         |
| Default start date | Définit la date de début sélectionnée par défaut dans le composant.  | Date dans le format correct (par ex., 01/04/2024).                    |
| Default end date   | Définit la date de fin sélectionnée par défaut dans le composant.    | Date dans le format correct (par ex., 10/04/2024).                    |
| Format             | Définit le format de date. Le format de date par défaut est **DD/MM/YYYY**. | Format de date selon les formats définis par ISO 8601 (par ex., `MM/DD/YYYY`). |

:::caution
Cliquez sur le bouton **fx** à côté de **Format** pour saisir une chaîne de format personnalisée. ToolJet utilise **[Moment.js](https://momentjs.com/docs/#/displaying/format/)** pour analyser et formater les dates, donc la chaîne de format doit utiliser les tokens Moment.js, et ces tokens sont sensibles à la casse — par exemple, `D` représente le jour du mois (`1`–`31`), tandis que `d` en minuscule représente le jour de la semaine (`0`–`6`, dimanche à samedi). Notez également que `YYYY` donne une année sur 4 chiffres, mais `yyyy` en minuscule n'est pas un token Moment.js valide et sera affiché comme du texte littéral. Utilisez un format comme `MMM D, YYYY` (par ex., `Jan 5, 2024`), et non `MMM d, yyyy`.
:::

## Events

| Événement     | Description                                                |
| :-------- | :--------------------------------------------------------- |
| On select | Se déclenche chaque fois qu'une date de début ou de fin est sélectionnée.    |
| On focus  | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du champ de saisie.  |
| On blur   | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du champ de saisie. |

:::info
Consultez la documentation de la [Référence des Actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), qui peuvent être déclenchées à l'aide d'un événement ou en utilisant la requête RunJS donnée :

| <div style={{ width:"155px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div>             | Comment y accéder                                                  |
| :-------------------------------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------- |
| setStartDate( )                              | Définit la date de début de la plage de dates sélectionnée.               | `components.daterangepicker1.setStartDate(date)`               |
| clearStartDate( )                            | Efface la date de début sélectionnée.                               | `components.daterangepicker1.clearStartDate()`                 |
| setEndDate( )                                | Définit la date de fin de la plage de dates sélectionnée.                 | ` await components.daterangepicker1.setEndDate(date)`          |
| clearEndDate( )                              | Efface la date de fin sélectionnée.                                 | `components.daterangepicker1.clearEndDate()`                   |
| setDateRange( )                              | Définit à la fois les dates de début et de fin de la plage de dates sélectionnée. | `components.daterangepicker1.setDateRange(startDate, endDate)` |
| clearDateRange( )                            | Efface à la fois les dates de début et de fin.                          | `components.daterangepicker1.clearDateRange()`                 |
| setDisabledDates( )                          | Définit des dates spécifiques comme désactivées, empêchant leur sélection.        | `components.daterangepicker1.setDisabledDates([date1, date2])` |
| clearDisabledDates( )                        | Efface toutes les restrictions de dates désactivées.                        | `components.daterangepicker1.clearDisabledDates()`             |
| setMinDate( )                                | Définit la date minimale sélectionnable.                             | `components.daterangepicker1.setMinDate(date)`                 |
| setMaxDate( )                                | Définit la date maximale sélectionnable.                             | `components.daterangepicker1.setMaxDate(date)`                 |
| setFocus( )                                  | Définit le focus du curseur sur le champ de saisie.              | `components.daterangepicker1.setFocus()`                       |
| setBlur( )                                   | Retire le focus du curseur du champ de saisie.         | `components.daterangepicker1.setBlur()`                        |
| setVisibility()                              | Définit la visibilité du composant.                         | `components.daterangepicker1.setVisibility()`                  |
| setLoading()                                 | Définit l'état de chargement du composant.                      | `components.daterangepicker1.setLoading()`                     |
| setDisable()                                 | Désactive le composant.                                       | `components.daterangepicker1.setDisable()`                     |

## Exposed Variables

Les variables exposées suivantes peuvent être consultées dynamiquement à l'aide de la requête JS donnée :

| Variables         | <div style={{ width:"250px"}}> Description </div>                 | Comment y accéder                                       |
| :---------------- | :---------------------------------------------------------------- | :-------------------------------------------------- |
| endDate           | Contient la date sélectionnée comme date de fin dans le composant.         | `{{components.daterangepicker1.endDate}}`           |
| startDate         | Contient la date sélectionnée comme date de début dans le composant.       | `{{components.daterangepicker1.startDate}}`         |
| label             | Contient la valeur du label du composant.                         | `{{components.daterangepicker1.label}}`             |
| minDate           | Contient la valeur de la date minimale autorisée dans le composant.     | `{{components.daterangepicker1.minDate}}`           |
| maxDate           | Contient la valeur de la date maximale autorisée dans le composant.     | `{{components.daterangepicker1.maxDate}}`           |
| selectedDateRange | Contient la valeur de la plage de dates du composant.                    | `{{components.daterangepicker1.selectedDateRange}}` |
| startDateInUnix   | Contient la date de début au format horodatage Unix.                    | `{{components.daterangepicker1.startDateInUnix}}`   |
| endDateInUnix     | Contient la date de fin au format horodatage Unix.                      | `{{components.daterangepicker1.endDateInUnix}}`     |
| dateFormat        | Définit le format dans lequel la plage de dates sélectionnée est affichée. | `{{components.daterangepicker1.dateFormat}}`        |
| isMandatory       | Indique si le champ est obligatoire.                               | `{{components.daterangepicker1.isMandatory}}`       |
| isLoading         | Indique si le composant est en cours de chargement.                            | `{{components.daterangepicker1.isLoading}}`         |
| isVisible         | Indique si le composant est visible.                            | `{{components.daterangepicker1.isVisible}}`         |
| isDisabled        | Indique si le composant est désactivé.                           | `{{components.daterangepicker1.isDisabled}}`        |

## Validation

| <div style={{ width:"200px"}}> Option de validation </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{width: "500px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message « Field cannot be empty » si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Min Date | Définit la date minimale autorisée. | Date dans le format correct (par ex. `01/01/2020`). |
| Max Date | Définit la date maximale autorisée. | Date dans le format correct (par ex. `31/12/2026`). |
| Disabled dates | Définit les dates qui ne sont pas acceptables. | Date dans le format correct (par ex. `23/07/2024`). |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions spécifiques. | Expression logique |

Pour ajouter une expression régulière (regex) dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** :

```js
{
  {
    /^\d{4}-\d{2}-\d{2}$/.test(components.daterangepicker1.startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(components.daterangepicker1.endDate)
      ? ""
      : "Please enter a valid date in YYYY-MM-DD format";
  }
}
```

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. | Chaîne (par ex., `Select your booking dates.` ). |

## Devices

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| Propriété    | Description                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| Label Color | Définit la couleur du texte du label.                                                  |
| Alignment   | Détermine la position du label, choisissez entre haut/côté et gauche/droite. |
| Width       | Spécifie le pourcentage de la largeur du composant que le label doit occuper.    |

### Color

| Propriété   | Description                                                         |
| ---------- | ------------------------------------------------------------------- |
| Background | Définit la couleur d'arrière-plan du composant.                         |
| Border     | Définit la couleur de la bordure du composant.                        |
| Accent     | Spécifie la couleur d'accentuation utilisée pour les mises en évidence ou les indicateurs de focus. |
| Text       | Définit la couleur du texte à l'intérieur du composant.                           |
| Error text | Couleur appliquée aux messages d'erreur.                                    |

### Input Field

| Propriété      | Description                                                              |
| ------------- | ------------------------------------------------------------------------ |
| Icon          | Ajoute une icône au composant, généralement pour des indices visuels ou des actions.       |
| Icon Color    | Définit la couleur de l'icône.                                              |
| Icon Position | Définit la position de l'icône (par ex., gauche, droite).                    |
| Border radius | Contrôle l'arrondi du champ de saisie du composant.                   |
| Box shadow    | Applique un style d'ombre au champ de saisie.                               |
| Padding       | Définit l'espacement interne entre le contenu et les bords du champ de saisie. |

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
