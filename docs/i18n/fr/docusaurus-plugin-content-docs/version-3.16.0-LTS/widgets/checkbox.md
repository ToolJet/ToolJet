---
id: checkbox
title: Checkbox
---

Le composant **Checkbox** permet aux utilisateurs de faire un choix binaire, comme sélectionner ou désélectionner une option.

## Properties

### Data

| Propriété       | Description                                        | Valeur attendue                                                             |
| :------------- | :------------------------------------------------- | :------------------------------------------------------------------------- |
| Label          | Le texte à utiliser comme label pour la case à cocher. | Chaîne (par ex., `Select payment preference`).                                |
| Default status | Définit l'état par défaut au chargement de l'application.    | Basculez le commutateur marche/arrêt ou cliquez sur **fx** et définissez dynamiquement la valeur. |

## Events

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>  |
| :------------------------------------------ | :------------------------------------------------- |
| On change                                   | Se déclenche chaque fois que l'entrée de la case à cocher est modifiée.   |
| On check (deprecated)                       | Se déclenche chaque fois que la case à cocher est cochée.   |
| On uncheck (deprecated)                     | Se déclenche chaque fois que la case à cocher est décochée. |

:::info
Consultez la documentation de la [Référence des Actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant Checkbox peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setChecked | Modifie l'état du composant checkbox à l'aide d'une action spécifique au composant depuis n'importe quel gestionnaire d'événement. | Utilisez une requête RunJS (par ex., `await components.checkbox1.setChecked(true)`) ou déclenchez-la via un événement.    |
| setValue | Définit la valeur de la case à cocher. | Utilisez une requête RunJS (par ex., `await components.checkbox1.setValue(true)`) ou déclenchez-la via un événement.      |
| setLoading | Bascule l'état de chargement de la case à cocher. | Utilisez une requête RunJS (par ex., `await components.checkbox1.setLoading(true)`) ou déclenchez-la via un événement.    |
| setVisibility | Modifie la visibilité de la case à cocher. | Utilisez une requête RunJS (par ex., `await components.checkbox1.setVisibility(true)`) ou déclenchez-la via un événement. |
| setDisable | Désactive ou active la case à cocher. | Utilisez une requête RunJS (par ex., `await components.checkbox1.setDisable(true)`) ou déclenchez-la via un événement.    |
| toggle | Bascule l'état actuel de la case à cocher. | Utilisez une requête RunJS (par ex., `await components.checkbox1.toggle()`) ou déclenchez-la via un événement.            |

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :---------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| value | Contient la valeur booléenne `true` si la case est cochée et `false` si elle ne l'est pas. | Accessible dynamiquement en JS (par ex., `{{components.checkbox1.value}}`).       |
| label | Le label textuel de la case à cocher. | Accessible dynamiquement en JS (par ex., `{{components.checkbox1.label}}`).       |
| isValid | Indique si l'état de la case à cocher est valide. | Accessible dynamiquement en JS (par ex., `{{components.checkbox1.isValid}}`).     |
| isMandatory | Indique si la case à cocher est obligatoire. | Accessible dynamiquement en JS (par ex., `{{components.checkbox1.isMandatory}}`). |
| isLoading | Indique si la case à cocher est en état de chargement. | Accessible dynamiquement en JS (par ex., `{{components.checkbox1.isLoading}}`).   |
| isVisible | Indique si la case à cocher est visible. | Accessible dynamiquement en JS (par ex., `{{components.checkbox1.isVisible}}`).   |
| isDisabled | Indique si la case à cocher est désactivée. | Accessible dynamiquement en JS (par ex., `{{components.checkbox1.isDisabled}}`).  |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message « Field cannot be empty » si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions spécifiques. | Expression logique (par ex., `{{components.checkbox1.value === false &&"Value needs to be checked"}}`). |

Pour ajouter une expression régulière (regex) dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{(/^\d{1,10}$/.test(components.textinput1.value)) ? '' : 'Error message';}}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne pour l'affichage. | Chaîne (par ex., `Are you a registered user?` ). |

## Devices

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text color                                           | Définit la couleur du label du composant.          | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal.                                 |
| Alignment                                            | Définit la position du label et du champ de saisie.   | Cliquez sur les options de bascule ou cliquez sur **fx** pour saisir du code qui retourne programmatiquement une valeur d'alignement - `left` ou `right`. |

### Switch

| <div style={{ width:"100px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div>         | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :-------------------------------------------------------- | :---------------------------------------------------------- |
| Border color | Définit la couleur de la case à cocher. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal.     |
| Checked color | Définit la couleur de la case à cocher lorsqu'elle est cochée. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal.     |
| Unchecked color | Définit la couleur de la case à cocher lorsqu'elle n'est pas cochée. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal.     |
| Handle color | Définit la couleur du symbole coché à l'intérieur de la case à cocher. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal.     |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique avec **fx**. |
 
### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::
