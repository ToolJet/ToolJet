---
id: chart-examples
title: Exemples
---

## Configuration Plotly

Vous pouvez consulter la **[documentation de Plotly](https://plotly.com/chart-studio-help/json-chart-schema/)** pour plus d'informations sur le JSON Chart Schema de Plotly.

### Bar Mode

L'option **Bar Mode** vous permet de personnaliser la mise en page et le style d'affichage spécifiquement pour les graphiques en barres. Cette option devient disponible lorsque le bouton **Plotly JSON chart schema** est activé et qu'un schéma JSON spécifique aux graphiques en barres est fourni. Cette option propose différents modes pour organiser et présenter les barres au sein du graphique.

Veuillez noter que l'option **Bar Mode** n'affecte que la mise en page des graphiques en barres, et qu'elle nécessite un schéma JSON spécifiquement conçu pour les graphiques en barres. Elle ne peut pas être utilisée pour modifier la mise en page d'autres types de graphiques comme les graphiques en ligne ou les graphiques circulaires.

Elle propose quatre modes différents :

**1. Stack Mode :** Les barres sont empilées les unes sur les autres, affichant à la fois la valeur totale de chaque catégorie et les valeurs individuelles au sein de la pile.

**2. Group Mode :** Les barres de différentes catégories sont regroupées côte à côte, facilitant la comparaison directe entre les groupes et leurs sous-catégories.

**3. Overlay Mode :** Les barres de différentes catégories se superposent avec de légers décalages, permettant une comparaison visuelle détaillée des valeurs individuelles entre les catégories.

**4. Relative Mode :** Les barres représentent des proportions ou des pourcentages relatifs à une valeur de référence, en mettant l'accent sur l'importance relative de chaque catégorie.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/chart/barmodes.png" alt="ToolJet - Widget Reference - Chart" />

</div>

## Exemples de schéma JSON Plotly

Dans la **JSON description**, la valeur doit être le tableau `data` avec les valeurs des axes x et y, et à la fin il faut spécifier le `type`. Voyons des exemples pour différents types de graphiques.

### Line
Affiche les tendances et les motifs dans les données au fil du temps.

```js
{
    "data": [
        {
            "x": ["Jan", "Feb", "Mar"],
            "y": [100, 80, 40],
            "type": "line"
        },
        {
            "x": ["Jan", "Feb", "Mar"],
            "y": [300, 30, 20],
            "type": "line"
        }
    ]
}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/chart/plotly/line-v2.png" alt="ToolJet - Widget Reference - Line Chart" />

</div>

### Line Chart With Annotations
Affiche les tendances et les motifs dans les données au fil du temps avec des annotations.

```js
{
  "data": [
    {
      "x": ["Jan", "Feb", "Mar"],
      "y": [100, 80, 40],
      "type": "scatter",
      "mode": "lines+markers"
    }
  ],
  "layout": {
    "title": "Monthly Performance",
    "annotations": [
      {
        "x": "Jan",
        "y": 100,
        "xref": "x",
        "yref": "y",
        "text": "January: 100",
        "showarrow": true,
        "arrowhead": 2,
        "ax": 0,
        "ay": -30
      },
      {
        "x": "Feb",
        "y": 80,
        "xref": "x",
        "yref": "y",
        "text": "February: 80",
        "showarrow": true,
        "arrowhead": 2,
        "ax": 0,
        "ay": -30
      },
      {
        "x": "Mar",
        "y": 40,
        "xref": "x",
        "yref": "y",
        "text": "March: 40",
        "showarrow": true,
        "arrowhead": 2,
        "ax": 0,
        "ay": -30
      }
    ]
  }
}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/chart/plotly/line-chart-with-annotations.png" alt="ToolJet - Widget Reference - Line Chart With Annotations" />

</div>

### Bar
Compare des catégories de données ou visualise l'évolution d'une variable entre différents groupes.

```js
{
    "data": [
        {
            "name": "SF Zoo",
            "type": "bar",
            "x": [20, 14, 23],
            "y": ["giraffes", "orangutans", "monkeys"],
            "marker": {
                "line": {
                    "color": "rgba(55, 128, 191, 1.0)",
                    "width": 1
                },
                "color": "rgba(55, 128, 191, 0.6)"
            },
            "orientation": "h"
        },
        {
            "name": "LA Zoo",
            "type": "bar",
            "x": [12, 18, 29],
            "y": ["giraffes", "orangutans", "monkeys"],
            "marker": {
                "line": {
                    "color": "rgba(255, 153, 51, 1.0)",
                    "width": 1
                },
                "color": "rgba(255, 153, 51, 0.6)"
            },
            "orientation": "h"
        }
    ],
    "layout": {
        "barmode": "stack"
    }
}
```
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/chart/plotly/bar-v2.png" alt="ToolJet - Widget Reference - Bar" />

</div>

### Candlestick
Analyse le mouvement de prix d'instruments financiers (actions, devises, etc.) sur une période donnée.

```js
{
  "data": [
    {
      "x": ["2024-04-02", "2024-04-03", "2024-04-04"],
      "close": [120, 125, 130],
      "high": [125, 130, 135],
      "low": [115, 120, 125],
      "open": [115, 120, 125],
      "type": "candlestick"
    }
  ]
}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/chart/plotly/candlestick.png" alt="ToolJet - Widget Reference - Candlestick" />
</div>

### Contour
Généralement utilisé pour représenter des données tridimensionnelles en deux dimensions à l'aide de lignes de contour.


```js
{
  "data": [
    {
      "x": [1, 2, 3, 4],
      "y": [1, 2, 3, 4],
      "z": [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7]],
      "type": "contour"
    }
  ]
}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/chart/plotly/contour.png" alt="ToolJet - Widget Reference - Contour" />
</div>

### Heatmap

Révèle la densité ou l'ampleur des points de données sur deux dimensions, en utilisant la couleur pour représenter l'intensité.

```bash
{
    "data": [
        {
            "z": [[1, 20, 30], [20, 1, 60], [30, 60, 1]],
            "x": ["Experiment 1", "Experiment 2", "Experiment 3"],
            "y": ["Trial 1", "Trial 2", "Trial 3"],
            "type": "heatmap"
        }
    ]
}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/chart/plotly/heatmap.png" alt="ToolJet - Widget Reference - Heatmap" />
</div>

### Icicle

Affiche des données hiérarchiques dans une structure imbriquée, idéale pour comprendre les tailles relatives des parties au sein d'un ensemble.

```js
{
    "data": [
        {
            "labels": ["A", "B", "C", "D", "E", "F"],
            "parents": ["", "A", "A", "B", "B", "B"],
            "type": "icicle"
        }
    ]
}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/chart/plotly/icicle.png" alt="ToolJet - Widget Reference - Icicle" />
</div>

### 3D Mesh

Représente des surfaces tridimensionnelles, souvent utilisées dans la visualisation de données scientifiques ou techniques.

```js
{
    "data": [
        {
            "x": [0, 1, 2, 0],
            "y": [0, 0, 1, 2],
            "z": [0, 2, 0, 1],
            "alphahull": 5,
            "type": "mesh3d"
        }
    ]
}

```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/chart/plotly/3d-mesh.png" alt="ToolJet - Widget Reference - 3D Mesh" />
</div>


:::tip
Consultez la **[documentation Plotly](https://plotly.com/chart-studio-help/json-chart-schema/#more-examples)** pour découvrir tous les types de graphiques disponibles.
:::


---
