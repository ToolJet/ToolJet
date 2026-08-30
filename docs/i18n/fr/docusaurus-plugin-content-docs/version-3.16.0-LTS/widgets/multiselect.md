---
id: multiselect
title: Multiselect
---

Le composant Multiselect permet aux utilisateurs de sélectionner plusieurs options dans une liste prédéfinie, ce qui le rend idéal pour recueillir plusieurs entrées.

## Data

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div>      | <div style={{width: "200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :----------------------------------------------------- | :--------------------------------------------------- |
| Label                                          | Texte à afficher comme libellé du composant.        | Chaîne de caractères (par ex., `Select an option`).                   |
| Placeholder                                    | Texte à afficher lorsqu'aucune option n'est sélectionnée. | Chaîne de caractères (par ex., `Select the loan type`).               |

## Options

Vous permet d'ajouter des options au champ du composant multiselect. Vous pouvez cliquer sur `Add new option` et ajouter des options manuellement, ou activer `Dynamic options` et saisir les options via du code.

### Exemple de code pour les options dynamiques

1. Transmettre un tableau d'objets en spécifiant chaque valeur :

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

2. Transmettre un tableau d'objets avec une valeur par défaut provenant de la ligne sélectionnée d'un composant **Table** :

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

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                       | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Options Loading State                        | Vous permet d'ajouter un état de chargement aux options générées dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Enable select all option                     | Ajoute l'option "Select all" dans la liste pour sélectionner toutes les options à la fois.  | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show "All items are selected"                | Affiche "All items are selected" lorsque toutes les options sont sélectionnées.       | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Sort options                                 | Trie toutes les options selon le modèle sélectionné.                           | Choisissez entre **None**, **a-z** ou **z-a**.                                                                                    |

## Événements

| <div style={{ width:"135px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>          |
| :------------------------------------------ | :--------------------------------------------------------- |
| On select                                   | Se déclenche lorsqu'une option est sélectionnée.                   |
| On search text changed                      | Se déclenche lorsque le texte de recherche est modifié.              |
| On focus                                    | Se déclenche lorsque l'utilisateur clique dans le champ de saisie.  |
| On blur                                     | Se déclenche lorsque l'utilisateur clique hors du champ de saisie. |

:::info
Consultez la documentation de la **[Référence des actions](/docs/actions/run-query)** pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), vous pouvez les déclencher via un événement ou utiliser une requête RunJS.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| clear( )                                      | Efface l'option sélectionnée.                       | `components.multiselect1.clear()`                   |
| setVisibility( )                              | Définit la visibilité du composant.             | `components.multiselect1.setVisibility(false)`      |
| setLoading( )                                 | Définit l'état de chargement du composant.          | `components.multiselect1.setLoading(true)`          |
| setDisable( )                                 | Désactive le composant.                           | `components.multiselect1.setDisable(true)`          |
| selectOptions( )                              | Sélectionne une option.                                | `components.multiselect1.selectOptions(['2','3'])`  |
| deselectOptions( )                            | Désélectionne toutes les options.                            | `components.multiselect1.deselectOptions()`         |

**Remarque :**

1. Le type de données transmis aux CSA telles que `selectOptions()` dépend de la façon dont vous configurez le composant. Lorsque vous ajoutez des options manuellement à l'aide du bouton **Add new option**, les valeurs doivent être des chaînes de caractères (par exemple, `components.multiselect1.selectOptions(['2', '3'])`). Lors de l'utilisation d'options dynamiques, fournissez des valeurs avec les types de données corrects tels qu'ils apparaissent dans votre logique de code.

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

   Vous devez transmettre des valeurs numériques dans l'action spécifique au composant `selectOptions` puisque le type de valeur est **Number** :

   ```javascript
   components.multiselect1.selectOptions([2, 3]);
   ```

2. Lors de l'utilisation de l'action Control Component pour déclencher selectOption dans une CSA, les valeurs doivent être transmises entre `{{ }}`, par ex., `{{["1", "2"]}}`.

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div>                       | <div style={{width: "200px"}}> Comment y accéder </div> |
| :--------------------------------------------- | :---------------------------------------------------------------------- | :-------------------------------------------------- |
| label                                          | Contient le nom du libellé du composant multiselect.                      | `{{components.multiselect1.label}}`                 |
| value                                          | Contient la valeur sélectionnée par l'utilisateur dans le composant.                  | `{{components.multiselect1.value}}`                 |
| options                                        | Contient toutes les valeurs d'option du composant multiselect sous forme de tableau. | `{{components.multiselect1.options}}`               |
| isValid                                        | Indique si l'entrée respecte les critères de validation.                       | `{{components.multiselect1.isValid}}`               |
| isMandatory                                    | Indique si le champ est requis.                                     | `{{components.multiselect1.isMandatory}}`           |
| isLoading                                      | Indique si le composant est en cours de chargement.                                  | `{{components.multiselect1.isLoading}}`             |
| isVisible                                      | Indique si le composant est visible.                                  | `{{components.multiselect1.isVisible}}`             |
| isDisabled                                     | Indique si le composant est désactivé.                                 | `{{components.multiselect1.isDisabled}}`            |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div>                    | <div style={{width: "200px"}}> Valeur attendue </div>                                                                         |
| :------------------------------------------------------ | :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Make this field mandatory                               | Affiche le message 'Field cannot be empty' si aucune option n'est sélectionnée. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Custom validation                                       | Spécifie un message d'erreur de validation pour des conditions spécifiques.        | Expression logique (par ex., `{{!components.multiselect1.value && "Please select an option"}}`).                                |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                       | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Show clear selection button                  | Fournit un bouton pour effacer toutes les sélections.                                                                 | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show search in options                       | Active une option de recherche.                                                                                | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Loading state                                | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Activez ou configurez dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant. Activez ou configurez dynamiquement.                                               | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant. Activez ou configurez dynamiquement.                                           | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                      | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher.                               | Chaîne de caractères (par ex., `Select an option.` ).                                                                                         |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Style

### Label

| <div style={{ width:"100px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>                                                                                                       |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color                                                | Définit la couleur du libellé du composant.          | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex.                                                                |
| Alignment | Définit la position du libellé et du champ de saisie.   | Cliquez sur les options bascule ou cliquez sur **fx** pour saisir un code qui retourne de manière programmatique une valeur d'alignement - **side** ou **top**. |
| Width | Définit la largeur du champ de saisie. | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-le pour ajuster manuellement la largeur avec le curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou au **Field**. |

### Field

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div>         | <div style={{ width:"250px"}}> Options de configuration </div>                                        |
| :--------------------------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| Background                                           | Définit la couleur de fond du composant.               | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Border                                               | Définit la couleur de bordure du composant.                   | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Accent                                               | Définit la couleur de la bordure lorsque la liste déroulante est ouverte. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Text                                                 | Définit la couleur du texte saisi dans le composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Error text                                           | Définit la couleur du texte du message de validation qui s'affiche.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique un code couleur Hex. |
| Icon                                                 | Vous permet de sélectionner une icône pour le composant.           | Activez la visibilité de l'icône, sélectionnez l'icône et la couleur de l'icône                                             |
| Border radius                                        | Modifie le rayon de bordure du composant.              | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne de manière programmatique une valeur numérique.  |
| Box shadow                                           | Définit les propriétés d'ombre de la boîte du composant.          | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées.                                     |

## Container

**Padding** <br/>
Vous permet de maintenir un espacement standard en activant l'option `Default`.

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::
