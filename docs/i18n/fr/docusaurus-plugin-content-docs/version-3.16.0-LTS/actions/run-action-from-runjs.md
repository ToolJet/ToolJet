---
id: run-actions-from-runjs
title: Run Actions from RunJS query
---

Les actions sont normalement configurées via un gestionnaire d'événements dans l'App Builder, mais vous pouvez également les déclencher de manière programmatique depuis une requête RunJS en utilisant l'API `actions.*`. Cela est utile lorsque la logique est conditionnelle, doit s'exécuter dans une boucle, ou doit combiner plusieurs actions ensemble — consultez [Custom Code: Control Components](/docs/app-builder/custom-code/control-components) pour en savoir plus sur les cas où utiliser RunJS.

Cette page est une référence rapide de la syntaxe RunJS de chaque action, regroupées de la même manière que dans la [Référence des actions](/docs/actions/overview). Chaque entrée renvoie vers la page propre à l'action pour tous les détails sur les paramètres, les notes de comportement et les exemples.

<a id="abort-query"></a>

## Run Action

| Action | Syntaxe RunJS |
| --- | --- |
| [Run Query](/docs/actions/run-query) | `queries.<queryName>.run()` ou `await actions.runQuery('<queryName>')` |
| [Reset Query](/docs/actions/reset-query) | `queries.<queryName>.reset()` ou `await actions.resetQuery('<queryName>')` |
| [Abort Query](/docs/actions/abort-query) | `queries.<queryName>.abort()` ou `await actions.abortQuery('<queryName>')` |
| [Show Alert](/docs/actions/show-alert) | `actions.showAlert('<alertType>', '<message>')` |

<a id="show-modal"></a>

## Control Component

| Action | Syntaxe RunJS |
| --- | --- |
| [Control Component](/docs/actions/control-component) | `await components.<componentName>.<csaMethod>(<params>)` — invoquée directement sur le composant, et non via `actions.*` |
| [Show Modal](/docs/actions/show-modal) | `actions.showModal('<modalName>')` |
| [Close Modal](/docs/actions/close-modal) | `actions.closeModal('<modalName>')` |
| [Set Table Page](/docs/actions/set-table-page) | Non disponible via `actions.*` — utilisez `await components.<tableName>.setPage(<pageIndex>)` |
| [Scroll Component into View](/docs/actions/scroll-component-into-view) | `actions.scrollComponentInToView('<componentName>')` |

## Navigation

| Action | Syntaxe RunJS |
| --- | --- |
| [Switch Page](/docs/actions/switch-page) | `await actions.switchPage('<pageHandle>')` (avec éventuellement des paramètres de requête — voir la page de l'action) |
| [Go to App](/docs/actions/go-to-app) | `actions.goToApp('<slug>', queryParams)` |
| [Open Web Page](/docs/actions/open-webpage) | Non disponible via `actions.*` — utilisez `window.open('<url>', '_blank')` |

<a id="set-variables"></a>

## Variable

| Action | Syntaxe RunJS |
| --- | --- |
| [Set Page Variable](/docs/actions/set-page-variable) | `await actions.setPageVariable('<key>', <value>)` |
| [Unset Page Variable](/docs/actions/unset-page-variable) | `await actions.unsetPageVariable('<key>')` |
| [Unset All Page Variable](/docs/actions/unset-all-page-var) | `actions.unsetAllPageVariables()` |
| [Set Variable](/docs/actions/set-variable) | `actions.setVariable('<key>', <value>)` |
| [Unset Variable](/docs/actions/unset-variable) | `actions.unSetVariable('<key>')` |
| [Unset All Variable](/docs/actions/unset-all-var) | `actions.unsetAllVariables()` |

## Autres

| Action | Syntaxe RunJS |
| --- | --- |
| [Logout](/docs/actions/logout) | `actions.logout()` |
| [Generate File](/docs/actions/generate-file) | `actions.generateFile('<fileName>', '<fileType>', '<data>')` |
| [Set Local Storage](/docs/actions/set-localstorage) | `actions.setLocalStorage('<key>', '<value>')` |
| [Copy to Clipboard](/docs/actions/copy-to-clipboard) | `actions.copyToClipboard('<contentToCopy>')` |
| [Toggle App Mode](/docs/actions/toggle-app-mode) | `actions.toggleAppMode('<light\|dark>')` |

## Lecture des données de requête et de variable

Ce ne sont pas des actions — ce sont des getters permettant de lire immédiatement l'état juste après avoir déclenché une requête ou défini une variable dans la même requête RunJS.

### Données de requête

```js
await queries.getSalesData.run();
let value = queries.getSalesData.getData();       // données résolues
let raw = queries.getSalesData.getRawData();       // réponse brute
let loading = queries.getSalesData.getloadingState();
```

La réponse renvoyée par `actions.runQuery()` / `queries.queryName.run()` est un objet contenant à la fois le statut et les données, vous pouvez donc également la lire directement :

```js
const response = await actions.runQuery('getOrders', { limit: 10 });
return response;
// { status: "ok", data: [ { id: 1, customer_name: "John Doe", total: 250 } ] }
```

### Variables

```js
actions.setVariable('mode', 'dark');
return actions.getVariable('mode');
```

```js
actions.setPageVariable('number', 1);
return actions.getPageVariable('number');
```

## Exécuter plusieurs actions depuis une requête RunJS

Utilisez `async`/`await` pour enchaîner plusieurs actions ensemble. L'exemple ci-dessous exécute deux requêtes et affiche une alerte à intervalle fixe — consultez le guide complet sur [l'exécution de requêtes à intervalles spécifiés](/docs/app-builder/connecting-with-data-sources/run-query-at-specified-intervals).

```js
actions.setVariable('interval', setInterval(countdown, 5000));
async function countdown() {
  await queries.restapi1.run();
  await queries.restapi2.run();
  await actions.showAlert('info', 'This is an information');
}
```
