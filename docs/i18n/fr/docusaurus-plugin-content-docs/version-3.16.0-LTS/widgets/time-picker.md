---
id: time-picker
title: Time Picker
---

Le composant **Time Picker** peut être utilisé pour sélectionner une heure sans saisie de date. Il propose des formats personnalisables, une validation et un style configurable.

## Propriétés

| Propriété      | Description                                                                 | Valeur attendue                         |
| :------------ | :-------------------------------------------------------------------------- | -------------------------------------- |
| Label         | Le texte à utiliser comme libellé du Time Picker.                       | String (par ex., `Time of Arrival`).      |
| Time Format   | Sélectionnez le format d'heure dans la liste déroulante. Le format d'heure par défaut est **HH:mm**. | Sélectionnez dans la liste déroulante (par ex. `hh:mm A`). |
| Default value | La valeur par défaut que le composant prendra au chargement de l'application.      | String (par ex., `11:00`).                |

## Événements

| Événement     | Description                                                |
| :-------- | :--------------------------------------------------------- |
| On select | Se déclenche chaque fois que l'utilisateur sélectionne une heure.                 |
| On focus  | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du Time Picker.  |
| On blur   | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du Time Picker. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des Component Specific Actions (CSA), qui peuvent être déclenchées par un événement ou par la requête RunJS indiquée :

| Action                | <div style={{ width:"200px"}}> Description </div>                 | Comment y accéder                                       |
| :-------------------- | :---------------------------------------------------------------- | :-------------------------------------------------- |
| setTime( )            | Définit l'heure dans le composant Time Picker.                           | `components.timepicker1.setTime(time)`              |
| setValue( )           | Définit à la fois la date et l'heure.                                | `components.timepicker1.setValue(value)`            |
| setMinTime( )         | Définit l'heure minimale sélectionnable dans le Time Picker.    | `components.timepicker1.setMinTime(value)`          |
| setMaxTime( )         | Définit l'heure maximale sélectionnable dans le Time Picker.    | `components.timepicker1.setMaxTime(value)`          |
| clearValue( )         | Efface la valeur du Time Picker.                              | `components.timepicker1.clearValue()`               |
| setValueinTimeStamp() | Définit la valeur de date et d'heure au format Unix.                  | `components.timepicker1.setValueinTimeStamp(value)` |
| setDisplayTimezone( ) | Définit le fuseau horaire dans lequel l'heure sélectionnée sera affichée.   | `components.timepicker1.setDisplayTimezone(value)`  |
| setStoreTimezone( )   | Spécifie le fuseau horaire dans lequel l'heure sélectionnée sera stockée. | `components.timepicker1.setStoreTimezone(value)`    |
| setVisibility( )      | Définit l'état de visibilité du Time Picker.                     | `components.timepicker1.setVisibility()`            |
| setLoading( )         | Définit l'état de chargement du Time Picker.                        | `components.timepicker1.setLoading()`               |
| setDisable( )         | Désactive le Time Picker.                                         | `components.timepicker1.setDisable()`               |
| setFocus( )           | Place le focus du curseur sur le Time Picker.                  | `components.timepicker1.setLoading()`               |
| setBlur( )            | Retire le focus du curseur du Time Picker.             | `components.timepicker1.setBlur()`                  |

## Variables exposées

Les variables exposées suivantes peuvent être consultées dynamiquement à l'aide de la requête JS indiquée :

| Variables     | <div style={{ width:"200px"}}> Description </div>                    | Comment y accéder                              |
| :------------ | :------------------------------------------------------------------- | :----------------------------------------- |
| value         | Ce composant contient la valeur saisie dans le composant Time Picker. | `{{components.timepicker1.value}}`         |
| label         | Contient la valeur du libellé du composant.                            | `{{components.timepicker1.label}}`         |
| minTime       | Contient la première heure sélectionnable.                                  | `{{components.timepicker1.minTime}}`       |
| maxTime       | Contient la dernière heure sélectionnable.                                    | `{{components.timepicker1.maxTime}}`       |
| selectedTime  | Contient la valeur de l'heure sélectionnée.                                    | `{{components.timepicker1.selectedTime}}`  |
| unixTimestamp | Contient la valeur au format UNIX.                                      | `{{components.timepicker1.unixTimestamp}}` |
| displayValue  | Contient la valeur affichée par le composant.                            | `{{components.timepicker1.displayValue}}`  |
| timeFormat    | Renvoie le format d'heure sous forme de chaîne.                                 | `{{components.timepicker1.timeFormat}}`    |
| isValid       | Indique si la saisie respecte les critères de validation.                    | `{{components.timepicker1.isValid}})`      |
| isMandatory   | Indique si le champ est obligatoire.                                 | `{{components.timepicker1.isMandatory}}`   |
| isLoading     | Indique si le composant est en cours de chargement.                               | `{{components.timepicker1.isLoading}}`     |
| isVisible     | Indique si le composant est visible.                               | `{{components.timepicker1.isVisible}}`     |
| isDisabled    | Indique si le composant est désactivé.                              | `{{components.timepicker1.isDisabled}}`    |

## Validation

| Option de validation         | <div style={{ width:"200px"}}> Description </div>                                      | Valeur attendue                                                                                                                                          |
| :------------------------ | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Min Time                  | Spécifie la première heure sélectionnable. Toute heure antérieure au Min Time sera désactivée. | String (par ex., `05:35`)                                                                                                                              |
| Max Time                  | Spécifie la dernière heure sélectionnable. Toute heure postérieure au Max Time sera désactivée.    | String (par ex., `15:45`)                                                                                                                              |
| Custom validation         | Ajoute une validation personnalisée pour la saisie de l'heure à l'aide de l'opérateur ternaire.                 | Custom Validation Statement (par ex., `{{moment(components.timepicker1.value).format('HH:mm') > moment().format('HH:mm') ? true : 'You are late!' }}`) |
| Make this field mandatory | Rend le champ obligatoire.                                                             | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique.                            |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                            | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :--------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Loading state                                | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant.                                               | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant.                                           | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                      | Fournit des informations supplémentaires au survol.                                    | String (par ex., `Select the time of arrival.`).                                                                                |

## Appareils

| Propriété        | Description                                  | Valeur attendue                                                                                                                    |
| :-------------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile  | Rend le composant visible en vue mobile.  | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| Propriété    | Description                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| Label Color | Définit la couleur du texte du libellé.                                                  |
| Alignment   | Détermine la position du libellé, à choisir entre top/side et left/right. |
| Width       | Spécifie le pourcentage de la largeur du composant que doit occuper le libellé.    |

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
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
