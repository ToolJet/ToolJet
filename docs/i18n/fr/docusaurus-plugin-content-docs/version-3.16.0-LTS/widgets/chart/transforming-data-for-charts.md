---
id: transforming-data-for-charts
title: Transformer les données pour les graphiques
---

Ce guide explique comment transformer des données à l'aide de RunJS et RunPy dans ToolJet et les visualiser à l'aide du composant chart. Le composant chart dans ToolJet permet de créer différents types de graphiques, avec la possibilité de s'intégrer à Plotly pour une personnalisation avancée et des visualisations plus poussées. Bien que ToolJet permette de se connecter à de multiples bases de données, API et sources de données pour l'intégration, ce guide se concentrera sur l'utilisation de ToolJet DB pour récupérer les données requises.

<div style={{paddingTop:'24px'}}>

## Tracer un simple graphique circulaire (Pie Chart)

Pour créer un simple graphique circulaire, les données ont été stockées dans la table avec la structure suivante dans ToolJet DB :

| <div style={{ width:"100px"}}> id </div> | <div style={{ width:"550px"}}> course </div> |
|:-- | :---- |
| 1 | Maths |
| 2 | Full Stack Web Development |
| 3 | Digital Marketing Strategy |
| 4 | Business Ethics |
| 5 | Maths |
| 6 | Full Stack Web Development |
| 7 | Digital Marketing Strategy |
| 8 | Financial Accounting |
| 9 | Maths |
| 10 | Chemistry |
| 11 | Financial Accounting |
| 12 | Physics |
| 13 | Full Stack Web Development |
| 14 | Maths |

### Requête pour récupérer les données

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez ToolJet Database comme source de données.
3. Sélectionnez votre table dans le menu déroulant.
4. Sélectionnez l'opération **List rows**.
5. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/pie-fetch-data.png" alt="Fetch Data Query" />

Cette requête récupérera les données depuis ToolJet DB.

### Transformer les données

Pour restructurer les données dans un format compatible avec le composant chart, nous allons utiliser une transformation RunJS.

Créez une nouvelle requête **RunJS** et ajoutez le code suivant :

```js
await queries.getRevenueDetails.run(); 

let data = queries.getRevenueDetails.getData(); 

const courseCounts = data.reduce((counts, obj) => {
  if (obj.course) {
    counts[obj.course] = (counts[obj.course] || 0) + 1;
  }
  return counts;
}, {});

const courseData = Object.keys(courseCounts).map(course => ({
     x: course, 
     y: courseCounts[course] 
}));

return {courseData};
```

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/pie-js-query.png" alt="Transform JS Query" />

Cette requête calculera le nombre d'occurrences de chaque cours et renverra un tableau d'objets pouvant être utilisé pour tracer le graphique circulaire.

### Tracer le graphique circulaire

1. Ajoutez un composant chart depuis la bibliothèque de composants disponible à droite du canevas.
2. Dans la section Properties, sélectionnez **Pie** comme type de graphique dans le menu déroulant.
3. Dans la section chart data, saisissez `{{queries.<Your RunJS Query Name>.data.courseData}}` pour injecter les données de la requête.

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/pie-chart.png" alt="Pie Chart" />

</div>

<div style={{paddingTop:'24px'}}>

## Tracer un graphique en ligne avec une transformation RunJS

Pour créer le graphique en ligne, les données ont été stockées dans la table avec la structure suivante dans ToolJet DB :

| <div style={{ width:"20px"}}> id </div> | <div style={{ width:"300px"}}> x </div> | <div style={{ width:"80px"}}> y </div> | <div style={{ width:"150px"}}> region </div> | <div style={{ width:"100px"}}> rdate </div>|
|:---|:--|:--|:-------|:-----|
| 1 | Social Media Engagement | 15 | North America | 15-01-2024 |
| 2 | Email Marketing | 10 | Europe | 10-02-2024 |
| 3 | SEO Optimization | 20 | Asia | 05-03-2024 |
| 4 | Content Creation | 25 | North America | 20-04-2024 |
| 5 | Paid Advertising | 30 | Europe | 12-05-2024 |
| 6 | Analytics and Reporting | 18 | Asia | 18-06-2024 |
| 7 | Influencer Marketing | 12 | North America | 30-07-2024 |
| 8 | Market Research | 22 | Europe | 25-08-2024 |
| 9 | Web Development | 17 | Asia | 15-09-2024 |
| 10 | Customer Relationship Management | 28 | North America | 02-10-2024 |

### Requête pour récupérer les données

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez ToolJet Database comme source de données.
3. Sélectionnez votre table dans le menu déroulant.
4. Sélectionnez l'opération **List rows**.
5. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/line-fetch-data.png" alt="Fetch Data Query" />

Cette requête récupérera les données depuis ToolJet DB.

### Transformer les données

Créez une nouvelle requête **RunJS** et ajoutez le code suivant :

```js
const data = queries.getLinechartData.data;

const calculateAverage = (arr) => arr.reduce((sum, item) => sum + item.y, 0) / arr.length;

const regionData = data.filter(item => item.region !== "Asia");

const transformedData = regionData.map(item => {
  if (item.rdate && typeof item.rdate === 'string') {
    const dateParts = item.rdate.split('-'); 
    
    if (dateParts.length === 3) {
      const year = dateParts[2];   
      const month = dateParts[1];  
      return {
        x: `${year}-${month}`,    
        y: item.y && !isNaN(item.y) ? item.y : 0 
      };
    }
  }

  return { x: 'Invalid Date', y: 0 };
});

const validData = transformedData.filter(item => item.x !== 'Invalid Date');
const averageY = calculateAverage(validData);

const finalData = transformedData.map(item => ({
  x: item.x,
  y: item.y - averageY 
}));

return finalData;
```

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/line-js-query.png" alt="Transform JS Query" style={{marginBottom:'15px'}}/>

