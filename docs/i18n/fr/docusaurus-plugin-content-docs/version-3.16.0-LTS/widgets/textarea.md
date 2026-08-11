---
id: text-area
title: Textarea
---

Le composant **Textarea** permet aux utilisateurs de saisir du texte dans un champ de saisie similaire au composant [Text Input](/docs/widgets/text-input). Textarea est généralement préféré lorsque nous attendons une saisie de plusieurs phrases. Dans ce document, nous allons passer en revue toutes les options de configuration du composant **Textarea**.

## Propriétés

| Propriété      | Description                                                                                       | Valeur attendue                                               |
| :------------ | :------------------------------------------------------------------------------------------------ | :----------------------------------------------------------- |
| Label         | Texte affiché comme libellé du champ.                                                       | String (par ex., `Enter Your Address`).                     |
| Default value | Utilisé pour définir la valeur initiale de la zone de texte au chargement.                                                   | String (par ex., `Nexus Building, Street XYZ, AB, 010101`). |
| Placeholder   | Fournit une indication sur la valeur attendue. Elle disparaît dès que l'utilisateur interagit avec le composant. | String (par ex., `Enter Your Address Here`).                |

## Événements

| Événement            | Description                                                |
| :--------------- | :--------------------------------------------------------- |
| On change        | Se déclenche chaque fois que la valeur saisie change.                 |
| On enter pressed | Se déclenche chaque fois que la touche Entrée est enfoncée.                |
| On focus         | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du champ de saisie.  |
| On blur          | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du champ de saisie. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des Component Specific Actions (CSA), qui peuvent être déclenchées par un événement ou par la requête RunJS indiquée :

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"200px"}}> Description </div>   | <div style={{ width:"135px"}}> Comment y accéder </div>  |
| :-------------------------------------------- | :-------------------------------------------------- | :--------------------------------------------------- |
| setText                                       | Définit le texte du composant.                    | `components.textarea1.setText('this is a textarea')` |
| clear                                         | Efface la valeur de la zone de texte.      | `components.textarea1.clear()`.                      |
| setVisibility( )                              | Définit l'état de visibilité de la zone de texte.         | `components.textarea1.setVisibility()`               |
| setLoading( )                                 | Définit l'état de chargement de la zone de texte.            | `components.textarea1.setLoading()`                  |
| setDisable( )                                 | Désactive la zone de texte.                             | `components.textarea1.setDisable()`                  |
| setFocus( )                                   | Place le focus du curseur sur la zone de texte.      | `components.textarea1.setLoading()`                  |
| setBlur( )                                    | Retire le focus du curseur de la zone de texte. | `components.textarea1.setBlur()`                     |

## Variables exposées

Les variables exposées suivantes peuvent être consultées dynamiquement à l'aide de la requête JS indiquée :

| Variables   | Description                                                       | Comment y accéder                          |
| :---------- | :---------------------------------------------------------------- | :------------------------------------- |
| value       | Cette variable contient la valeur saisie dans le composant Textarea. | `{{components.textarea1.value}}`       |
| label       | Contient la valeur du libellé du composant.                         | `{{components.textarea1.label}}`       |
| isValid     | Indique si la saisie respecte les critères de validation.                 | `{{components.textarea1.isValid}})`    |
| isMandatory | Indique si le champ est obligatoire.                              | `{{components.textarea1.isMandatory}}` |
| isLoading   | Indique si le composant est en cours de chargement.                            | `{{components.textarea1.isLoading}}`   |
| isVisible   | Indique si le composant est visible.                            | `{{components.textarea1.isVisible}}`   |
| isDisabled  | Indique si le composant est désactivé.                           | `{{components.textarea1.isDisabled}}`  |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message 'Field cannot be empty' si aucune valeur n'est saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Regex | Expression régulière permettant de valider la saisie. | Regular Expression Pattern (par ex., `^\d{3}-\d{2}-\d{4}$`). |
| Min length | Définit le nombre minimum de caractères autorisés. | Integer (par ex., `100` pour un minimum de 100 caractères). |
| Max length | Définit le nombre maximum de caractères autorisés. | Integer (par ex., `500` pour un maximum de 500 caractères). |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions particulières. | Logical Expression (par ex., `{{components.textarea1.value<5&&"Value needs to be more than 5"}}`). |

Pour ajouter une regex dans `Custom Validation`, vous pouvez utiliser le format ci-dessous :

**Format** : `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Exemple** : `{{(/^\d{1,10}$/.test(components.textarea1.value)) ? '' : 'Error message';}}`

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Dynamic height | Ajuste automatiquement la hauteur du composant en fonction de son contenu. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | String (par ex., `Enter your name here.` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

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
