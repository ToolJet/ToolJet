---
id: tree-select
title: Tree Select
---

# Tree Select

Le composant **Tree Select** est un groupe de cases à cocher dans une TreeView pouvant être développée ou réduite.

<div style={{paddingTop:'24px'}}>

## Propriétés

### Title

Le texte à utiliser comme titre du tree select. Ce champ attend une saisie de type `String`.

### Structure

**Exigences relatives aux données :** la structure doit être un tableau d'objets, et chaque objet doit avoir les clés `label` et `value`. Si vous souhaitez avoir des `children` sous l'une des cases à cocher, un tableau `children` doit être fourni avec les clés `label` et `value`.

**Exemple :**

```json
[
  {
    "label": "Asia",
    "value": "asia",
    "children": [
      {
        "label": "China",
        "value": "china",
        "children": [
          { "label": "Beijing", "value": "beijing" },
          { "label": "Shanghai", "value": "shanghai" }
        ]
      },
      { "label": "Japan", "value": "japan" },
      {
        "label": "India",
        "value": "india",
        "children": [
          { "label": "Delhi", "value": "delhi" },
          { "label": "Mumbai", "value": "mumbai" },
          { "label": "Bengaluru", "value": "bengaluru" }
        ]
      }
    ]
  },
  {
    "label": "Europe",
    "value": "europe",
    "children": [
      { "label": "France", "value": "france" },
      { "label": "Spain", "value": "spain" },
      { "label": "England", "value": "england" }
    ]
  },
  { "label": "Africa", "value": "africa" }
]
```

:::info
Remarque : la `value` doit être unique dans l'ensemble du tableau de structure.
:::

### Checked values

Checked values est un tableau de valeurs fourni pour sélectionner les cases à cocher par défaut.

**Exemple :**

```json
["asia", "spain"]
```

### Expanded values

Comme pour checked values, expanded values est un tableau de valeurs fourni pour développer le nœud par défaut.

**Exemple :**

```json
["asia"]
```

</div>

<div style={{paddingTop:'24px'}}>

## Événements

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>                                          |
| :------------------------------------------ | :----------------------------------------------------------------------------------------- |
| On change                                   | L'événement On check se déclenche chaque fois que la valeur de la case à cocher change (cochée ou décochée). |
| On check                                    | L'événement On check se déclenche chaque fois que la case à cocher est cochée.                        |
| On uncheck                                  | L'événement On uncheck se déclenche chaque fois que la case à cocher est décochée.                    |

</div>

<div style={{paddingTop:'24px'}}>

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (Component-Specific Actions) implémentée pour réguler ou contrôler le composant.

</div>

<div style={{paddingTop:'24px'}}>

## Variables exposées

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div>                                    | <div style={{ width:"135px"}}> Comment y accéder </div>                                        |
| :---------------------------------------------- | :----------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| checked                                         | Cette variable contient la valeur de tous les éléments cochés dans le composant Tree Select. | Consultez la valeur dynamiquement en JS : `{{components.treeselect1.checked[1]}}`             |
| expanded                                        | Cette variable contient la valeur des éléments développés dans le composant Tree Select.        | Consultez la valeur dynamiquement en JS : `{{components.treeselect1.expanded[0]}}`            |
| checkedPathArray                                | Cette variable contient le chemin des éléments cochés dans des tableaux distincts.               | Consultez la valeur dynamiquement en JS : `{{components.treeselect1.checkedPathArray[1][1]}}` |
| checkedPathStrings                              | Cette variable contient le chemin des éléments cochés sous forme de chaînes séparées par un tiret (-). | Consultez la valeur dynamiquement en JS : `{{components.treeselect1.checkedPathStrings[2]}}`  |

</div>

<div style={{paddingTop:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div>                                                            |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------- |
| Show on desktop                              | Activez ou désactivez pour afficher la vue bureau.         | Vous pouvez définir la valeur de manière programmatique en cliquant sur **fx** pour définir la valeur `{{true}}` ou `{{false}}` |
| Show on mobile                               | Activez ou désactivez pour afficher la vue mobile.          | Vous pouvez définir la valeur de manière programmatique en cliquant sur **fx** pour définir la valeur `{{true}}` ou `{{false}}` |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div>                                                                                                                                                   | <div style={{ width:"100px"}}> Valeur par défaut </div> |
| :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- |
| Text color                                  | Change la couleur du texte du composant en fournissant un `code couleur Hex` ou en choisissant une couleur dans le sélecteur.                                                                                 |                                                     |
| Checkbox color                              | Change la couleur de l'interrupteur du composant en fournissant un `code couleur Hex` ou en choisissant une couleur dans le sélecteur.                                                                        |                                                     |
| Visibility                                  | Permet de contrôler la visibilité du composant. Si `{{false}}`, le composant ne sera pas visible une fois l'application déployée. Il ne peut accepter que des valeurs booléennes, c'est-à-dire `{{true}}` ou `{{false}}`. | Par défaut, la valeur est `{{true}}`.                 |
| Disable                                     | Cette propriété n'accepte que des valeurs booléennes. Si elle est définie sur `{{true}}`, le composant sera verrouillé et deviendra non fonctionnel.                                                                           | Par défaut, sa valeur est définie sur `{{false}}`.        |

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

</div>