### Tracer le graphique en ligne

1. Ajoutez un composant chart depuis la bibliothèque de composants disponible à droite du canevas.
2. Dans la section Properties, sélectionnez **Line** comme type de graphique dans le menu déroulant.
3. Dans la section chart data, saisissez `{{queries.<Your RunJS Query Name>.data}}` pour injecter les données de la requête.

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/line-chart.png" alt="Line Chart" />

</div>

<div style={{paddingTop:'24px'}}>

## Tracer un graphique en chandeliers avec Plotly

Pour créer un graphique en chandeliers, les données ont été stockées dans la table avec la structure suivante dans ToolJet DB :

| <div style={{ width:"60px"}}> id </div> | <div style={{ width:"150px"}}> sdate </div> | <div style={{ width:"100px"}}> open </div> | <div style={{ width:"100px"}}> high </div> | <div style={{ width:"100px"}}> low </div> | <div style={{ width:"100px"}}> sclose </div> |
|:---|:------|:-----|:-----|:----|:-------|
| 1 | 2024-04-02 | 115 | 125 | 115 | 120 |
| 2 | 2024-04-03 | 120 | 130 | 120 | 125 |
| 3 | 2024-04-04 | 125 | 135 | 125 | 130 |

### Requête pour récupérer les données

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez ToolJet Database comme source de données.
3. Sélectionnez votre table dans le menu déroulant.
4. Sélectionnez l'opération **List rows**.
5. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/cs-fetch-data.png" alt="Fetch Data Query" />

Cette requête récupérera les données depuis ToolJet DB.

### Transformer les données

Pour restructurer les données dans un format compatible avec le composant chart, nous allons utiliser une transformation RunJS.

Créez une nouvelle requête **RunJS** et ajoutez le code suivant :

```js
const dbData = queries.getCandlestickData.data;

if (!Array.isArray(dbData) || dbData.length === 0) {
  return { plotData: [] };
}

let dates = [];
let openPrices = [];
let highPrices = [];
let lowPrices = [];
let closePrices = [];

dbData.forEach(row => {
  dates.push(String(row.sdate)); 
  openPrices.push(row.open);    
  highPrices.push(row.high);      
  lowPrices.push(row.low);     
  closePrices.push(row.sclose);
});

const transformedData = [
  {
    x: dates,
    open: openPrices,
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    type: 'candlestick'
  }
];

let result = {
  data: transformedData
};

return JSON.stringify(result)
```

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/cs-js-query.png" alt="Transform JS Query" style={{marginBottom:'15px'}}/>

### Tracer le graphique en chandeliers

1. Ajoutez un composant chart depuis la bibliothèque de composants disponible à droite du canevas.
2. Activez use plotly JSON schema dans la section Plotly JSON Chart Schema.
3. Dans la section JSON Description, saisissez `{{queries.<Your RunJS Query Name>.data}}` pour injecter les données de la requête.

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/cs-chart.png" alt="Candlestick Chart" />

</div>

<div style={{paddingTop:'24px'}}>

## Tracer un graphique heatmap avec Plotly

Pour créer un graphique heatmap, les données ont été stockées dans la table avec la structure suivante dans ToolJet DB :

| <div style={{ width:"60px"}}> id </div> | <div style={{ width:"150px"}}> x </div> | <div style={{ width:"100px"}}> y </div> | <div style={{ width:"100px"}}> value </div> |
|:---|:------|:-----|:-----|
| 1 | 0 | 0 | 0.32 |
| 2 | 0 | 1 | 0.95 |
| 3 | 0 | 2 | 0.57 |
| 4 | 0 | 3 | 0.08 |
| 5 | 0 | 4 | 0.82 |
| 6 | 0 | 5 | 0.33 |
| 7 | 0 | 6 | 0.9 |
| 8 | 0 | 7 | 0.11 |
| 9 | 0 | 8 | 0.73 |
| 10 | 0 | 9 | 0.39 |

### Requête pour récupérer les données

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez ToolJet Database comme source de données.
3. Sélectionnez votre table dans le menu déroulant.
4. Sélectionnez l'opération **List rows**.
5. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/hm-fetch-data.png" alt="Fetch Data Query" />

Cette requête récupérera les données depuis ToolJet DB.

### Transformer les données

Pour restructurer les données dans un format compatible avec le composant chart, nous allons utiliser une transformation RunPy.

Créez une nouvelle requête **RunPy** et ajoutez le code suivant :

```py
import pandas as pd
import json

data_raw = queries.fetchHeatmapData.getData()

data = data_raw.to_py() if hasattr(data_raw, 'to_py') else list(data_raw)

df = pd.DataFrame(data)
heatmap_data = df.pivot(index='y', columns='x', values='value')

x_labels = [f"Column {i}" for i in heatmap_data.columns.tolist()] 
y_labels = [f"Row {i}" for i in heatmap_data.index.tolist()]

output = {
  "data": [
    {
      "z": heatmap_data.values.tolist(),  
      "x": x_labels,
      "y": y_labels,
      "type": "heatmap"
    }
  ]
}

output_str = json.dumps(output)

output_str
```

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/hm-py-query.png" alt="Transform JS Query" style={{marginBottom:'15px'}}/>

### Tracer le graphique heatmap

1. Ajoutez un composant chart depuis la bibliothèque de composants disponible à droite du canevas.
2. Activez use plotly JSON schema dans la section Plotly JSON Chart Schema.
3. Dans la section JSON Description, saisissez `{{queries.<Your RunJS Query Name>.data}}` pour injecter les données de la requête.

<img className="screenshot-full" src="/img/widgets/chart/transforming-data/hm-chart.png" alt="Heatmap Chart" />


</div>
