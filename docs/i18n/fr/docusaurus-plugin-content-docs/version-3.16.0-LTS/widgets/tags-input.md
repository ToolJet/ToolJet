---
id: tags-input
title: Tags Input
---

Le composant **Tags Input** permet aux utilisateurs de créer, sélectionner et supprimer des tags à partir d'une liste déroulante. Il prend en charge à la fois des options prédéfinies et des tags personnalisés créés par l'utilisateur.

## Propriétés

### Data

| Propriété | Description | Valeur attendue |
|:---------|:------------|:---------------|
| Label | Le texte du label affiché pour le champ. | Chaîne de caractères (par ex., `Tags`, `Categories`) |
| Placeholder | Texte d'indication affiché lorsqu'aucun tag n'est sélectionné. | Chaîne de caractères (par ex., `Add or select a tag`) |

### Tags

| <div style={{ width:"130px"}}> Propriété </div> | Description | Valeur attendue |
|:---------|:------------|:---------------|
| Dynamic tags | Bascule pour passer du mode d'options statiques au mode dynamique. Lorsqu'il est activé, les options sont définies via un schéma. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Default value | Valeurs de tags présélectionnées au chargement du composant. Visible uniquement lorsque Dynamic tags est désactivé. | Valeurs séparées par des virgules ou tableau |
| Schema | Tableau JSON définissant les options de tags. Visible uniquement lorsque Dynamic tags est activé. | Tableau d'objets avec les propriétés `label`, `value`, `visible`, `default` et `disable` |
| Sort tags | Ordre de tri des tags dans la liste déroulante. | `none`, `asc` (A-Z), ou `desc` (Z-A) |
| Allow new tags | Lorsqu'activé, les utilisateurs peuvent créer de nouveaux tags en saisissant des valeurs qui ne figurent pas dans la liste prédéfinie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tags loading state | Lorsqu'activé, affiche un indicateur de chargement pendant que les options sont chargées. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Turn on search | Lorsqu'activé, les utilisateurs peuvent rechercher/filtrer les tags dans la liste déroulante. Lorsqu'il est désactivé, le menu déroulant n'apparaît pas et le composant se comporte comme un simple champ de saisie. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

### Dynamic Tags

Lorsque Dynamic tags est activé, utilisez ce format de schéma :

```js
{{[
  { label: 'Newport', value: 'newport', visible: true, default: false, disable: false },
  { label: 'New York', value: 'new_york', visible: true, default: false, disable: false },
  { label: 'San Clemente', value: 'san_clemente', visible: true, default: true, disable: false }
]}}
```

| Propriété du schéma | Description |
|:----------------|:------------|
| label | Texte affiché dans la liste déroulante |
| value | Valeur interne stockée lors de la sélection |
| visible | Indique si l'option est affichée dans la liste déroulante |
| default | Indique si l'option est présélectionnée |
| disable | Indique si l'option est désactivée (non sélectionnable) |

## Événements

| Événement | Description |
|:------|:------------|
| On tag added | Se déclenche lorsqu'un tag est sélectionné ou qu'un nouveau tag est créé. |
| On tag deleted | Se déclenche lorsqu'un tag est retiré de la sélection. |
| On focus | Se déclenche lorsque le champ de saisie reçoit le focus. |
| On blur | Se déclenche lorsque le champ de saisie perd le focus. |

