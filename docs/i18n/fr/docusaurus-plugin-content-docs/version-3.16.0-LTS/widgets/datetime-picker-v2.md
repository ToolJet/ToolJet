---
id: datetime-picker-v2
title: Date Time Picker
---

Le composant **Date Time Picker** peut être utilisé pour sélectionner des dates avec saisie de l'heure. Il propose des formats personnalisables, une validation et un style adaptable.

## Properties

| Propriété | Description | Valeur attendue |
| :------- | :---------- | :------------- |
| Label | Texte à afficher comme label du champ. | Chaîne (par ex., `Date and Time of Arrival`). |
| Date Format | Sélectionnez le format de date dans la liste déroulante. Le format de date par défaut est **DD/MM/YYYY**. | Sélectionnez dans la liste déroulante (par ex. `MM/DD/YYYY`). |
| Time Format | Sélectionnez le format d'heure dans la liste déroulante. Le format d'heure par défaut est **HH:mm**. | Sélectionnez dans la liste déroulante (par ex. `hh:mm A`). |
| Manage time zones | Utilisez le bouton bascule pour gérer le fuseau horaire. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Default value | La valeur par défaut que le composant contiendra au chargement de l'application. | Chaîne (par ex., `01/01/2022 16:00`). |

:::caution
Cliquez sur le bouton **fx** à côté de **Date Format** ou **Time Format** pour saisir une chaîne de format personnalisée. ToolJet utilise **[Moment.js](https://momentjs.com/docs/#/displaying/format/)** pour analyser et formater les dates et les heures, donc la chaîne de format doit utiliser les tokens Moment.js, et ces tokens sont sensibles à la casse — par exemple, `D` représente le jour du mois (`1`–`31`), tandis que `d` en minuscule représente le jour de la semaine (`0`–`6`, dimanche à samedi). Notez également que `YYYY` donne une année sur 4 chiffres, mais `yyyy` en minuscule n'est pas un token Moment.js valide et sera affiché comme du texte littéral. Utilisez un format comme `MMM D, YYYY` (par ex., `Jan 5, 2024`), et non `MMM d, yyyy`.
:::

## Events

| Événement     | Description                                                |
| :-------- | :--------------------------------------------------------- |
| On select | Se déclenche chaque fois que l'utilisateur sélectionne une date.                 |
| On focus  | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du champ de saisie.  |
| On blur   | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du champ de saisie. |

:::info
Consultez la documentation de la [Référence des Actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), qui peuvent être déclenchées par un événement ou par la requête RunJS donnée :

| Action                | <div style={{ width:"150px"}}> Description </div>                 | Comment y accéder                                                 |
| :-------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------ |
| clearValue( )         | Efface la valeur de date.                                            | `components.datetimepicker1.clearValue()`                     |
| setValue( )           | Définit à la fois la valeur de la date et de l'heure.                                | `components.datetimepicker1.setValue(value)`                  |
| setDate( )            | Définit la valeur de la date.                                              | `components.datetimepicker1.setDate(date)`                    |
| setTime( )            | Définit la valeur de l'heure.                                              | `components.datetimepicker1.setTime(time)`                    |
| setValueinTimeStamp() | Définit la valeur de date et d'heure au format Unix.                  | `components.datetimepicker1.setValueinTimeStamp(value)`       |
| setDisabledDates( )   | Désactive des dates spécifiques.                                          | `components.datetimepicker1.setDisabledDates([date1, date2])` |
| clearDisabledDates()  | Efface toutes les dates désactivées.                                        | `components.datetimepicker1.clearDisabledDates()`             |
| setMinDate( )         | Définit la date minimale sélectionnable.                                 | `components.datetimepicker1.setMinDate(date)`                 |
| setMaxDate( )         | Définit la date maximale sélectionnable.                                 | `components.datetimepicker1.setMaxDate(date)`                 |
| setMinTime( )         | Définit l'heure minimale pouvant être sélectionnée.                       | `components.datetimepicker1.setMinTime(value)`                |
| setMaxTime( )         | Définit l'heure maximale pouvant être sélectionnée.                       | `components.datetimepicker1.setMaxTime(value)`                |
| setDisplayTimezone( ) | Définit le fuseau horaire dans lequel l'heure sélectionnée sera affichée.   | `components.datetimepicker1.setDisplayTimezone(value)`        |
| setStoreTimezone( )   | Spécifie le fuseau horaire dans lequel l'heure sélectionnée sera stockée. | `components.datetimepicker1.setStoreTimezone(value)`          |
| setVisibility( )      | Définit l'état de visibilité du date time picker.                | `components.datetimepicker1.setVisibility()`                  |
| setLoading( )         | Définit l'état de chargement du date time picker.                   | `components.datetimepicker1.setLoading()`                     |
| setDisable( )         | Désactive le date time picker.                                    | `components.datetimepicker1.setDisable()`                     |
| setFocus( )           | Définit le focus du curseur sur le date time picker.             | `components.datetimepicker1.setLoading()`                     |
| setBlur( )            | Retire le focus du curseur du date time picker.        | `components.datetimepicker1.setBlur()`                        |

## Exposed Variables

Les variables exposées suivantes peuvent être consultées dynamiquement à l'aide de la requête JS donnée :

| Variables       | <div style={{ width:"200px"}}> Description </div>       | Comment y accéder                                    |
| :-------------- | :------------------------------------------------------ | :----------------------------------------------- |
| value           | Contient la valeur saisie dans le composant.               | `{{components.datetimepicker1.value}}`           |
| label           | Contient la valeur du label du composant.               | `{{components.datetimepicker1.label}}`           |
| minTime         | Contient la première heure sélectionnable.                     | `{{components.datetimepicker1.minTime}}`         |
| maxTime         | Contient la dernière heure sélectionnable.                       | `{{components.datetimepicker1.maxTime}}`         |
| minDate         | Définit la date minimale autorisée.                          | `{{components.datetimepicker1.minDate}}`         |
| maxDate         | Définit la date maximale autorisée.                          | `{{components.datetimepicker1.maxDate}}`         |
| unixTimestamp   | Contient la valeur au format UNIX.                         | `{{components.datetimepicker1.unixTimestamp}}`   |
| selectedDate    | Contient la valeur de la date sélectionnée.                   | `{{components.datetimepicker1.selectedDate}}`    |
| displayValue    | Contient la valeur d'affichage du composant.               | `{{components.datetimepicker1.displayValue}}`    |
| dateFormat      | Contient le format de date.                                  | `{{components.datetimepicker1.dateFormat}}`      |
| selectedTime    | Transmet l'heure sélectionnée.                                 | `{{components.datetimepicker1.selectedTime}}`    |
| timeFormat      | Retourne la propriété de format d'heure sous forme de chaîne.           | `{{components.datetimepicker1.timeFormat}}`      |
| storeTimezone   | Retourne le fuseau horaire dans lequel la valeur sera stockée.    | `{{components.datetimepicker1.storeTimezone}}`   |
| displayTimezone | Retourne le fuseau horaire dans lequel la valeur sera affichée. | `{{components.datetimepicker1.displayTimezone}}` |
| isValid         | Indique si l'entrée respecte les critères de validation.       | `{{components.datetimepicker1.isValid}})`        |
| isMandatory     | Indique si le champ est obligatoire.                    | `{{components.datetimepicker1.isMandatory}}`     |
| isLoading       | Indique si le composant est en cours de chargement.                  | `{{components.datetimepicker1.isLoading}}`       |
| isVisible       | Indique si le composant est visible.                  | `{{components.datetimepicker1.isVisible}}`       |
| isDisabled      | Indique si le composant est désactivé.                 | `{{components.datetimepicker1.isDisabled}}`      |

## Validation

| Option de validation | <div style={{ width:"200px"}}> Description </div> | Valeur attendue |
| :---------------- | :------------------------------------------------ | :------------- |
| Min Date | Définit la date minimale autorisée. | Date dans le format correct (par ex. `01/01/2020`). |
| Max Date | Définit la date maximale autorisée. | Date dans le format correct (par ex. `31/12/2026`). |
| Min Time | Spécifie l'heure la plus précoce pouvant être sélectionnée. | Chaîne (par ex., `05:35`) |
| Max Time | Spécifie l'heure la plus tardive pouvant être sélectionnée. | Chaîne (par ex., `15:45`) |
| Disabled dates | Définit les dates qui ne sont pas acceptables. | Date dans le format correct (par ex. `23/07/2024`). |
| Custom validation | Ajoutez une validation personnalisée pour la saisie de date et d'heure à l'aide de l'opérateur ternaire. | Instruction de validation personnalisée (par ex., `{{ moment(components.datetimepicker1.value).isAfter(moment()) ? true : 'You are late!' }}`) | 
| Make this field mandatory | Rend le champ obligatoire. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. | Chaîne (par ex., `Select the date & time of arrival.`). |

## Devices

| Propriété | Description | Valeur attendue |
| :------- | :---------- | :------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile  | Rend le composant visible en vue mobile.  | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

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
