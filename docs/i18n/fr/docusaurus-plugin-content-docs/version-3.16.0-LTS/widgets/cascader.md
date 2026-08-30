---
id: cascader
title: Cascader
---

Le composant Cascader permet aux utilisateurs de sélectionner une valeur unique à partir d'un ensemble d'options hiérarchique (imbriqué) en descendant à travers les niveaux, par exemple **Continent > Pays > Ville**.

## Data

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div>                                                              | <div style={{width: "200px"}}> Valeur attendue </div> |
| :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| Label                                             | Texte à afficher comme label du composant.                                                                   | Chaîne (par ex., `Select`).                               |
| Placeholder                                       | Une indication affichée lorsqu'aucune option n'est sélectionnée.                                                                      | Chaîne (par ex., `Select an option`).                     |
| Path separator                                    | Le séparateur utilisé pour joindre les labels du chemin sélectionné, à la fois dans l'affichage du champ et dans la variable exposée `pathString`. | Chaîne (par ex., `/`). Par défaut `/`.                   |

## Options

Permet d'ajouter les options hiérarchiques pour le Cascader. Vous pouvez cliquer sur `Add new option` pour construire l'arbre manuellement, ou activer `Dynamic options` et fournir la structure hiérarchique via du code.

Lors de la construction manuelle des options, cliquez sur une option pour modifier ses champs **Option label**, **Option value**, **Visibility** et **Disable**, cliquez sur l'icône **+** d'une option pour ajouter une option imbriquée en dessous, et faites glisser les options pour les réordonner.

:::info
Seules les options sans aucun `children` (nœuds feuilles) peuvent être sélectionnées. Il n'est pas possible de sélectionner un nœud parent — cliquer sur celui-ci ouvre plutôt ses enfants.
:::

### Exemple de schéma pour les options dynamiques

Saisissez le schéma dans la syntaxe suivante pour utiliser les options dynamiques :

```js
{{[
  {
    label: 'Asia',
    value: 'asia',
    children: [
      {
        label: 'China',
        value: 'china',
        children: [
          { label: 'Beijing', value: 'beijing' },
          { label: 'Shanghai', value: 'shanghai' },
        ],
      },
      { label: 'Japan', value: 'japan' },
      {
        label: 'India',
        value: 'india',
        children: [
          { label: 'Delhi', value: 'delhi' },
          { label: 'Mumbai', value: 'mumbai' },
          { label: 'Bengaluru', value: 'bengaluru', default: true },
        ],
      },
    ],
  },
  {
    label: 'Europe',
    value: 'europe',
    children: [
      { label: 'France', value: 'france' },
      { label: 'Spain', value: 'spain' },
      { label: 'England', value: 'england', disable: true },
    ],
  },
  { label: 'Africa', value: 'africa', visible: false },
]}}
```

- `children` - Un tableau d'options de la même forme, imbriqué à n'importe quelle profondeur. Omettez-le (ou laissez-le vide) pour marquer une option comme une feuille sélectionnable.
- `default` - Défini à `true` sur une option feuille pour la présélectionner. Seule la première feuille visible trouvée avec `default: true` est utilisée.
- `visible` - Défini à `false` pour masquer une option. Masquer un parent masque également toute sa branche.
- `disable` - Défini à `true` pour empêcher une option d'être sélectionnée ou développée.

### Default value

Lorsque les options sont ajoutées manuellement (Dynamic options désactivé), utilisez **Default value** pour présélectionner une option par sa `value`. Cela ne prend effet que si la valeur correspond à une option feuille existante.

### Options Loading State

Disponible lorsque Dynamic options est activé. Permet d'ajouter un état de chargement aux options générées dynamiquement. Vous pouvez activer ou désactiver le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique.

## Events

