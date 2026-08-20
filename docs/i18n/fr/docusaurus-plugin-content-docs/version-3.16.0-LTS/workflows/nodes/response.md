---
id: response
title: Nœud Response
---

<br/>

Le nœud Response définit le résultat final de votre workflow. Vous pouvez l'utiliser pour spécifier quelles données doivent être renvoyées une fois le workflow terminé. Les workflows peuvent inclure un seul nœud Response ou plusieurs, si vous souhaitez renvoyer des résultats différents selon des conditions ou des branches.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/workflows/nodes/v2/response-node.png" alt="Response Node" />

Chaque type de nœud d'un workflow remplit une fonction spécifique. En combinant ces nœuds, vous pouvez créer des flux d'automatisation puissants adaptés à votre logique métier. Le nœud Response, en particulier, vous permet de personnaliser ce que le workflow renvoie grâce à des expressions JavaScript.

Lorsqu'un workflow est exécuté, les données définies dans le nœud Response sont incluses dans la charge utile de la réponse. S'il est déclenché à l'intérieur d'une application ToolJet, les données renvoyées seront disponibles dans le même format qu'une réponse de requête classique.

## Renvoyer des données depuis un seul nœud

Prenons un workflow qui combine des données de ventes (depuis le nœud *getSalesData*) avec des données d'inventaire (depuis le nœud *getInventory*) via une opération JavaScript (dans le nœud *generateCSVData*).

<img className="screenshot-full img-full" src="/img/workflows/results/v2/response-nodes-preview.png" alt="Response Node Preview" />

Dans le nœud **Response**, spécifiez le résultat en utilisant une instruction return qui encapsule un objet entre parenthèses :

```js
return ({generateCSVData})
```

<img className="screenshot-full img-m" src="/img/workflows/nodes/response/single-node-code.png" alt="Single Node Response" />

## Renvoyer des données depuis plusieurs nœuds

Vous pouvez également renvoyer des données provenant d'autres nœuds. Vous pouvez renvoyer l'ensemble complet des données ou uniquement les portions nécessaires, comme illustré ci-dessous :

```js
return 
    ({sales: getSalesData.data,
    inventory: getInventory.data,
    csv: generateCSVData.data})
```

<img className="screenshot-full img-m" src="/img/workflows/nodes/response/multi-node-code.png" alt="Single Node Response" />
