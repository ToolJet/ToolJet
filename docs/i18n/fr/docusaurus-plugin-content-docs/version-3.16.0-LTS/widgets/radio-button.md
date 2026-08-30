---
id: radio-button-v2
title: Radio Button
---

Le composant **Radio button** peut être utilisé pour recueillir la saisie de l'utilisateur à partir d'une liste d'options.

## Data

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label                                          | Texte à afficher comme label du composant.   | Chaîne de caractères (par ex., `Select an option`).                   |

## Options

Permet d'ajouter des options au champ radio button. Vous pouvez cliquer sur le bouton **Add new option** et ajouter les options manuellement, ou activer `Dynamic options` et saisir les options via du code.

### Exemple de code pour les options dynamiques

1. En passant un tableau d'objets et en spécifiant chaque valeur :

```js
{
  {
    [
      {
        label: "option1",
        value: 1,
        disable: false,
        visible: true,
        default: true,
      },
      { label: "option2", value: 2, disable: false, visible: true },
      { label: "option3", value: 3, disable: false, visible: true },
    ];
  }
}
```

2. En passant un tableau d'objets avec une valeur par défaut provenant de la ligne sélectionnée d'un composant **Table** :

```js
{
  {
    queries.getEmployees.data.map((option) => ({
      label: option.firstname,
      value: option.firstname,
      disable: false,
      visible: true,
      default: option.firstname === components.table1.selectedRow.firstname,
    }));
  }
}
```

### Layout

Contrôle la manière dont les options du radio button sont disposées au sein du composant.

| <div style={{ width:"100px"}}> Valeur </div> | <div style={{ width:"250px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| Row | Les options sont disposées horizontalement sur une seule ligne. |
| Column | Les options sont empilées verticalement sur une seule colonne. |
| Wrap | Les options sont disposées horizontalement et passent à la ligne suivante lorsqu'elles dépassent la largeur disponible. |

### Options loading state

Permet d'ajouter un état de chargement aux options générées dynamiquement. Vous pouvez activer ou désactiver le bouton bascule, ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique.

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| selectOption()                                | Sélectionne une option.                                | `components.radiobutton1.selectOption(2)`           |
| deselectOption()                              | Désélectionne l'option sélectionnée.                    | `components.radiobutton1.deselectOption()`          |
| setVisibility()                               | Définit la visibilité du composant.             | `components.radiobutton1.setVisibility(false)`      |
| setLoading()                                  | Définit l'état de chargement du composant.          | `components.radiobutton1.setLoading(true)`          |
| setDisable()                                  | Désactive le composant.                           | `components.radiobutton1.setDisable(true)`          |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div>              | <div style={{width: "200px"}}> Comment y accéder </div>                                          |
| :--------------------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| label                                          | Contient le nom du label du radio button.                      | `{{components.radiobutton1.label}}`                                                          |
| value                                          | Contient la valeur sélectionnée par l'utilisateur dans le composant.         | `{{components.radiobutton1.value}}`                                                          |
| options                                        | Contient toutes les valeurs d'options du radio button sous forme de tableau. | `{{components.radiobutton1.options}}` ou <br/>`{{components.radiobutton1.options[0].label}}` |
| isValid                                        | Indique si la saisie respecte les critères de validation.              | `{{components.radiobutton1.isValid}}`                                                        |
| isMandatory                                    | Indique si le champ est obligatoire.                            | `{{components.radiobutton1.isMandatory}}`                                                    |
| isLoading                                      | Indique si le composant est en cours de chargement.                         | `{{components.radiobutton1.isLoading}}`                                                      |
| isVisible                                      | Indique si le composant est visible.                         | `{{components.radiobutton1.isVisible}}`                                                      |
| isDisabled                                     | Indique si le composant est désactivé.                        | `{{components.radiobutton1.isDisabled}}`                                                     |

## Événements

| <div style={{ width:"135px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On select                                   | Se déclenche chaque fois qu'une option est sélectionnée.          |

:::info
Consultez la documentation de [référence des actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div>                    | <div style={{width: "200px"}}> Valeur attendue </div>                                                                         |
| :------------------------------------------------------ | :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Make this field mandatory                               | Affiche le message « Field cannot be empty » si aucune option n'est sélectionnée. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Custom validation                                       | Spécifie un message d'erreur de validation pour des conditions spécifiques.        | Expression logique (par ex., `{{!components.radiobutton1.value && "Please select an option"}}`).                                |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                       | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Loading state        | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility           | Contrôle la visibilité du composant.                                               | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Collapse when hidden | Réduit l'espace occupé par le composant lorsqu'il est masqué, afin que les composants environnants remplissent l'espace. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable              | Active ou désactive le composant.                                           | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip              | Affiche une infobulle informative lorsque l'utilisateur survole le composant.   | Chaîne de caractères (par ex., `Select an option`).                                                                                          |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"130px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Color | Définit la couleur du label du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Alignment | Définit la position du label par rapport aux options. | Cliquez sur les options bascule, ou cliquez sur **fx** pour saisir du code qui renvoie de façon programmatique une valeur d'alignement — `side` ou `top`. |
| Direction | Lorsque l'alignement est réglé sur `side`, contrôle si le label apparaît à gauche ou à droite des options. | Sélectionnez **Left** ou **Right** à l'aide des boutons bascule à icône. |
| Width | Définit la largeur du label. Disponible lorsque l'alignement est `side`. | Activez **Auto** pour utiliser automatiquement la largeur standard, ou désactivez-le pour définir manuellement la largeur à l'aide du curseur ou de **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou au **Field**. |

### Switch

| <div style={{ width:"130px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Border | Définit la couleur de bordure des boutons radio. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Checked background | Définit la couleur de fond du bouton radio sélectionné. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Unchecked background | Définit la couleur de fond des boutons radio non sélectionnés. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Handle color | Définit la couleur de remplissage du point indicateur du bouton radio sélectionné. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Text | Définit la couleur des labels des options. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |

### Container

**Padding** <br/>
Vous permet de conserver un padding standard en activant l'option `Default`.

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::
