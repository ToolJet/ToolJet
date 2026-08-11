---
id: toggle-switch-v2
title: Toggle Switch
---

Le composant **Toggle Switch** peut être utilisé pour des choix binaires, comme activer/désactiver une fonctionnalité ou activer/désactiver un paramètre.

<div style={{paddingTop:'24px'}}>

## Propriétés

### Data

| Propriété       | Description                                             | Valeur attendue                                                             |
| :------------- | :------------------------------------------------------ | :------------------------------------------------------------------------- |
| Label          | Le texte à utiliser comme libellé du toggle switch. | String (par ex., `Enable notifications`).                                     |
| Default status | Définit le statut par défaut au chargement de l'application.         | Basculez l'interrupteur on/off ou cliquez sur **fx** pour définir dynamiquement la valeur. |

</div>

<div style={{paddingTop:'24px'}}>

## Événements

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>                    |
| :------------------------------------------ | :------------------------------------------------------------------- |
| On change                                   | L'événement On change se déclenche lorsque la saisie du toggle switch change.    |
| On check (deprecated)                       | L'événement On check se déclenche lorsque le toggle switch est coché.     |
| On uncheck (deprecated)                     | L'événement On uncheck se déclenche lorsque le toggle switch est décoché. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant Toggle switch peuvent être contrôlées à l'aide des Component Specific Actions (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div>                                                                | <div style={{ width:"135px"}}> Comment y accéder </div>                                                             |
| :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| setChecked                                   | Modifie l'état du toggle switch à l'aide d'une action spécifique au composant, depuis n'importe quel gestionnaire d'événements. | Utilisez une requête RunJS (par ex., `await components.toggleswitch1.setChecked(true)`) ou déclenchez-la à l'aide d'un événement.    |
| setValue                                     | Définit la valeur du toggle switch.                                                                             | Utilisez une requête RunJS (par ex., `await components.toggleswitch1.setValue(true)`) ou déclenchez-la à l'aide d'un événement.      |
| setLoading                                   | Bascule l'état de chargement du toggle switch.                                                                  | Utilisez une requête RunJS (par ex., `await components.toggleswitch1.setLoading(true)`) ou déclenchez-la à l'aide d'un événement.    |
| setVisibility                                | Modifie la visibilité du toggle switch.                                                                     | Utilisez une requête RunJS (par ex., `await components.toggleswitch1.setVisibility(true)`) ou déclenchez-la à l'aide d'un événement. |
| setDisable                                   | Désactive ou active le toggle switch.                                                                           | Utilisez une requête RunJS (par ex., `await components.toggleswitch1.setDisable(true)`) ou déclenchez-la à l'aide d'un événement.    |
| toggle                                       | Bascule l'état actuel du toggle switch.                                                                  | Utilisez une requête RunJS (par ex., `await components.toggleswitch1.toggle()`) ou déclenchez-la à l'aide d'un événement.            |

</div>

<div style={{paddingTop:'24px'}}>

## Variables exposées

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div>                                        | <div style={{ width:"135px"}}> Comment y accéder </div>                                |
| :---------------------------------------------- | :--------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| value                                           | Contient la valeur booléenne `true` si le toggle switch est coché et `false` s'il ne l'est pas. | Accessible dynamiquement en JS (par ex., `{{components.toggleswitch1.value}}`).       |
| label                                           | Le libellé textuel du toggle switch.                                                     | Accessible dynamiquement en JS (par ex., `{{components.toggleswitch1.label}}`).       |
| isValid                                         | Indique si l'état du toggle switch est valide.                                           | Accessible dynamiquement en JS (par ex., `{{components.toggleswitch1.isValid}}`).     |
| isMandatory                                     | Indique si le toggle switch est obligatoire.                                             | Accessible dynamiquement en JS (par ex., `{{components.toggleswitch1.isMandatory}}`). |
| isLoading                                       | Indique si le toggle switch est en état de chargement.                                    | Accessible dynamiquement en JS (par ex., `{{components.toggleswitch1.isLoading}}`).   |
| isVisible                                       | Indique si le toggle switch est visible.                                               | Accessible dynamiquement en JS (par ex., `{{components.toggleswitch1.isVisible}}`).   |
| isDisabled                                      | Indique si le toggle switch est désactivé.                                              | Accessible dynamiquement en JS (par ex., `{{components.toggleswitch1.isDisabled}}`).  |

</div>

<div style={{paddingTop:'24px'}}>

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div>                  | <div style={{width: "200px"}}> Valeur attendue </div>                                                                         |
| :------------------------------------------------------ | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Make this field mandatory                               | Affiche un message 'Field cannot be empty' si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Custom validation                                       | Spécifie un message d'erreur de validation pour des conditions particulières.      | Logical Expression (par ex., `{{components.toggleswitch1.value === false &&"Value needs to be checked"}}`).                     |

Pour ajouter une regex dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{(/^\d{1,10}$/.test(components.textinput1.value)) ? '' : 'Error message';}}`

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                                  | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Loading state                                | Active un indicateur de chargement, souvent utilisé avec la propriété isLoading pour indiquer une progression. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant. À activer/désactiver ou à définir dynamiquement.                                                          | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant. À activer/désactiver ou à définir dynamiquement.                                                      | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                      | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher.                                          | String (par ex., `Are you a registered user?` ).                                                                                |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

# Styles

## Label

| <div style={{ width:"100px"}}> Propriété du libellé </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>                                                                        |
| :--------------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| Text color                                           | Définit la couleur du libellé du composant.          | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex.                                 |
| Alignment                                            | Définit la position du libellé et du champ de saisie.   | Cliquez sur les options bascules ou sur **fx** pour saisir un code qui renvoie de manière programmatique une valeur d'alignement - `left` ou `right`. |

## Switch

| <div style={{ width:"100px"}}> Propriété du libellé </div> | <div style={{ width:"150px"}}> Description </div>              | <div style={{ width:"250px"}}> Options de configuration </div>                                            |
| :--------------------------------------------------- | :------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| Border color                                         | Définit la couleur du toggle switch.                           | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex.     |
| Checked color                                        | Définit la couleur du toggle switch lorsqu'il est coché.        | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex.     |
| Unchecked color                                      | Définit la couleur du toggle switch lorsqu'il n'est pas coché.    | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex.     |
| Handle color                                         | Définit la couleur du symbole coché à l'intérieur du toggle switch. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex.     |
| Box shadow                                           | Définit les propriétés d'ombre du composant.               | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique via **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

</div>
