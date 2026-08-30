---
id: number-input
title: Number Input
---

Le composant **Number Input** permet aux utilisateurs de saisir des valeurs numériques. Il peut être utilisé comme composant autonome ou dans des champs de formulaire. Dans ce document, nous allons passer en revue toutes les options de configuration du composant **Number Input**.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div>                      | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :--------------------------------------------------------------------- | :--------------------------------------------------- |
| Label                                          | Texte à afficher comme libellé du champ.                            | Chaîne de caractères (par ex., `Age`).                                |
| Placeholder                                    | Une indication affichée pour guider l'utilisateur sur ce qu'il doit saisir.                   | Chaîne de caractères (par ex., `John Doe`).                           |
| Default value                                  | La valeur par défaut que le composant contiendra au chargement de l'application. | Chaîne de caractères (par ex., `Default Text`).                       |
| Decimal places                                 | Spécifie le nombre de décimales pour les valeurs numériques.           | Entier (par ex., `2`).                                 |

## Événements

| Événement            | Description                                                                                                      |
| :--------------- | :--------------------------------------------------------------------------------------------------------------- |
| On change        | Se déclenche chaque fois que l'utilisateur saisit quelque chose dans le champ de saisie.                                                   |
| On focus         | Se déclenche lorsque l'utilisateur clique dans le champ de saisie.                                                        |
| On blur          | Se déclenche lorsque l'utilisateur clique hors du champ de saisie.                                                       |
| On enter pressed | Se déclenche lorsque l'utilisateur appuie sur la touche entrée du clavier après avoir saisi du texte dans le champ de saisie. |

:::info
Consultez la documentation de la **[Référence des actions](/docs/actions/run-query)** pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), vous pouvez les déclencher via un événement ou utiliser une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div>     | <div style={{width: "200px"}}> Comment y accéder </div> |
| :------------------------------------------- | :---------------------------------------------------- | :-------------------------------------------------- |
| setText()                                    | Définit la valeur du champ de saisie.                    | `components.numberinput1.setText(1)`           |
| clear()                                      | Efface le texte saisi dans le champ de saisie.           | `components.numberinput1.clear()`              |
| setFocus()                                   | Place le focus du curseur sur le champ de saisie.      | `components.numberinput1.setFocus()`           |
| setBlur()                                    | Retire le focus du curseur du champ de saisie. | `components.numberinput1.setBlur()`            |
| setVisibility()                              | Définit la visibilité du composant.                 | `components.numberinput1.setVisibility(false)` |
| setLoading()                                 | Définit l'état de chargement du composant.              | `components.numberinput1.setLoading(true)`     |
| setDisable()                                 | Désactive le composant.                               | `components.numberinput1.setDisable(true)`     |

:::info
Consultez les **actions spécifiques au composant** disponibles pour ce composant **[ici](/docs/actions/control-component)**.
:::

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div>    |                      Description                      |              Comment y accéder                |
| :------------------------------------------------ | :---------------------------------------------------- | :---------------------------------------- |
|  value                                            | Contient la valeur saisie par l'utilisateur dans le composant. | `{{components.numberinput1.value}}`       |
|  label                                            | Contient la valeur du libellé du composant.             | `{{components.numberinput1.label}}`       |
|  isValid                                          | Indique si l'entrée respecte les critères de validation.     | `{{components.numberinput1.isValid}}`     |
|  isMandatory                                      | Indique si le champ est requis.                   | `{{components.numberinput1.isMandatory}}` |
|  isLoading                                        | Indique si le composant est en cours de chargement.                | `{{components.numberinput1.isLoading}}`   |
|  isVisible                                        | Indique si le composant est visible.                | `{{components.numberinput1.isVisible}}`   |
|  isDisabled                                       | Indique si le composant est désactivé.               | `{{components.numberinput1.isDisabled}}`  |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche le message 'Field cannot be empty' si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Regex | Expression régulière pour valider la saisie. | Motif d'expression régulière (par ex., `^\d{10}$`). |
| Min value | Définit la valeur minimale autorisée. | Entier (par ex., `10` pour une valeur minimale de 10). |
| Max value | Définit la valeur maximale autorisée. | Entier (par ex., `1000` pour une valeur maximale de 1000). |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions spécifiques. | Expression logique (par ex., `{{components.numberinput1.value<5&&"Value needs to be more than 5"}}`). |

Pour ajouter une regex dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{(/^\d{1,10}$/.test(components.numberinput1.value)) ? '' : 'Error message';}}`

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Activez ou configurez dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. Activez ou configurez dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. Activez ou configurez dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | Chaîne de caractères (par ex., `Enter your age here.` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Définit la couleur du libellé du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Alignment | Définit la position du libellé et du champ de saisie.   | Cliquez sur les options bascule ou cliquez sur **fx** pour saisir un code qui retourne de manière programmatique une valeur d'alignement - `side` ou `top`. |
| Width | Définit la largeur du champ de saisie. | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-le pour ajuster manuellement la largeur avec le curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou au **Field**. |

### Field

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div>        | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------------- | :---------------------------------------------------------- |
| Background | Définit la couleur de fond du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Border | Définit la couleur de bordure du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Text | Définit la couleur du nombre saisi dans le composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Placeholder text | Définit la couleur du texte d'exemple affiché lorsque le champ est vide. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Error text | Définit la couleur du texte du message de validation qui s'affiche. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Icon | Vous permet de sélectionner une icône pour le composant. | Activez la visibilité de l'icône, sélectionnez l'icône et la couleur de l'icône. Vous pouvez également la définir de manière programmatique via **fx**. |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre de la boîte du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique via **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

## Container

**Padding** <br/>
Vous permet de maintenir un espacement standard en activant l'option `Default`.
