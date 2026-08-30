---
id: dropdown
title: Dropdown
---

Le composant Dropdown peut être utilisé pour recueillir la saisie de l'utilisateur à partir d'une liste d'options. Ce document parcourt toutes les propriétés liées au composant **Dropdown**.

:::info
Pour obtenir la configuration du composant Dropdown hérité (legacy), veuillez consulter **[ce](/docs/2.50.0-LTS/widgets/dropdown)** document.
:::

## Data

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div>    | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :--------------------------------------------------- | :--------------------------------------------------- |
| Label                                          | Texte à afficher comme label du champ.          | Chaîne (par ex., `Country`).                            |
| Placeholder                                    | Une indication affichée pour guider l'utilisateur sur ce qu'il doit saisir. | Chaîne (par ex., `Choose an option`).                   |

## Options

Permet d'ajouter des options au champ dropdown. Vous pouvez cliquer sur `Add new option` et ajouter des options manuellement, ou activer `Dynamic options` et saisir les options via du code.

### Example Code for Dynamic Columns

1. En passant un tableau d'objets et en spécifiant chaque valeur :

```js
{{
    [
      {
        label: "option1",
        value: 1,
        caption: "First option",
        disable: false,
        visible: true,
        default: true,
      },
      { label: "option2", value: 2, caption: null, disable: false, visible: true },
      { label: "option3", value: 3, caption: null, disable: false, visible: true },
    ];
}}
```

`caption` est facultatif. Lorsqu'il est défini, il affiche un texte descriptif supplémentaire sous le label de l'option dans la liste déroulante. Il n'apparaît pas dans la valeur sélectionnée affichée après le choix d'une option. Par défaut `null`.

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

### Example Schema for Group Options

Saisissez le schéma dans la syntaxe suivante pour utiliser les Group Options

```js
{{[
  {
    label: 'Fruits',
    options: [
      { value: 'apple', label: 'Apple', disable:true },
      { value: 'orange', label: 'Orange' },
      { value: 'banana', label: 'Banana' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'spinach', label: 'Spinach' },
    ],
  },
  {
    label: 'Dairy',
    options: [
      { value: 'milk', label: 'Milk' },
      { value: 'cheese', label: 'Cheese' },
      { value: 'butter', label: 'Butter' },
    ],
  },
]}}
```

### Options Loading State

Permet d'ajouter un état de chargement aux options générées dynamiquement. Vous pouvez activer ou désactiver le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique.

### Sort Options

Trie toutes les options selon le modèle sélectionné. Choisissez entre **None**, **a-z** ou **z-a**.

## Events

| <div style={{ width:"135px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>          |
| :------------------------------------------ | :--------------------------------------------------------- |
| On select                                   | Se déclenche chaque fois qu'une option est sélectionnée.                   |
| On search text changed                      | Se déclenche chaque fois que le texte de recherche est modifié.              |
| On focus                                    | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du champ de saisie.  |
| On blur                                     | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du champ de saisie. |

:::info
Consultez la documentation de la [Référence des Actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component specific actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher à l'aide d'un événement ou d'une requête RunJS.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| clear( )                                      | Efface l'option sélectionnée.                       | `components.dropdown1.clear()`                      |
| setVisibility( )                              | Définit la visibilité du composant.             | `components.dropdown1.setVisibility(false)`         |
| setLoading( )                                 | Définit l'état de chargement du composant.          | `components.dropdown1.setLoading(true)`             |
| setDisable( )                                 | Désactive le composant.                           | `components.dropdown1.setDisable(true)`             |
| selectOption( )                               | Sélectionne une option.                                | `components.dropdown1.selectOption(2)`              |

**Remarque :** Le type de données transmis aux CSA comme `selectOption()` dépend de la façon dont vous configurez le composant. Lors de l'ajout manuel d'options via le bouton **Add new option**, les valeurs doivent être des chaînes (par exemple, `components.dropdown1.selectOption(['2'])`). Lors de l'utilisation des options dynamiques, fournissez les valeurs avec les types de données corrects tels qu'ils apparaissent dans votre logique de code.

Par exemple, si le code est :

```javascript
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

Vous devez passer des valeurs numériques dans l'action spécifique au composant `selectOption` puisque le type de la valeur est **Number** :

```javascript
components.dropdown1.selectOption(2);
```

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :---------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| searchText | Cette variable est initialement vide et contient la valeur chaque fois que l'utilisateur effectue une recherche dans le dropdown. | `{{components.dropdown1.searchText}}` |
| label | Contient le nom du label du dropdown. | `{{components.dropdown1.label}}` |
| value | Contient la valeur sélectionnée par l'utilisateur dans le composant. | `{{components.dropdown1.value}}` |
| selectedOption | Contient le label, la valeur et la légende de l'option sélectionnée. | `{{components.dropdown1.selectedOption.label}}`, `{{components.dropdown1.selectedOption.caption}}` |
| isValid | Indique si l'entrée respecte les critères de validation. | `{{components.dropdown1.isValid}}` |
| options | Contient toutes les valeurs d'options du dropdown. Chaque entrée inclut `label`, `value`, et `caption`. | `{{components.dropdown1.options}}` |
| isVisible | Indique si le composant est visible. | `{{components.dropdown1.isVisible}}` |
| isLoading | Indique si le composant est en cours de chargement.  | `{{components.dropdown1.isLoading}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.dropdown1.isDisabled}}` |
| isMandatory | Indique si le champ est obligatoire. | `{{components.dropdown1.isMandatory}}` |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message « Field cannot be empty » si aucune option n'est sélectionnée. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Custom validation | Spécifie un message d'erreur de validation pour des conditions spécifiques. | Expression logique (par ex., `{{components.dropdown.value<5&&"Value needs to be more than 5"}}`). |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Show clear selection button | Fournit un bouton pour effacer toutes les sélections. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show search in options | Active une option de recherche. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne pour l'affichage. | Chaîne (par ex., `Enter your name here.` ). |

## Devices

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Color | Définit la couleur du label du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Alignment | Définit la position du label et du champ de saisie.   | Cliquez sur les options de bascule ou cliquez sur **fx** pour saisir du code qui retourne programmatiquement une valeur d'alignement - **side** ou **top**. |
| Width | Définit la largeur du champ de saisie. | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-la pour ajuster manuellement la largeur à l'aide du curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou par rapport au **Field**. |

### Field

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Définit la couleur d'arrière-plan du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border | Définit la couleur de la bordure du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Text | Définit la couleur du texte saisi dans le composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Placeholder text | Définit la couleur du texte de l'espace réservé affiché lorsqu'aucune option n'est sélectionnée. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Accent | Définit la couleur de la bordure lorsque le dropdown est ouvert. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Error text | Définit la couleur du texte du message de validation qui s'affiche.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Icon | Vous permet de sélectionner une icône pour le composant. | Activez la visibilité de l'icône, sélectionnez l'icône et la couleur de l'icône |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique.  |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées. |

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