:::info
Consultez la documentation de [référence des actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
|:-------|:------------|:-----------|
| Select Tags | Sélectionne les tags spécifiés de façon programmatique. Correspond par **value** ou **label**. | `components.tagsinput1.selectTags` |
| Deselect Tags | Retire les tags spécifiés de la sélection de façon programmatique. Correspond par **value** ou **label**. | `components.tagsinput1.deselectTags` |
| Clear | Efface tous les tags sélectionnés. | `components.tagsinput1.clear` |
| Set visibility | Affiche ou masque le composant. | `components.tagsinput1.setVisibility` |
| Set loading | Définit l'état de chargement du composant. | `components.tagsinput1.setLoading` |
| Set disable | Active ou désactive le composant. | `components.tagsinput1.setDisable` |

### Formats de saisie pour Select Tags / Deselect Tags

`selectTags` et `deselectTags` prennent en charge plusieurs formats de saisie :

| <div style={{ width:"200px"}}> Format </div> | Exemple | Description |
|:-------|:--------|:------------|
| Tableau de valeurs | `['newport', 'new_york']` | Fait correspondre les tags par leur propriété `value` |
| Tableau de labels | `['Newport', 'New York']` | Fait correspondre les tags par leur propriété `label` |
| Tableau d'objets avec value | `[{value: 'newport'}]` | Correspondance explicite par value |
| Tableau d'objets avec label | `[{label: 'Newport'}]` | Correspondance explicite par label |
| Formats mixtes | `['newport', {label: 'New York'}]` | Combine différents formats |

:::info Priorité de correspondance
Lorsqu'une chaîne est passée, le composant tente d'abord de trouver une correspondance par `value`. Si aucune correspondance n'est trouvée, il tente une correspondance par `label`.
:::

### Exemple d'utilisation

```js
// Sélectionner par valeurs
components.tagsInput1.selectTags(['newport', 'new_york'])

// Sélectionner par labels
components.tagsInput1.selectTags(['Newport', 'New York'])

// Sélectionner en utilisant des objets
components.tagsInput1.selectTags([
  { value: 'newport' },
  { label: 'New York' }
])

// Désélectionner par label
components.tagsInput1.deselectTags(['Newport'])

// Désélectionner en utilisant un format mixte
components.tagsInput1.deselectTags(['newport', { label: 'New York' }])

// Effacer toutes les sélections
components.tagsInput1.clear()

// Masquer le composant
components.tagsInput1.setVisibility(false)
```

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
|:---------|:-----|:------------|
| values | Renvoie le tableau des valeurs des tags sélectionnés. | `components.tagsinput1.values` |
| tags | Renvoie le tableau de tous les tags disponibles. | `components.tagsinput1.tags` |
| newTagsAdded | Renvoie le tableau de tous les tags nouvellement ajoutés. | `components.tagsinput1.newTagsAdded` |
| selectedTags | Renvoie le tableau des labels et valeurs de tous les tags sélectionnés. | `components.tagsinput1.selectedTags` |
| label | Le texte du label affiché pour le champ. | `components.tagsinput1.label` |
| isVisible | Renvoie l'état de visibilité du composant. | `components.tagsinput1.isVisible` |
| isLoading | Renvoie l'état de chargement du composant. | `components.tagsinput1.isLoading` |
| isDisabled | Renvoie l'état de désactivation du composant. | `components.tagsinput1.isDisabled` |
| isMandatory | Renvoie si le champ est obligatoire. | `components.tagsinput1.isMandatory` |
| isValid | Renvoie si la sélection actuelle passe la validation. | `components.tagsinput1.isValid` |

### Exemple d'utilisation

```js
// Obtenir toutes les valeurs sélectionnées
{{components.tagsInput1.values}}
// Renvoie : ['newport', 'new_york']

// Obtenir les tags sélectionnés avec leurs labels
{{components.tagsInput1.selectedTags}}
// Renvoie : [{ label: 'Newport', value: 'newport' }, { label: 'New York', value: 'new_york' }]

// Obtenir uniquement les tags créés par l'utilisateur
{{components.tagsInput1.newTagsAdded}}
// Renvoie : ['custom_tag_1', 'custom_tag_2']

// Vérifier si le composant est valide
{{components.tagsInput1.isValid}}
// Renvoie : true ou false
```

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory | Lorsqu'elle est activée, le formulaire ne peut pas être soumis sans qu'au moins un tag soit sélectionné. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Custom validation | Règle de validation personnalisée utilisant une expression JavaScript. | Expression JavaScript qui renvoie un message de validation ou une chaîne vide |

### Exemple de validation personnalisée

```js
{{components.tagsInput1.values.length >= 2 ? '' : 'Select at least 2 tags'}}
```
Cela valide qu'au moins 2 tags sont sélectionnés et affiche un message d'erreur si ce n'est pas le cas.

## Actions supplémentaires

| <div style={{ width:"120px"}}> Propriété </div> | Description | Options de configuration |
|:---------|:------------|:---------------|
| Dynamic height | Lorsqu'activée, la hauteur du composant s'ajuste en fonction du nombre de tags sélectionnés. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Loading state | Affiche une superposition de chargement sur l'ensemble du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle si le composant est visible. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Lorsqu'activée, le composant devient non interactif. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Texte affiché au survol du composant. | Chaîne de caractères |

## Appareils

| <div style={{ width:"130px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------|:------------|:--------|
| Color | Couleur du texte du label. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Alignment | Position du label par rapport au champ. | `Side` (à gauche du champ) ou `Top` (au-dessus du champ). |
| Direction | Alignement du label lors de l'utilisation de la disposition Side. | `Left` ou `Right`. |
| Width | Lorsque Alignment est réglé sur Side et que Auto width est désactivé, définit la largeur du label. | Saisissez la valeur ou utilisez le curseur. |
| Width type | Détermine comment la largeur du label est calculée. | `Of component` (pourcentage de la largeur totale du composant) ou `Of field` (pourcentage de la largeur du champ). |

### Field

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------|:------------|:--------|
| Background | Couleur de fond du champ de saisie. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Border | Couleur de bordure du champ de saisie. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Accent | Couleur utilisée pour l'état de focus et les mises en évidence. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Auto pick chip color | Lorsqu'activée, le composant attribue automatiquement des couleurs aux chips à partir d'une palette prédéfinie. | Activez/désactivez la case à cocher. |
| Chip color | Couleur de fond des chips de tags sélectionnés. Visible uniquement lorsque Auto pick chip color est désactivé. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Text color | Couleur du texte à l'intérieur des tags sélectionnés. Visible uniquement lorsque Auto pick chip color est désactivé. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Error text | Couleur des messages d'erreur de validation. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal. |
| Border radius | Rayon de courbure des coins du champ de saisie. | Saisissez la valeur en pixels. |
| Box shadow | Effet d'ombre autour du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de façon programmatique avec **fx**. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------|:------------|:--------|
| Padding | Espacement autour du composant. | `Default` ou `None`. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
