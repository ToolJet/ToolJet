---
id: email-input
title: Email Input
---

Le composant **Email Input** dans ToolJet permet aux utilisateurs de saisir et de valider des adresses e-mail dans votre application. Il fournit une validation intégrée pour garantir que la saisie correspond à un format d'e-mail valide, vous aidant à collecter des données utilisateur fiables sans effort.

## Properties

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div>                      | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :--------------------------------------------------------------------- | :--------------------------------------------------- |
| Label                                          | Texte à afficher comme label du champ.                            | Chaîne (par ex., `Email ID`).                           |
| Placeholder                                    | Une indication affichée pour guider l'utilisateur sur ce qu'il doit saisir.                   | Chaîne (par ex., `Please enter your email address`).    |
| Default Value                                  | La valeur par défaut que le composant contiendra au chargement de l'application. | Chaîne (par ex., `john@example.com`).                   |

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

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher à l'aide d'un événement ou d'une requête RunJS.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> Requête RunJS </div> |
| :-------------------------------------------- | :------------------------------------------------ | :------------------------------------------------ |
| setText( )                                   | Définit la valeur du champ **Email Input**.      | `components.emailinput1.setText(text)`            |
| clear( )                                     | Efface le champ de saisie.                           | `components.emailinput1.clear()`                  |
| setFocus( )                                  | Définit le focus du curseur sur le champ de saisie.  | `components.emailinput1.setFocus()`               |
| setBlur( )                                   | Retire le focus du champ de saisie.               | `components.emailinput1.setBlur()`                |
| setVisibility( )                             | Définit la visibilité du composant.             | `components.emailinput1.setVisibility(false)`     |
| setLoading( )                                | Définit l'état de chargement du composant.          | `components.emailinput1.setLoading(true)`         |
| setDisable( )                                | Désactive le composant.                           | `components.emailinput1.setDisable(true)`         |

## Exposed Variables

| Variable    | <div style={{ width:"250px"}}> Description </div>     | Comment y accéder                            |
| :---------- | :---------------------------------------------------- | :--------------------------------------- |
| value       | Contient la valeur saisie par l'utilisateur dans le composant. | `{{components.emailinput1.value}}`       |
| label       | Contient la valeur du label du composant.             | `{{components.emailinput1.label}}`       |
| isValid     | Indique si l'entrée respecte les critères de validation.     | `{{components.emailinput1.isValid}}`     |
| isMandatory | Indique si le champ est obligatoire.                   | `{{components.emailinput1.isMandatory}}` |
| isLoading   | Indique si le composant est en cours de chargement.                | `{{components.emailinput1.isLoading}}`   |
| isVisible   | Indique si le composant est visible.                | `{{components.emailinput1.isVisible}}`   |
| isDisabled  | Indique si le composant est désactivé.               | `{{components.emailinput1.isDisabled}}`  |

## Validation

| <div style={{ width:"200px"}}> Option de validation </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{width: "500px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message « Field cannot be empty » si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Regex | Expression régulière pour valider la saisie. | Modèle d'expression régulière (par ex., `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` ). |
| Min length | Définit le nombre minimum de caractères autorisés. | Entier (par ex., `10` pour un minimum de 10 caractères). |
| Max length | Définit le nombre maximum de caractères autorisés. | Entier (par ex., `10` pour un maximum de 10 caractères). |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions spécifiques. | Expression logique (par ex., `{{ !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(components.emailinput1.value) && "Please enter a valid email address" }}`). |

Pour ajouter une expression régulière (regex) dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{ !/^[^\s@]+@tooljet\.com$/.test(components.emailinput1.value) ? '' : "Please enter a valid tooljet.com email address" }}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une chaîne d'affichage. | Chaîne (par ex., `Enter the email address` ). |

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
| Alignment | Définit la position du label et du champ de saisie.   | Sélectionnez `side` ou `top`, ou cliquez sur **fx** pour saisir du code qui retourne programmatiquement une valeur d'alignement - `side` ou `top`. |
| Width | Définit la largeur du champ de saisie. | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-la pour ajuster manuellement la largeur à l'aide du curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou par rapport au **Field**. |

### Field

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :--------------------------------------------------------------- | :------------------------------------------- |
| Background | Définit la couleur d'arrière-plan du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border | Définit la couleur de la bordure du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Text | Définit la couleur du texte saisi dans le composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Error text | Définit la couleur du texte du message de validation affiché. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Icon | Vous permet de sélectionner une icône pour le composant. | Activez la visibilité de l'icône, et sélectionnez l'icône et sa couleur. Vous pouvez également la définir de manière programmatique avec **fx**. |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique avec **fx**. |

### Container

**Padding** <br/>
Vous permet de maintenir un remplissage (padding) standard en activant l'option `Default`.

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::
