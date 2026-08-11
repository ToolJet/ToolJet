---
id: date-picker-v2
title: Date Picker
---

Le composant **Date Picker** peut être utilisé pour sélectionner des dates sans saisie de l'heure. Il propose des formats personnalisables, une validation et un style adaptable.

## Properties

| Propriété      | Description                                                                      | Valeur attendue                            |
| :------------ | :------------------------------------------------------------------------------- | :---------------------------------------- |
| Label         | Texte à afficher comme label du champ.                                      | Chaîne (par ex., `Date of Birth`).           |
| Date Format   | Sélectionnez le format de date dans la liste déroulante. Le format de date par défaut est **DD/MM/YYYY**. | Sélectionnez dans la liste déroulante (par ex. `MM/DD/YYYY`). |
| Default value | La valeur par défaut que le composant contiendra au chargement de l'application.           | Chaîne (par ex., `01/01/2022`).              |

:::caution
Cliquez sur le bouton **fx** à côté de **Date Format** pour saisir une chaîne de format personnalisée. ToolJet utilise **[Moment.js](https://momentjs.com/docs/#/displaying/format/)** pour analyser et formater les dates, donc la chaîne de format doit utiliser les tokens Moment.js, et ces tokens sont sensibles à la casse — par exemple, `D` représente le jour du mois (`1`–`31`), tandis que `d` en minuscule représente le jour de la semaine (`0`–`6`, dimanche à samedi). Notez également que `YYYY` donne une année sur 4 chiffres, mais `yyyy` en minuscule n'est pas un token Moment.js valide et sera affiché comme du texte littéral. Utilisez un format comme `MMM D, YYYY` (par ex., `Jan 5, 2024`), et non `MMM d, yyyy`.
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

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), qui peuvent être déclenchées à l'aide d'un événement ou en utilisant la requête RunJS donnée :

| Action               | <div style={{ width:"150px"}}> Description </div>     | Comment y accéder                                             |
| :------------------- | :---------------------------------------------------- | :-------------------------------------------------------- |
| clearValue( )        | Efface la valeur de date.                                | `components.datepicker1.clearValue()`                     |
| setValue( )          | Définit la date dans le composant.                       | `components.datepicker1.setValue(date)`                   |
| setDate( )           | Définit la valeur de la date.                                  | `components.datepicker1.setDate(date)`                    |
| setDisabledDates( )  | Désactive des dates spécifiques.                              | `components.datepicker1.setDisabledDates([date1, date2])` |
| clearDisabledDates() | Efface toutes les dates désactivées.                             | `components.datepicker1.clearDisabledDates()`             |
| setMinDate( )        | Définit la date minimale sélectionnable.                     | `components.datepicker1.setMinDate(date)`                 |
| setMaxDate( )        | Définit la date maximale sélectionnable.                     | `components.datepicker1.setMaxDate(date)`                 |
| setFocus( )          | Définit le focus du curseur sur le champ de saisie.      | `components.datepicker1.setFocus()`                       |
| setBlur( )           | Retire le focus du curseur du champ de saisie. | `components.datepicker1.setBlur()`                        |
| setVisibility()      | Définit la visibilité du composant.                 | `components.datepicker1.setVisibility(false)`             |
| setLoading()         | Définit l'état de chargement du composant.              | `components.datepicker1.setLoading(true)`                 |
| setDisable()         | Désactive le composant.                               | `components.datepicker1.setDisable(true)`                 |

## Exposed Variables

Les variables exposées suivantes peuvent être consultées dynamiquement à l'aide de la requête JS donnée :

| Variable      | Description                                       | Comment y accéder                              |
| :------------ | :------------------------------------------------ | :----------------------------------------- |
| value         | Contient la date dans le composant.                  | `{{components.datepicker1.value}}`         |
| label         | Contient la valeur du label du composant.         | `{{components.datepicker1.label}}`         |
| unixTimestamp | Contient la valeur au format UNIX.                   | `{{components.datepicker1.unixTimestamp}}` |
| selectedDate  | Contient la valeur de la date sélectionnée.              | `{{components.datepicker1.selectedDate}}`  |
| dateFormat    | Contient le format de date.                            | `{{components.datepicker1.dateFormat}}`    |
| isValid       | Indique si l'entrée respecte les critères de validation. | `{{components.datepicker1.isValid}}`       |
| isMandatory   | Indique si le champ est obligatoire.               | `{{components.datepicker1.isMandatory}}`   |
| isLoading     | Indique si le composant est en cours de chargement.            | `{{components.datepicker1.isLoading}}`     |
| isVisible     | Indique si le composant est visible.            | `{{components.datepicker1.isVisible}}`     |
| isDisabled    | Indique si le composant est désactivé.           | `{{components.datepicker1.isDisabled}}`    |

## Validation

| <div style={{ width:"200px"}}> Option de validation </div> | <div style={{ width:"300px"}}> Description </div>                  | <div style={{width: "500px"}}> Valeur attendue </div>                                                                                              |
| :------------------------------------------------------ | :----------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Make this field mandatory                               | Affiche un message « Field cannot be empty » si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique.                      |
| Min Date                                                | Définit la date minimale autorisée.                                     | Date dans le format correct (par ex. `01/01/2020`).                                                                                                       |
| Max Date                                                | Définit la date maximale autorisée.                                     | Date dans le format correct (par ex. `31/12/2026`).                                                                                                       |
| Disabled dates                                          | Définit les dates qui ne sont pas acceptables.                            | Date dans le format correct (par ex. `23/07/2024`).                                                                                                       |
| Custom validation                                       | Spécifie un message d'erreur de validation pour des conditions spécifiques.      | Expression logique (par ex., `{{ !/^\d{4}-\d{2}-\d{2}$/.test(components.datepicker1.value) && "Please enter a valid date in YYYY-MM-DD format" }}`). |

Pour ajouter une expression régulière (regex) dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{ /^\d{4}-\d{2}-\d{2}$/.test(components.datepicker1.value) ? '' : "Please enter a valid date in YYYY-MM-DD format" }}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                            | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :--------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Loading state                                | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant.                                               | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant.                                           | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                      | Fournit des informations supplémentaires au survol.                                    | Chaîne (par ex., `Select your date of birth.` ).                                                                                |

## Devices

| Propriété        | Description                                  | Valeur attendue                                                                                                                    |
| :-------------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
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
