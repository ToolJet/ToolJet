---
id: binding-data-to-components
title: Lier des données aux composants
---

Dans cette section, vous apprendrez à connecter et lier des données à des composants dans ToolJet, que les données proviennent d'une source de données ou d'autres composants de votre application.

Vous pouvez afficher les données de vos queries de sources de données dans les composants en utilisant la syntaxe `{{ }}`. Par exemple, vous pouvez transmettre des données à la propriété Data d'un composant **Table** en utilisant le format suivant : `{{ queries.<query-name>.data }}`

Par exemple, vous travaillez sur une application d'annuaire des employés où vous souhaitez afficher tous les employés dans un tableau. Si vous avez une query nommée *listEmployees* qui renvoie un tableau (array) d'objets employé, vous pouvez transmettre ses données à un composant **Table** en définissant la propriété data du tableau sur `{{queries.listEmployees.data}}`.

<img className="screenshot-full img-full" style={{marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/binding.png" alt="App Builder: bininding data to components"/>


ToolJet prend également en charge les expressions JavaScript à l'intérieur de `{{ }}`, vous permettant de transformer dynamiquement les données avant leur affichage. Voici quelques cas d'usage :

## Cas d'usage
### Filtrer les données
Si vous souhaitez afficher uniquement les employés du département « Engineering » :

```js
{{ queries.listEmployees.data
      .filter(employee => employee.department === 'Engineering') }}
```
### Transformer les données (Map)

Si vous souhaitez afficher uniquement les noms des employés dans une liste déroulante :

```js
{{ queries.listEmployees.data
      .map(employee => employee.name) }}
```

### Rendu conditionnel

Si vous souhaitez afficher un message de bienvenue lorsqu'un employé est sélectionné dans un tableau :

```js
{{ components.table1.selectedRow ? `Hello, ${components.table1.selectedRow.name}` : "" }}
```

### Enchaîner des expressions

Vous pouvez également enchaîner plusieurs méthodes JavaScript pour des transformations plus complexes. Par exemple, filtrer puis transformer (map) :

```js
{{ queries.listEmployees.data
     .filter(emp => emp.department === 'Engineering')
     .map(emp => emp.name.toUpperCase()) }}
```

Ces expressions vous donnent le contrôle sur la manière dont les données sont affichées et manipulées au sein de vos applications ToolJet.