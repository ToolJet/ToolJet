---
id: text-input
title: Text Input
---

Le composant **Text Input** permet aux utilisateurs de saisir une seule ligne de texte. Il peut être utilisé comme composant autonome ou dans des champs de formulaire. Dans ce document, nous allons passer en revue toutes les options de configuration du composant **Text Input**.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div>                      | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :--------------------------------------------------------------------- | :--------------------------------------------------- |
| Label                                          | Texte affiché comme libellé du champ.                            | String (par ex., `Enter Your Name`).                    |
| Placeholder                                    | Une indication affichée pour guider l'utilisateur sur ce qu'il doit saisir.                   | String (par ex., `John Doe`).                           |
| Default Value                                  | La valeur par défaut que le composant prendra au chargement de l'application. | String (par ex., `Default Text`).                       |

## Événements

| Événement            | Description                                                                                                       |
| :--------------- | :---------------------------------------------------------------------------------------------------------------- |
| On change        | Se déclenche chaque fois que l'utilisateur saisit quelque chose dans le champ de texte.                                                     |
| On enter pressed | Se déclenche chaque fois que l'utilisateur appuie sur la touche Entrée du clavier après avoir saisi du texte dans le composant Text Input. |
| On focus         | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du champ de texte.                                                    |
| On blur          | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du champ de texte.                                                   |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des Component Specific Actions (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> |   <div style={{ width:"135px"}}> Description </div>   |  <div style={{width: "200px"}}> Comment y accéder </div>  |
| :------------------------------------------- | :---------------------------------------------------- | :---------------------------------------------------- |
| setText()                                    | Définit la valeur du champ de saisie.                    | `components.textinput1.setText('this is input text')` |
| clear()                                      | Efface le texte saisi dans le champ de saisie.           | `components.textinput1.clear()`                       |
| setFocus()                                   | Place le focus du curseur sur le champ de saisie.      | `components.textinput1.setFocus()`                    |
| setBlur()                                    | Retire le focus du curseur du champ de saisie. | `components.textinput1.setBlur()`                     |
| setVisibility()                              | Définit la visibilité du composant.                 | `components.textinput1.setVisibility(false)`          |
| setLoading()                                 | Définit l'état de chargement du composant.              | `components.textinput1.setLoading(true)`              |
| setDisable()                                 | Désactive le composant.                               | `components.textinput1.setDisable(true)`              |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | Description | Comment y accéder |
| :----------- | :-----------| :------------ |
| value        | Contient la valeur saisie par l'utilisateur dans le composant. | `{{components.textinput1.value}}`       |
| label        | Contient la valeur du libellé du composant.             | `{{components.textinput1.label}}`       |
| isValid      | Indique si la saisie respecte les critères de validation.     | `{{components.textinput1.isValid}}`     |
| isMandatory  | Indique si le champ est obligatoire.                   | `{{components.textinput1.isMandatory}}` |
| isLoading    | Indique si le composant est en cours de chargement.                | `{{components.textinput1.isLoading}}`   |
| isVisible    | Indique si le composant est visible.                | `{{components.textinput1.isVisible}}`   |
| isDisabled   | Indique si le composant est désactivé.               | `{{components.textinput1.isDisabled}}`  |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message 'Field cannot be empty' si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Regex | Expression régulière permettant de valider la saisie. | Regular Expression Pattern (par ex., `^\d{3}-\d{2}-\d{4}$`). |
| Min length | Définit le nombre minimum de caractères autorisés. | Integer (par ex., `6` pour un minimum de 6 caractères). |
| Max length | Définit le nombre maximum de caractères autorisés. | Integer (par ex., `12` pour un maximum de 12 caractères). |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions particulières. | Logical Expression (par ex., `{{components.textinput1.value<5&&"Value needs to be more than 5"}}`). |

Pour ajouter une regex dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{(/^\d{1,10}$/.test(components.textinput1.value)) ? '' : 'Error message';}}`

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :-------------------------------------------------| :-----------------------------------------------------------|
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | String (par ex., `Enter your name here.` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété du libellé </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :-----------------------------------------------------------|
| Text | Définit la couleur du libellé du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex. |
| Alignment | Définit la position du libellé et du champ de saisie. | Cliquez sur les options bascules ou sur **fx** pour saisir un code qui renvoie de manière programmatique une valeur d'alignement - **side** ou **top**. |
| Width | Définit la largeur du champ de saisie. | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-la pour ajuster manuellement la largeur à l'aide du curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou au **Field**. |

### Field

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :-----------------------------------------------------------|
| Background | Définit la couleur d'arrière-plan du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex. |
| Border | Définit la couleur de bordure du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex. |
| Text | Définit la couleur du texte saisi dans le composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex. |
| Placeholder text | Définit la couleur du texte d'indication affiché lorsque le champ est vide. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex. |
| Error text | Définit la couleur du texte du message de validation affiché.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique un code couleur Hex. |
| Icon | Vous permet de sélectionner une icône pour le composant. | Activez la visibilité de l'icône, sélectionnez l'icône et sa couleur. Vous pouvez également la définir de manière programmatique via **fx**. |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique via **fx**. |

### Container

**Padding** <br/>
Vous permet de conserver un remplissage standard en activant l'option `Default`.

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::
