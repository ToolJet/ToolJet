---
id: run-query
title: Run Query
---

L'action **Run Query** déclenche une requête lorsqu'un événement se produit. Utilisez-la pour charger ou modifier des données en réponse à une interaction de l'utilisateur — par exemple, exécuter une requête lorsqu'un bouton est cliqué ou qu'un formulaire est soumis.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Query | La requête à exécuter | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/run-query/run-query-v3.png" alt="ToolJet - Action reference -  Run Query" />

## Déclenchement via RunJS

```js
queries.<queryName>.run();
```
ou
```js
await actions.runQuery('<queryName>');
```

:::info
Lorsque vous déclenchez une requête avec `queries.<queryName>.run()`, vous pouvez éventuellement passer des **gestionnaires de fonctions de rappel (callback)** pour gérer les états de succès et d'échec de manière programmatique. Consultez [Callback Functions](/docs/data-sources/run-js#callback-functions) pour plus de détails.
:::

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