| <div style={{ width:"135px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>          |
| :------------------------------------------- | :----------------------------------------------------------- |
| On select                                    | Se déclenche chaque fois qu'une option feuille est sélectionnée ou effacée.      |
| On focus                                     | Se déclenche chaque fois que l'utilisateur clique à l'intérieur du composant.      |
| On blur                                      | Se déclenche chaque fois que l'utilisateur clique à l'extérieur du composant.     |

:::info
Consultez la documentation de la [Référence des Actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Component specific actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher à l'aide d'un événement ou d'une requête RunJS.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div>                                                                | <div style={{width: "200px"}}> Comment y accéder </div>       |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------- |
| setValue( )                                     | Sélectionne l'option feuille correspondant à la valeur donnée. Si la valeur ne correspond à aucune option feuille, la sélection est effacée. | `components.cascader1.setValue('beijing')`                 |
| clearValue( )                                   | Efface l'option sélectionnée.                                                                                          | `components.cascader1.clearValue()`                        |
| setLoading( )                                   | Définit l'état de chargement du composant.                                                                             | `components.cascader1.setLoading(true)`                    |
| setOptionsLoading( )                            | Définit l'état de chargement des options du composant.                                                                     | `components.cascader1.setOptionsLoading(true)`              |
| setVisibility( )                                | Définit la visibilité du composant.                                                                                | `components.cascader1.setVisibility(false)`                |
| setDisable( )                                   | Désactive le composant.                                                                                              | `components.cascader1.setDisable(true)`                    |

**Remarque :** Le type de données transmis à `setValue()` dépend de la façon dont la `value` de l'option est définie — lors de l'ajout manuel d'options, les valeurs sont généralement des chaînes ; lors de l'utilisation des options dynamiques, transmettez la valeur avec le même type de données utilisé dans votre schéma.

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div>                                                              | <div style={{width: "200px"}}> Comment y accéder </div>          |
| :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------- |
| label                                              | Contient le nom du label du composant Cascader.                                                                      | `{{components.cascader1.label}}`                                 |
| value                                              | Contient la `value` de l'option feuille sélectionnée.                                                                       | `{{components.cascader1.value}}`                                 |
| selectedOption                                     | Contient le `label` et la `value` de l'option feuille sélectionnée.                                                           | `{{components.cascader1.selectedOption.label}}`                  |
| pathArray                                          | Contient la `value` de chaque option le long du chemin sélectionné, de la racine jusqu'à la feuille sélectionnée.                        | `{{components.cascader1.pathArray[0]}}`                          |
| pathLabels                                         | Contient le `label` de chaque option le long du chemin sélectionné, de la racine jusqu'à la feuille sélectionnée.                        | `{{components.cascader1.pathLabels[0]}}`                         |
| pathString                                         | Contient `pathLabels` joints à l'aide du **Path separator**.                                                              | `{{components.cascader1.pathString}}`                            |
| isLoading                                          | Indique si le composant est en cours de chargement.                                                                               | `{{components.cascader1.isLoading}}`                             |
| isOptionsLoading                                   | Indique si les options sont en cours de chargement.                                                                                | `{{components.cascader1.isOptionsLoading}}`                      |
| isValid                                            | Indique si l'entrée respecte les critères de validation.                                                                    | `{{components.cascader1.isValid}}`                               |
| isVisible                                          | Indique si le composant est visible.                                                                               | `{{components.cascader1.isVisible}}`                             |
| isDisabled                                         | Indique si le composant est désactivé.                                                                               | `{{components.cascader1.isDisabled}}`                            |
| isMandatory                                        | Indique si le champ est obligatoire.                                                                                  | `{{components.cascader1.isMandatory}}`                           |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div>                     | <div style={{width: "200px"}}> Valeur attendue </div>                                                                         |
| :----------------------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Make this field mandatory                                    | Affiche un message « Field cannot be empty » si aucune option n'est sélectionnée.    | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Custom validation                                             | Spécifie un message d'erreur de validation pour des conditions spécifiques.           | Expression logique (par ex., `{{!components.cascader1.value && "Please select an option"}}`).                                   |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                        | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Show clear selection button                     | Fournit un bouton pour effacer l'option sélectionnée.                                                                    | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Loading state                                   | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Bascule ou définition dynamique.        | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                      | Contrôle la visibilité du composant. Bascule ou définition dynamique.                                                       | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Collapse when hidden                            | Réduit l'espace du composant lorsqu'il est masqué, afin que les composants environnants occupent l'espace.                   | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                         | Active ou désactive le composant. Bascule ou définition dynamique.                                                   | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                         | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne pour l'affichage.                                       | Chaîne (par ex., `Select an option.`).                                                                                          |

## Devices

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :------------------------------------------------ | :---------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                    | Rend le composant visible en vue bureau.           | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                     | Rend le composant visible en vue mobile.            | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété du label </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------------- | :----------------------------------------------------- | :---------------------------------------------------------------- |
| Color                                                  | Définit la couleur du label du composant.                | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Alignment                                              | Définit la position du label et du champ.           | Cliquez sur les options de bascule ou cliquez sur **fx** pour saisir du code qui retourne programmatiquement une valeur d'alignement - **side** ou **top**. |
| Width                                                  | Définit la largeur du champ.                            | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-la pour ajuster manuellement la largeur à l'aide du curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou par rapport au **Field**. |

### Field

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :---------------------------------------------------- | :----------------------------------------------------- | :---------------------------------------------------------------- |
| Background                                             | Définit la couleur d'arrière-plan du composant.             | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border                                                 | Définit la couleur de la bordure du composant.                 | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Accent                                                 | Définit la couleur de la bordure lorsque le composant est ouvert. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Text                                                   | Définit la couleur du texte du chemin sélectionné.                | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Placeholder text                                       | Définit la couleur du texte de l'espace réservé affiché lorsqu'aucune option n'est sélectionnée. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Error text                                             | Définit la couleur du texte du message de validation qui s'affiche. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Icon                                                   | Vous permet de sélectionner une icône pour le composant.          | Activez la visibilité de l'icône, sélectionnez l'icône et la couleur de l'icône. |
| Border radius                                          | Modifie le rayon de bordure du composant.             | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique. |
| Box shadow                                             | Définit les propriétés d'ombre du composant.         | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées. |
| Menu width                                             | Contrôle la largeur du menu déroulant.                 | Choisissez **Match the field**, **Match the content**, ou **Custom** (saisissez une valeur de largeur personnalisée). |

### Container

**Padding** <br/>
Vous permet de maintenir un remplissage (padding) standard en activant l'option `Default`.
