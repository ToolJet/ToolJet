---
id: currency-input
title: Currency Input
---

Le composant **Currency Input** permet aux utilisateurs de saisir des valeurs formatées en devise. Il est particulièrement utile pour les formulaires et les applications financières où les valeurs numériques doivent être formatées avec des symboles de devise, des décimales et des séparateurs de milliers.

Ce composant garantit un formatage cohérent des valeurs monétaires, empêche les saisies invalides et prend en charge une gamme d'options de personnalisation, telles que le type de devise et la précision.

## Example Usage

Une équipe financière doit créer un formulaire de remboursement de dépenses où les employés soumettent des demandes dans différentes devises. À l'aide du composant Currency Input, les employés peuvent sélectionner leur devise de dépense (USD, EUR, GBP, etc.) dans la liste déroulante, saisir le montant avec un formatage automatique, et le formulaire capture à la fois la valeur brute et la valeur formatée avec le symbole de la devise pour le traitement.

## Properties

| <div style={{ width:"150px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| ---------------------------------------------- | --------------------------------------------------| ---------------------------------------------------- |
| Label | Texte à afficher comme label du champ. | Chaîne (par ex. `Reimbursement Amount`). |
| Placeholder | Une indication affichée pour guider l'utilisateur sur ce qu'il doit saisir. | Chaîne (par ex. `Enter the amount in USD`). |
| Default value | La valeur par défaut que le composant contiendra au chargement de l'application. | Nombre (par ex. `83.67`). |
| Decimal places | Nombre de décimales à afficher après le séparateur décimal. | Entier (par ex. `2`). |
| Number format | Définit le style de formatage numérique pour la valeur de la devise. | Sélectionnez `US / UK (eg. 1,234.56)` pour la virgule comme séparateur de milliers et le point comme séparateur décimal, ou `European (eg. 1.234,56)` pour le point comme séparateur de milliers et la virgule comme séparateur décimal. Utilisez **fx** pour définir dynamiquement (`us` ou `eu`). |
| Default Currency | Définit le format de devise à utiliser par défaut. | Sélectionnez la devise par défaut dans la liste déroulante ou mettez-la à jour dynamiquement avec **fx**. |
| Enable currency change | Permet à l'utilisateur de sélectionner une devise différente dans une liste déroulante. Si désactivé, l'utilisateur ne peut saisir que la devise par défaut. | Activez ou désactivez à l'aide du bouton bascule ou utilisez **fx** pour la mettre à jour dynamiquement. |
| Show currency flag | Décidez si le drapeau de la devise doit être visible avec le symbole de la devise. | Activez ou désactivez à l'aide du bouton bascule ou utilisez **fx** pour la mettre à jour dynamiquement. |

## Events

| Événement            | Description                                                       |
| :--------------- | :---------------------------------------------------------------- |
| On change        | Se déclenche lorsque l'utilisateur saisit dans le champ.                  |
| On enter pressed | Se déclenche chaque fois que l'utilisateur appuie sur la touche Entrée du clavier. |
| On focus         | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du champ de saisie.         |
| On blur          | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du champ de saisie.        |

:::info
Consultez la documentation de la [Référence des Actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA). Vous pouvez les déclencher à l'aide d'un événement ou d'une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setValue      | Définit la valeur et éventuellement le pays du champ Currency Input. | `components.currencyinput1.setValue(value, country)` |
| clear         | Efface le champ de saisie.                           | `components.currencyinput1.clear()`                  |
| setFocus      | Définit le focus du curseur sur le champ de saisie.  | `components.currencyinput1.setFocus()`               |
| setBlur       | Retire le focus du champ de saisie.               | `components.currencyinput1.setBlur()`                |
| setVisibility | Définit la visibilité du composant.             | `components.currencyinput1.setVisibility(false)`     |
| setLoading    | Définit l'état de chargement du composant.          | `components.currencyinput1.setLoading(true)`         |
| setDisable    | Désactive le composant.                           | `components.currencyinput1.setDisable(true)`         |
| setCountryCode | Définit le code pays de manière programmatique.          | `components.currencyinput1.setCountryCode('US')`     |

## Exposed Variables

| Variable       | <div style={{ width:"250px"}}> Description </div>                           | Comment y accéder                                  |
| :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| value          | Contient la valeur du composant.                                           | `{{components.currencyinput1.value}}`          |
| label          | Contient la valeur du label du composant.                                   | `{{components.currencyinput1.label}}`          |
| isValid        | Indique si l'entrée respecte les critères de validation.                           | `{{components.currencyinput1.isValid}}`        |
| isMandatory    | Indique si le champ est obligatoire.                                         | `{{components.currencyinput1.isMandatory}}`    |
| isLoading      | Indique si le composant est en cours de chargement.                                      | `{{components.currencyinput1.isLoading}}`      |
| isVisible      | Indique si le composant est visible.                                      | `{{components.currencyinput1.isVisible}}`      |
| isDisabled     | Indique si le composant est désactivé.                                     | `{{components.currencyinput1.isDisabled}}`     |
| country        | Contient le pays sélectionné dans le composant currency input.                 | `{{components.currencyinput1.country}}`        |
| formattedValue | Contient la valeur formatée en devise selon la saisie et le pays sélectionné. | `{{components.currencyinput1.formattedValue}}` |

## Validation

| <div style={{ width:"200px"}}> Option de validation </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message « Field cannot be empty » si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement avec **fx**. |
| Regex | Expression régulière pour valider la saisie. | Modèle d'expression régulière (par ex., `^\d+(\.\d{1,2})?$`). |
| Min value | Définit la valeur minimale autorisée. | Entier (par ex., `99`). |
| Max value | Définit la valeur maximale autorisée. | Entier (par ex., `1000`). |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions spécifiques. | Expression logique (par ex., `{{components.currencyinput1.value<99&&"Value needs to be more than $99"}}`). |

Pour ajouter une expression régulière (regex) dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{(/^\d+(\.\d{1,2})?$/.test(components.currencyinput1.value)) ? '' : 'Invalid Input';}}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une chaîne d'affichage. | Chaîne (par ex., `Enter the amount in USD` ). |

## Devices

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Définit la couleur du label du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Alignment | Définit la position du label et du champ de saisie. | Sélectionnez `side` ou `top`, ou cliquez sur **fx** pour saisir du code qui retourne programmatiquement une valeur d'alignement - `side` ou **top**. |
| Width | Définit la largeur du champ de saisie. | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-la pour ajuster manuellement la largeur à l'aide du curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou par rapport au **Field**. |

### Field

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :--------------------------------------------------------------- | :------------------------------------------- |
| Background | Définit la couleur d'arrière-plan du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border | Définit la couleur de la bordure du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Accent | Définit la couleur d'accentuation du composant, utilisée pour la mise en évidence de l'état de focus. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Text | Définit la couleur du texte saisi dans le composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Error text | Définit la couleur du texte du message de validation affiché. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique avec **fx**. |

### Container

| <div style={{ width:"100px"}}> Propriété du container </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Padding | Ajoute un remplissage entre le composant et la limite de son container. | Sélectionnez `Default` pour un remplissage standard ou `None` pour le supprimer. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::

<br/>
---

## Need Help?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Veuillez le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
