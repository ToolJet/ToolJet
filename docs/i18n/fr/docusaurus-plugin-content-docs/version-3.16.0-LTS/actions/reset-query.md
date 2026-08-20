---
id: reset-query
title: Reset Query
---

L'action **Reset Query** réinitialise les données et l'état d'une requête à leurs valeurs initiales lorsqu'un événement se produit.

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Query | La requête à réinitialiser | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/reset-query/reset-query-v2.png" alt="ToolJet - Action reference -  Reset Query" />

## Déclenchement via RunJS

```js
queries.<queryName>.reset();
```
ou
```js
await actions.resetQuery('<queryName>');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
