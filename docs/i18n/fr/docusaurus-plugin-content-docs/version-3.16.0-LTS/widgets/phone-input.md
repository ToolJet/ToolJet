---
id: phone-input
title: Phone Input
---

Le composant **Phone Input** permet aux utilisateurs de saisir et de valider des numéros de téléphone. Il peut être utilisé de manière autonome ou au sein d'un **Form** lorsque la collecte d'un numéro de téléphone est requise. Le composant prend en charge les formats internationaux, le formatage automatique et la validation pour garantir une saisie de données précise. Dans ce document, nous passerons en revue toutes les options de configuration du composant **Phone Input**.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Label | Texte à afficher comme étiquette du champ. | Chaîne (par ex., `Contact Number`). |
| Placeholder | Une indication affichée pour guider l'utilisateur sur ce qu'il doit saisir. | Chaîne (par ex., `Please enter your contact number`). |
| Default Value | La valeur par défaut que le composant contiendra au chargement de l'application. | Chaîne (par ex., `(999) 999-9999`). |
| Default Country | Définit le code pays par défaut à utiliser. | Sélectionnez le pays par défaut dans la liste déroulante ou mettez-le à jour dynamiquement avec **fx**.  |
| Enable country change | Permet à l'utilisateur de sélectionner un code pays différent dans la liste déroulante. Si désactivé, l'utilisateur ne peut saisir que le code pays par défaut. | Activez ou désactivez avec le bouton bascule ou utilisez **fx** pour le mettre à jour dynamiquement. |

## Events

| Event            | Description                                                       |
| :--------------- | :---------------------------------------------------------------- |
| On change        | Se déclenche lorsque l'utilisateur saisit du texte dans le champ.                  |
| On enter pressed | Se déclenche chaque fois que l'utilisateur appuie sur la touche Entrée du clavier. |
| On focus         | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du champ.         |
| On blur          | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du champ.        |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des component-specific actions (CSA) ; vous pouvez les déclencher via un événement ou en utilisant une requête RunJS.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> Requête RunJS </div> |
| :------------------------------------------- | :------------------------------------------------ | :------------------------------------------------ |
| setValue( )                                  | Définit la valeur du champ **Currency Input**.   | `components.phoneinput1.setValue(value)`          |
| clear( )                                     | Efface le champ de saisie.                           | `components.phoneinput1.clear()`                  |
| setFocus( )                                  | Positionne le focus du curseur sur le champ de saisie.  | `components.phoneinput1.setFocus()`               |
| setBlur( )                                   | Retire le focus du champ de saisie.               | `components.phoneinput1.setBlur()`                |
| setVisibility( )                             | Définit la visibilité du composant.             | `components.phoneinput1.setVisibility(false)`     |
| setLoading( )                                | Définit l'état de chargement du composant.          | `components.phoneinput1.setLoading(true)`         |
| setDisable( )                                | Désactive le composant.                           | `components.phoneinput1.setDisable(true)`         |
| setCountryCode ( )                           | Définit le code pays de manière programmatique.           | `{{components.phoneinput1.setCountryCode("US")}}` |

## Variables exposées

| Variable       | <div style={{ width:"250px"}}> Description </div>         | Comment y accéder                               |
| :------------- | :-------------------------------------------------------- | :------------------------------------------ |
| value          | Contient la valeur saisie par l'utilisateur dans le composant.     | `{{components.phoneinput1.value}}`          |
| label          | Contient la valeur de l'étiquette du composant.                 | `{{components.phoneinput1.label}}`          |
| isValid        | Indique si la saisie respecte les critères de validation.         | `{{components.phoneinput1.isValid}}`        |
| isMandatory    | Indique si le champ est obligatoire.                       | `{{components.phoneinput1.isMandatory}}`    |
| isLoading      | Indique si le composant est en cours de chargement.                    | `{{components.phoneinput1.isLoading}}`      |
| isVisible      | Indique si le composant est visible.                    | `{{components.phoneinput1.isVisible}}`      |
| isDisabled     | Indique si le composant est désactivé.                   | `{{components.phoneinput1.isDisabled}}`     |
| country        | Contient le pays sélectionné dans le composant phone input.  | `{{components.phoneinput1.country}}`        |
| countryCode    | Contient l'indicatif téléphonique du pays sélectionné.                   | `{{components.phoneinput1.countryCode}}`    |
| formattedValue | La valeur avec le format exact affiché dans le champ phone input. | `{{components.phoneinput1.formattedValue}}` |

## Validation

| <div style={{ width:"200px"}}> Option de validation </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{width: "500px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message 'Field cannot be empty' si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Regex | Expression régulière pour valider la saisie. | Motif d'expression régulière (par ex., `^\d{1,10}$` ). |
| Min length | Définit le nombre minimum de caractères autorisés. | Entier (par ex., `10` pour un minimum de 10 caractères). |
| Max length | Définit le nombre maximum de caractères autorisés. | Entier (par ex., `10` pour un maximum de 10 caractères). |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions spécifiques. | Expression logique (par ex., `{{components.phoneinput1.value.length === 10&&"Phone number must be 10 digits"}}`). |

Pour ajouter une expression regex dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{(/^\d{1,10}$/.test(components.phoneinput1.value)) ? '' : 'Error message';}}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une chaîne d'affichage. | Chaîne (par ex., `Enter the contact number` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété Label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Définit la couleur de l'étiquette du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Alignment | Définit la position de l'étiquette et du champ de saisie. | Sélectionnez `side` ou `top` ou cliquez sur **fx** pour saisir du code qui renvoie de manière programmatique une valeur d'alignement - `side` ou `top`. |
| Width | Définit la largeur du champ de saisie. | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-la pour ajuster manuellement la largeur à l'aide du curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou au **Field**. |

### Field

| <div style={{ width:"100px"}}> Propriété Field </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Définit la couleur de fond du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Border | Définit la couleur de bordure du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Text | Définit la couleur du texte saisi dans le composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Error text | Définit la couleur du texte du message de validation affiché. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Icon | Permet de sélectionner une icône pour le composant. | Activez la visibilité de l'icône, puis sélectionnez l'icône et sa couleur. Vous pouvez aussi la définir de manière programmatique avec **fx**. |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique avec **fx**. |

### Container

**Padding** <br/>
Permet de conserver un espacement standard en activant l'option `Default`.

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::
