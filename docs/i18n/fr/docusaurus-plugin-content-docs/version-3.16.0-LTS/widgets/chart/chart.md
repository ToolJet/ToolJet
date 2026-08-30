---
id: chart-properties
title: Propriétés
---

# Chart

Le composant Chart vous permet de visualiser vos données. Dans ce document, nous allons parcourir toutes les options de configuration du composant **Chart**.

## Title

Sous la propriété `Title`, vous pouvez saisir un titre qui s'affiche en haut du composant chart.

## Plotly JSON Chart Schema

Pour activer le schéma JSON Plotly, activez le bouton `Use Plotly JSON Schema`. De plus, pour une configuration dynamique, cliquez sur **fx** afin de saisir une expression logique qui l'active ou le désactive selon les besoins.

Lorsque vous utilisez le mode de schéma JSON Plotly, le tableau `shapes` à l'intérieur de l'objet `layout` est entièrement pris en charge. Les formes sont affichées par-dessus le graphique et peuvent être utilisées pour dessiner des cercles, des rectangles, des lignes ou des tracés — utile pour mettre en évidence des zones ou annoter des données.

**Exemple :**

```json
{
  "data": [
    { "x": [1.5, 3.5], "y": [0.75, 2.5], "mode": "text", "type": "scatter" }
  ],
  "layout": {
    "shapes": [
      {
        "type": "circle",
        "xref": "x",
        "yref": "y",
        "x0": 1, "y0": 1, "x1": 3, "y1": 3,
        "line": { "color": "rgba(50, 171, 96, 1)" }
      },
      {
        "type": "circle",
        "xref": "x",
        "yref": "y",
        "fillcolor": "rgba(50, 171, 96, 0.7)",
        "x0": 3, "y0": 3, "x1": 4, "y1": 4,
        "line": { "color": "rgba(50, 171, 96, 1)" }
      }
    ]
  }
}
```

Consultez la [documentation des shapes Plotly](https://plotly.com/javascript/shapes/) pour obtenir la liste complète des types de formes et des propriétés prises en charge.

## Component specific actions (CSA)

Il n'existe actuellement aucune CSA (Component-Specific Action) mise en œuvre pour réguler ou contrôler le composant.

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div>       | <div style={{width: "200px"}}> Comment y accéder </div>                                                                                                                                     |
| :--------------------------------------------- | :------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chartTitle                                     | Contient le titre du composant chart.                 | Accessible dynamiquement via JS (par ex., `{{components.chart1.chartTitle}}`).                                                                                                          |
| xAxisTitle                                     | Contient le titre de l'axe X du graphique.         | Accessible dynamiquement via JS (par ex., `{{components.chart1.xAxisTitle}}`).                                                                                                          |
| yAxisTitle                                     | Contient le titre de l'axe Y du graphique.         | Accessible dynamiquement via JS (par ex., `{{components.chart1.yAxisTitle}}`).                                                                                                          |
| clickedDataPoints                              | Stocke les informations sur les points de données cliqués. | Accessible dynamiquement via JS (par ex., `{{components.chart1.clickedDataPoints}}`). Chaque point de donnée inclut `xAxisLabel`, `yAxisLabel`, `dataLabel`, `dataValue`, et `dataPercent`. |

## Propriétés

#### Chart type

Vous pouvez sélectionner le type depuis les options du menu déroulant ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique qui renvoie `line`, `pie` ou `bar`.

## Chart data

Les données doivent être au format JSON et doivent comporter les clés `x` et `y`. Le composant prend en charge les types de données JSON string et object.

**Exemple :**

```json
[
  { "x": "Jan", "y": 100 },
  { "x": "Feb", "y": 80 },
  { "x": "Mar", "y": 40 },
  { "x": "Apr", "y": 100 },
  { "x": "May", "y": 80 },
  { "x": "Jun", "y": 40 }
]
```

## Marker Color

Disponible pour les graphiques en ligne et en barres, `Marker Color` définit la couleur de la ligne ou des barres sur le graphique.

## Options

| <div style={{ width:"100px"}}> Option </div> | <div style={{ width:"150px"}}> Description </div>                                                       | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Loading state                                | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. À activer ou configurer dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show axis                                    | Masque ou affiche les axes du graphique.                                                                | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show grid lines                              | Masque ou affiche les lignes de la grille sur le graphique.                                                          | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Événements

| Événement               | Description                                                 |
| :------------------ | ----------------------------------------------------------- |
| On data point click | Se déclenche lorsque l'utilisateur clique sur des points de données.           |
| On double click     | Se déclenche lorsque l'utilisateur double-clique sur la zone du graphique. |

:::info
Consultez la documentation [Référence des actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Appareils

| Propriété        | Description                                  | Valeur attendue                                                                                                                    |
| :-------------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile  | Rend le composant visible en vue mobile.  | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

| <div style={{ width:"100px"}}> Propriété du champ </div> | <div style={{ width:"150px"}}> Description </div>                                               | <div style={{ width:"250px"}}> Options de configuration </div>                                                                        |
| :--------------------------------------------------- | :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| Background color                                     | Définit la couleur d'arrière-plan du composant.                                                     | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.                                 |
| Border color                                         | Définit la couleur de bordure du composant.                                                         | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.                                 |
| Paddings                                             | Définit le padding du composant.                                                              | Saisissez une valeur numérique (par ex., `22`).                                                                                            |
| Border radius                                        | Modifie le rayon de bordure du composant.                                                    | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique une valeur numérique.                                  |
| Visibility                                           | Définit la visibilité du composant.                                                           | Activez/désactivez à l'aide du bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disables                                             | Vous permet d'activer/désactiver un composant. Le composant n'est pas interactif lorsqu'il est désactivé. | Activez/désactivez à l'aide du bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre forfait comprend la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::
